import connectDB from '@/lib/mongodb'
import Store from '@/models/Store'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()
    const stores = await Store.find({ isActive: true }).select('name username address').lean()
    const mapped = stores.map(s => {
      let city = ''
      if (typeof s.address === 'string') {
        const parts = s.address.split(',')
        city = parts.length ? parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim() || '' : ''
      }
      return { id: s._id.toString(), name: s.name, username: s.username, city, address: s.address || '' }
    })
    return NextResponse.json({ stores: mapped })
  } catch (err) {
    console.error('stores GET error', err)
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 })
  }
}
