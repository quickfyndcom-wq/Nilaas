import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Category from '@/models/Category';
import Store from '@/models/Store';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { NILAAS_FASHION_CATEGORIES, normalizeCategorySlug } from '@/lib/fashion-categories';

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
  const store = await Store.findOne({ userId: decoded.uid }).lean();

  if (!isAdmin && !store) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { uid: decoded.uid, email: decoded.email };
}

export async function POST(req) {
  try {
    await connectDB();
    const auth = await authorize(req);
    if (auth.error) return auth.error;

    let created = 0;
    let skipped = 0;

    for (const parent of NILAAS_FASHION_CATEGORIES) {
      const parentSlug = normalizeCategorySlug(parent.name);
      let parentDoc = await Category.findOne({ slug: parentSlug });

      if (!parentDoc) {
        parentDoc = await Category.create({
          name: parent.name,
          slug: parentSlug,
          description: parent.description || null,
          image: null,
          parentId: null,
        });
        created += 1;
      } else {
        skipped += 1;
      }

      for (const child of parent.children || []) {
        const childSlug = normalizeCategorySlug(child.name);
        const existingChild = await Category.findOne({ slug: childSlug });
        if (existingChild) {
          skipped += 1;
          continue;
        }
        await Category.create({
          name: child.name,
          slug: childSlug,
          description: child.description || null,
          image: null,
          parentId: parentDoc._id.toString(),
        });
        created += 1;
      }
    }

    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      message:
        created > 0
          ? `Added ${created} fashion categories for Nilaas`
          : 'Fashion categories already set up',
      created,
      skipped,
      categories,
    });
  } catch (error) {
    console.error('seed-fashion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed categories' },
      { status: 500 }
    );
  }
}
