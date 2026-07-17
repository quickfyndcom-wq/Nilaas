import { NextResponse } from 'next/server'
import { auth as adminAuth } from '@/lib/firebase-admin'
import connectDB from '@/lib/mongoose'
import User from '@/models/User'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { email, phoneNumber } = await req.json()

    await connectDB()

    // Update or create user profile in database
    const updateData = {}
    if (email) updateData.email = email
    if (phoneNumber) updateData.phone = phoneNumber

    await User.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { upsert: true, new: true }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    })
  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
