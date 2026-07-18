import { NextResponse } from 'next/server'
import { auth as adminAuth } from '@/lib/firebase-admin'
import connectDB from '@/lib/mongoose'
import Category from '@/models/Category'
import Store from '@/models/Store'

export const runtime = 'nodejs'
export const maxDuration = 30

const QUICKFYND_ORIGIN = 'https://www.quickfynd.com'
const ALLOWED_HOSTS = new Set(['quickfynd.com', 'www.quickfynd.com'])

async function authorize(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      ),
    }
  }

  await connectDB()
  const allowedEmail = (
    process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    ''
  ).toLowerCase()
  const isAdmin = decoded.email?.toLowerCase() === allowedEmail
  const store = await Store.findOne({ userId: decoded.uid }).select('_id').lean()

  if (!isAdmin && !store) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { uid: decoded.uid }
}

function parseProductUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl || '').trim())
  } catch {
    throw new Error('Enter a valid QuickFynd product URL')
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('Only product URLs from quickfynd.com are allowed')
  }

  const match = url.pathname.match(/^\/product\/([^/?#]+)\/?$/i)
  if (!match?.[1]) {
    throw new Error('Use a QuickFynd product URL like quickfynd.com/product/product-name')
  }

  return {
    slug: decodeURIComponent(match[1]).trim(),
    sourceUrl: `${QUICKFYND_ORIGIN}/product/${encodeURIComponent(
      decodeURIComponent(match[1]).trim()
    )}`,
  }
}

async function fetchQuickFyndJson(path) {
  const response = await fetch(`${QUICKFYND_ORIGIN}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Nilaas-Product-Importer/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    if (response.status === 404) throw new Error('Product not found on QuickFynd')
    throw new Error(`QuickFynd returned HTTP ${response.status}`)
  }

  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > 5 * 1024 * 1024) {
    throw new Error('QuickFynd response is too large')
  }
  return response.json()
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function closestLocalCategory(sourceNames, localNames) {
  for (const sourceName of sourceNames) {
    const source = String(sourceName).toLowerCase()
    const exact = localNames.find((name) => name.toLowerCase() === source)
    if (exact) return exact

    const partial = localNames.find((name) => {
      const local = name.toLowerCase()
      return source.includes(local) || local.includes(source)
    })
    if (partial) return partial
  }
  return ''
}

export async function POST(req) {
  try {
    const auth = await authorize(req)
    if (auth.error) return auth.error

    const { url } = await req.json()
    const { slug, sourceUrl } = parseProductUrl(url)

    const [productPayload, categoryPayload, localCategories] = await Promise.all([
      fetchQuickFyndJson(`/api/products/by-slug?slug=${encodeURIComponent(slug)}`),
      fetchQuickFyndJson('/api/categories').catch(() => ({ categories: [] })),
      Category.find({}).select('name').sort({ name: 1 }).lean(),
    ])

    const product = productPayload?.product
    if (!product?._id || !product?.name) {
      return NextResponse.json(
        { error: 'QuickFynd product data was not found' },
        { status: 404 }
      )
    }

    const remoteCategories = Array.isArray(categoryPayload?.categories)
      ? categoryPayload.categories
      : []
    const categoryMap = new Map(
      remoteCategories.map((category) => [String(category._id), category.name])
    )
    const remoteCategoryIds = unique([
      product.category,
      ...(Array.isArray(product.categories) ? product.categories : []),
    ])
    const remoteCategoryNames = unique(
      remoteCategoryIds.map((id) => categoryMap.get(String(id)) || id)
    )
    const localCategoryNames = unique(localCategories.map((category) => category.name))
    const category = closestLocalCategory(remoteCategoryNames, localCategoryNames)

    const sourceVariants = Array.isArray(product.variants) ? product.variants : []
    const variants = sourceVariants.slice(0, 100).map((variant) => {
      const options = variant?.options || {}
      return {
        color: String(options.color || ''),
        size: String(options.size || ''),
        title: String(options.title || ''),
        sku: String(variant?.sku || ''),
        stock: Math.max(0, Number(variant?.stock) || 0),
        price: Math.max(0, Number(variant?.price) || 0),
        mrp: Math.max(0, Number(variant?.mrp || variant?.AED) || 0),
        image: String(variant?.image || options.image || ''),
      }
    })

    const colors = unique([
      ...(Array.isArray(product.colors) ? product.colors : []),
      ...variants.map((variant) => variant.color),
    ])
    const sizes = unique([
      ...(Array.isArray(product.sizes) ? product.sizes : []),
      ...variants.map((variant) => variant.size),
    ])
    const attributes = product.attributes || {}

    return NextResponse.json({
      success: true,
      sourceUrl,
      product: {
        name: String(product.name || '').trim(),
        slug: String(product.slug || slug).trim(),
        brand: String(product.brand || attributes.brand || 'Nilaas').trim() || 'Nilaas',
        shortDescription: String(
          product.shortDescription || attributes.shortDescription || ''
        ).trim(),
        description: String(product.description || '').trim(),
        price: Math.max(0, Number(product.price) || 0),
        mrp: Math.max(0, Number(product.mrp || product.AED) || 0),
        images: unique(Array.isArray(product.images) ? product.images : []).slice(0, 8),
        category,
        sourceCategories: remoteCategoryNames,
        sku: String(product.sku || '').trim(),
        stockQuantity: Math.max(0, Number(product.stockQuantity) || 0),
        colors,
        sizes,
        tags: unique([
          ...(Array.isArray(product.tags) ? product.tags : []),
          ...(Array.isArray(product.seoKeywords) ? product.seoKeywords : []),
        ]).slice(0, 20),
        badges: unique(
          Array.isArray(attributes.badges) ? attributes.badges : []
        ).slice(0, 8),
        fastDelivery: product.fastDelivery === true,
        allowReturn: product.allowReturn !== false,
        allowReplacement: product.allowReplacement !== false,
        generalDetails: Array.isArray(product.mobileSpecs)
          ? product.mobileSpecs
              .filter((item) => item?.label || item?.value)
              .map((item) => ({
                label: String(item.label || ''),
                value: String(item.value || ''),
              }))
          : [],
        variants,
      },
    })
  } catch (error) {
    console.error('QuickFynd product import error:', error)
    const message =
      error?.name === 'TimeoutError'
        ? 'QuickFynd took too long to respond'
        : error?.message || 'Product import failed'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
