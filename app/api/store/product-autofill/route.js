import { NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/configs/openai';
import { auth as adminAuth } from '@/lib/firebase-admin';
import connectDB from '@/lib/mongoose';
import Category from '@/models/Category';
import Store from '@/models/Store';

export const runtime = 'nodejs';
export const maxDuration = 60;

function extractJson(raw = '') {
  const cleaned = String(raw)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI did not return valid JSON');
  }
}

async function authorize(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.split(' ')[1]);
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
  }

  const allowedEmail = (
    process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    ''
  ).toLowerCase();
  const isAdmin = decoded.email?.toLowerCase() === allowedEmail;
  await connectDB();
  const store = await Store.findOne({ userId: decoded.uid }).lean();
  if (!isAdmin && !store) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { uid: decoded.uid, email: decoded.email };
}

export async function POST(req) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is disabled. Set OPENAI_API_KEY in .env and restart the server.' },
        { status: 503 }
      );
    }

    const auth = await authorize(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      notes = '',
      includeVariants = true,
      brand = 'Nilaas',
    } = body || {};

    if (!imageBase64) {
      return NextResponse.json({ error: 'Product image is required' }, { status: 400 });
    }

    // Keep payload smaller for vision APIs
    const rawBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '');
    if (rawBase64.length > 8_000_000) {
      return NextResponse.json(
        { error: 'Image too large for AI. Use a smaller photo or lower quality.' },
        { status: 400 }
      );
    }

    const categories = await Category.find({})
      .select('name slug parentId')
      .sort({ name: 1 })
      .lean();

    const categoryNames = categories.map((c) => c.name).filter(Boolean);
    const parentNames = categories.filter((c) => !c.parentId).map((c) => c.name);
    const childNames = categories.filter((c) => c.parentId).map((c) => c.name);

    const model =
      process.env.OPENAI_PRODUCT_AUTOFILL_MODEL ||
      process.env.OPENAI_MODEL ||
      'gpt-4.1-mini';

    const system = `You are a product listing assistant for Nilaas (nilaas.in), an Indian ladies fashion ecommerce store.
Analyze the product photo and any seller notes. Return ONLY raw JSON (no markdown fences).

STRICT RULES:
- Do NOT invent or return any prices, MRP, sale price, or currency amounts anywhere (not in JSON keys and not inside description HTML).
- Prefer categories from the provided store category list. If none fit, pick the closest fashion category name.
- Brand default is "${brand}" unless notes say otherwise.
- Write marketing copy suitable for Indian women fashion (kurtis, sarees, dresses, co-ords, etc.).
- Colors/sizes should be realistic for the garment seen.
- SKUs: short codes like NL-KUR-PNK-M (brand prefix + type + color + size).

DESCRIPTION (critical — "Full product story"):
- Field "description" MUST be rich HTML (not plain text, not markdown).
- Make it detailed and useful for shoppers (multiple sections).
- REQUIRED structure inside description HTML:
  1) <h2>About this piece</h2> + 2–3 <p> paragraphs (style, fabric look, occasions, how to style).
  2) <h2>Key highlights</h2> + <ul><li>…</li></ul> (6–10 bullets: neckline, sleeves, fit, length, print/embroidery, lining, etc.).
  3) <h2>Product specifications</h2> + an HTML <table> with rows like Fabric, Color, Fit, Sleeve, Neck, Length, Occasion, Pattern, Transparency, Package contents.
  4) <h2>Size & fit guide</h2> + short tip <p> + an HTML <table> with columns Size | Bust (in) | Waist (in) | Hip (in) | Length (in) for XS–XXL (or Free Size row if applicable). Use realistic Indian ethnic/western garment ranges; no prices.
  5) <h2>Care instructions</h2> + <table> or <ul> for wash/iron/dry-clean tips.
- Tables MUST use real HTML: <table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>
- Allowed tags only: h2, h3, p, ul, ol, li, strong, em, table, thead, tbody, tr, th, td, br.
- shortDescription: one punchy sentence (max ~160 chars).

JSON schema:
{
  "name": string,
  "brand": string,
  "shortDescription": string,
  "description": string,
  "category": string,
  "tags": string[],
  "badges": string[],
  "colors": string[],
  "sizes": string[],
  "sku": string,
  "stockQuantity": number,
  "fabricDetails": [{"label": string, "value": string}],
  "generalDetails": [{"label": string, "value": string}],
  "variants": [{"color": string, "size": string, "sku": string, "stock": number}]
}

Allowed badges examples: "New Arrival", "Best Seller", "Trending", "Festive Special", "Limited Edition", "Hot Deal", "Sale", "Free Shipping".
${includeVariants ? 'Include color×size variants when sizes/colors apply (max 24 rows).' : 'Set "variants" to [].'}
Never include price, AED, mrp, sellingPrice, or cost fields.`;

    const userText = [
      'Fill a complete ladies fashion product listing from this image.',
      'Make the description detailed with HTML headings, bullet highlights, AND at least two HTML tables (specifications + size guide).',
      notes?.trim() ? `Seller notes (trust these when provided):\n${notes.trim()}` : 'No extra seller notes.',
      categoryNames.length
        ? `Available categories (prefer these exact names):\nParents: ${parentNames.join(', ')}\nSubcategories: ${childNames.join(', ')}`
        : 'No categories in DB yet — invent a sensible fashion category name (e.g. Kurtis, Dresses).',
      includeVariants
        ? 'Also propose size/color variants with unique SKUs and suggested stock (default stock 5).'
        : 'Do not propose variants.',
    ].join('\n\n');

    const response = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${rawBase64}`,
              },
            },
          ],
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);

    // Strip any price fields the model may still return (do not touch description HTML string)
    const stripPriceKeys = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const banned = /^(price|mrp|aed|cost|amount|sellingPrice|salePrice)$/i;
      for (const key of Object.keys(obj)) {
        if (key === 'description' || key === 'shortDescription') continue;
        if (banned.test(key)) delete obj[key];
        else if (Array.isArray(obj[key])) obj[key].forEach(stripPriceKeys);
        else if (typeof obj[key] === 'object') stripPriceKeys(obj[key]);
      }
      return obj;
    };
    stripPriceKeys(parsed);

    // Light cleanup: remove currency/price phrases from description if model slipped
    if (typeof parsed.description === 'string') {
      parsed.description = parsed.description
        .replace(/₹\s*[\d,]+(\.\d+)?/g, '')
        .replace(/\b(MRP|sale price|selling price)\b[:\s]*[\d,]+\b/gi, '')
        .trim();
    }

    const matchCategory = (name) => {
      if (!name) return '';
      const exact = categoryNames.find((c) => c.toLowerCase() === String(name).toLowerCase());
      if (exact) return exact;
      const partial = categoryNames.find(
        (c) =>
          c.toLowerCase().includes(String(name).toLowerCase()) ||
          String(name).toLowerCase().includes(c.toLowerCase())
      );
      return partial || name;
    };

    const colors = Array.isArray(parsed.colors) ? parsed.colors.map(String).filter(Boolean) : [];
    const sizes = Array.isArray(parsed.sizes) ? parsed.sizes.map(String).filter(Boolean) : [];
    let variants = Array.isArray(parsed.variants) ? parsed.variants : [];
    if (!includeVariants) variants = [];
    variants = variants
      .slice(0, 24)
      .map((v) => ({
        color: String(v?.color || ''),
        size: String(v?.size || ''),
        sku: String(v?.sku || ''),
        stock: Number(v?.stock) >= 0 ? Number(v.stock) : 5,
      }))
      .filter((v) => v.color || v.size);

    return NextResponse.json({
      success: true,
      product: {
        name: String(parsed.name || '').trim(),
        brand: String(parsed.brand || brand).trim(),
        shortDescription: String(parsed.shortDescription || '').trim(),
        description: String(parsed.description || '').trim(),
        category: matchCategory(parsed.category),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean).slice(0, 12) : [],
        badges: Array.isArray(parsed.badges) ? parsed.badges.map(String).filter(Boolean).slice(0, 6) : [],
        colors,
        sizes,
        sku: String(parsed.sku || '').trim(),
        stockQuantity:
          Number(parsed.stockQuantity) >= 0 ? Number(parsed.stockQuantity) : sizes.length ? sizes.length * 5 : 10,
        fabricDetails: Array.isArray(parsed.fabricDetails) ? parsed.fabricDetails : [],
        generalDetails: Array.isArray(parsed.generalDetails) ? parsed.generalDetails : [],
        variants,
      },
    });
  } catch (error) {
    console.error('product-autofill error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'AI autofill failed' },
      { status: 500 }
    );
  }
}
