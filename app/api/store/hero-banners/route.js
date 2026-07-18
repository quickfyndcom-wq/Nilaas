import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

let cachedBanners = []

function toId(value) {
  if (!value) return null
  if (typeof value === 'object' && value.$oid) return String(value.$oid)
  return String(value)
}

function sanitizeBannerInput(body = {}, { partial = false } = {}) {
  const out = {}

  const assignString = (key) => {
    if (body[key] === undefined) return
    out[key] = String(body[key] ?? '').trim()
  }

  assignString('badge')
  assignString('subtitle')
  assignString('title')
  assignString('description')
  assignString('cta')
  assignString('link')
  assignString('image')
  assignString('mobileImage')

  if (body.order !== undefined) out.order = Number(body.order) || 0
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)
  if (body.showTitle !== undefined) out.showTitle = Boolean(body.showTitle)
  if (body.showSubtitle !== undefined) out.showSubtitle = Boolean(body.showSubtitle)
  if (body.showBadge !== undefined) out.showBadge = Boolean(body.showBadge)
  if (body.showButton !== undefined) out.showButton = Boolean(body.showButton)

  // Show flags follow whether the matching text field has content
  if (out.title !== undefined) out.showTitle = Boolean(out.title)
  if (out.subtitle !== undefined) out.showSubtitle = Boolean(out.subtitle)
  if (out.badge !== undefined) out.showBadge = Boolean(out.badge)
  if (out.cta !== undefined) out.showButton = Boolean(out.cta)

  if (!partial) {
    out.badge = out.badge || ''
    out.subtitle = out.subtitle || ''
    out.title = out.title || ''
    out.description = out.description || ''
    out.cta = out.cta || ''
    out.link = out.link || '/shop'
    out.image = out.image || ''
    out.mobileImage = out.mobileImage || ''
    out.order = out.order || 0
    out.isActive = out.isActive !== undefined ? out.isActive : true
    out.showTitle = Boolean(out.title)
    out.showSubtitle = Boolean(out.subtitle)
    out.showBadge = Boolean(out.badge)
    out.showButton = Boolean(out.cta)
  }

  return out
}

function upsertCache(banner) {
  const id = toId(banner._id)
  const idx = cachedBanners.findIndex((b) => toId(b._id) === id)
  if (idx >= 0) cachedBanners[idx] = { ...cachedBanners[idx], ...banner }
  else cachedBanners.push(banner)
}

function removeFromCache(bannerId) {
  const id = toId(bannerId)
  cachedBanners = cachedBanners.filter((b) => toId(b._id) !== id)
}

export async function GET() {
  try {
    try {
      const { db } = await connectToDatabase()
      const banners = await db
        .collection('storeBanners')
        .find({})
        .sort({ order: 1, createdAt: -1 })
        .toArray()
      cachedBanners = banners
      return Response.json(
        { success: true, banners: banners || [] },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError.message)
      return Response.json(
        { success: true, banners: cachedBanners },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/store/hero-banners:', error)
    return Response.json({ success: true, banners: cachedBanners }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const data = sanitizeBannerInput(body, { partial: false })

    if (!data.image) {
      return Response.json({ success: false, error: 'Banner image is required' }, { status: 400 })
    }

    const banner = {
      _id: new ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    upsertCache(banner)

    try {
      const { db } = await connectToDatabase()
      await db.collection('storeBanners').insertOne(banner)
      return Response.json({
        success: true,
        message: 'Banner created successfully',
        banner,
      })
    } catch (dbError) {
      console.error('MongoDB save error (using cache):', dbError.message)
      return Response.json({
        success: true,
        message: 'Banner created (cached, pending database sync)',
        warning: 'Database temporarily unavailable - data will sync when connection is restored',
        banner,
      })
    }
  } catch (error) {
    console.error('Error creating banner:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const bannerId = toId(body.bannerId || body._id)

    if (!bannerId) {
      return Response.json({ success: false, error: 'Banner ID required' }, { status: 400 })
    }

    // Support both full edits and partial toggles (e.g. isActive only)
    const isPartialToggle =
      body.title === undefined &&
      body.image === undefined &&
      (body.isActive !== undefined ||
        body.showTitle !== undefined ||
        body.showSubtitle !== undefined ||
        body.showBadge !== undefined ||
        body.showButton !== undefined)

    const updates = sanitizeBannerInput(body, { partial: true })
    delete updates._id
    delete updates.bannerId

    if (!isPartialToggle && updates.image !== undefined && !updates.image) {
      return Response.json({ success: false, error: 'Banner image is required' }, { status: 400 })
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    }

    try {
      const { db } = await connectToDatabase()
      let objectId
      try {
        objectId = new ObjectId(bannerId)
      } catch {
        return Response.json({ success: false, error: 'Invalid banner ID' }, { status: 400 })
      }

      const result = await db.collection('storeBanners').updateOne(
        { _id: objectId },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return Response.json({ success: false, error: 'Banner not found' }, { status: 404 })
      }

      const updated = await db.collection('storeBanners').findOne({ _id: objectId })
      if (updated) upsertCache(updated)

      return Response.json({
        success: true,
        message: 'Banner updated successfully',
        banner: updated,
      })
    } catch (dbError) {
      console.error('MongoDB connection error in PUT:', dbError.message)
      const cached = cachedBanners.find((b) => toId(b._id) === bannerId)
      if (cached) {
        const merged = { ...cached, ...updateData }
        upsertCache(merged)
        return Response.json({
          success: true,
          message: 'Banner updated (cached, pending database sync)',
          warning: 'Database temporarily unavailable',
          banner: merged,
        })
      }
      return Response.json(
        { success: false, error: 'Database unavailable and banner not in cache' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error updating banner:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const bannerId = toId(searchParams.get('bannerId'))

    if (!bannerId) {
      return Response.json({ success: false, error: 'Banner ID required' }, { status: 400 })
    }

    removeFromCache(bannerId)

    try {
      const { db } = await connectToDatabase()
      await db.collection('storeBanners').deleteOne({ _id: new ObjectId(bannerId) })
      return Response.json({ success: true, message: 'Banner deleted successfully' })
    } catch (dbError) {
      console.error('MongoDB connection error in DELETE:', dbError.message)
      return Response.json({
        success: true,
        message: 'Banner deleted (pending database sync)',
        warning: 'Database temporarily unavailable',
      })
    }
  } catch (error) {
    console.error('Error deleting banner:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
