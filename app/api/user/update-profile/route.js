import { NextResponse } from 'next/server'
import { auth as adminAuth } from '@/lib/firebase-admin'
import connectDB from '@/lib/mongoose'
import User from '@/models/User'

async function getUid(req) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split('Bearer ')[1]
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded
}

/** Load saved profile from MongoDB (phone lives here, not in Firebase Auth) */
export async function GET(req) {
  try {
    const decoded = await getUid(req)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(decoded.uid).lean()

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.uid,
        name: user?.name || decoded.name || '',
        email: user?.email || decoded.email || '',
        phone: user?.phone || '',
        image: user?.image || decoded.picture || '',
      },
    })
  } catch (err) {
    console.error('[GET PROFILE ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to load profile' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const decoded = await getUid(req)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const uid = decoded.uid

    const body = await req.json()
    const { email, phoneNumber, name } = body || {}

    await connectDB()

    const updateData = {}
    if (typeof name === 'string') updateData.name = name.trim()
    if (typeof email === 'string' && email.trim()) updateData.email = email.trim()
    if (typeof phoneNumber === 'string') updateData.phone = phoneNumber.trim()

    const user = await User.findOneAndUpdate(
      { _id: uid },
      {
        $set: updateData,
        $setOnInsert: {
          _id: uid,
          email: email || decoded.email || '',
          name: name || decoded.name || '',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: uid,
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        image: user?.image || '',
      },
    })
  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
