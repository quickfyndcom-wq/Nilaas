import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import connectDB from '@/lib/mongoose'
import Category from '@/models/Category'

// In-memory cache
let cachedCategories = []
let cachedHeading = {
  title: 'Shop by category',
  subtitle: 'Find your next favourite look'
}
let cachedPayload = null
let lastFetchTs = 0

const CACHE_TTL_MS = 60 * 1000 // 1 minute

function mapCategory(cat) {
  return {
    _id: cat._id,
    title: cat.name,
    image: cat.image || '',
    link: `/category/${cat.slug || cat._id}`,
    isActive: true
  }
}

export async function GET() {
  try {
    // Fast path: serve warm non-empty cache
    if (
      cachedPayload &&
      Array.isArray(cachedPayload.categories) &&
      cachedPayload.categories.length > 0 &&
      Date.now() - lastFetchTs < CACHE_TTL_MS
    ) {
      return Response.json(cachedPayload, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      })
    }

    try {
      // Settings live in the native-driver DB; categories live in the mongoose DB.
      const [{ db }, ] = await Promise.all([
        connectToDatabase(),
        connectDB()
      ])

      const settingsDoc = await db.collection('storeSettings').findOne(
        { _id: 'homepage' },
        {
          projection: {
            'data.shopCategoriesHeading': 1,
            'data.shopCategoriesDisplay': 1
          }
        }
      )

      const settings = settingsDoc?.data || {}
      const heading = {
        title: settings?.shopCategoriesHeading?.title || 'Shop by category',
        subtitle:
          settings?.shopCategoriesHeading?.subtitle || 'Find your next favourite look'
      }
      const selectedIds = Array.isArray(settings?.shopCategoriesDisplay?.selectedIds)
        ? settings.shopCategoriesDisplay.selectedIds.map((id) => String(id))
        : []

      const categories = await Category.find({})
        .select('name slug image parentId')
        .sort({ name: 1 })
        .limit(200)
        .lean()

      const topLevelCategories = categories.filter((cat) => !cat.parentId)
      const baseMapped = topLevelCategories.map(mapCategory)

      let mappedCategories = baseMapped.slice(0, 7)

      if (selectedIds.length > 0) {
        const selectedSet = new Set(selectedIds)
        const selectedPool = baseMapped.filter((cat) =>
          selectedSet.has(String(cat._id))
        )

        const orderedSelected = selectedIds
          .map((id) => selectedPool.find((cat) => String(cat._id) === id))
          .filter(Boolean)
          .slice(0, 7)

        // Stale selected IDs → fall back to top categories instead of a blank UI
        mappedCategories =
          orderedSelected.length > 0 ? orderedSelected : mappedCategories
      }

      cachedCategories = mappedCategories
      cachedHeading = heading
      cachedPayload = {
        success: true,
        categories: mappedCategories,
        heading
      }
      lastFetchTs = Date.now()

      return Response.json(cachedPayload, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      })
    } catch (dbError) {
      console.error('✗ Shop categories MongoDB error:', dbError.message)
      return Response.json({
        success: true,
        categories: cachedCategories,
        heading: cachedHeading
      })
    }
  } catch (error) {
    console.error('✗ Shop categories error:', error)
    return Response.json({
      success: true,
      categories: cachedCategories,
      heading: cachedHeading
    })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const category = {
      _id: new ObjectId(),
      title: body.title || '',
      image: body.image || '',
      link: body.link || '/shop',
      order: body.order || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    cachedCategories.push(category)
    cachedPayload = null

    try {
      const { db } = await connectToDatabase()
      await db.collection('shopCategories').insertOne(category)
      return Response.json({
        success: true,
        message: 'Category created successfully',
        category
      })
    } catch (dbError) {
      console.error('⚠ MongoDB save error:', dbError.message)
      return Response.json({
        success: true,
        message: 'Category created (cached)',
        category
      })
    }
  } catch (error) {
    console.error('✗ Error creating category:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
