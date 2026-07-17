'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/lib/useAuth'
import Link from 'next/link'
import Image from 'next/image'

export default function AllStoresPage() {
  const { getToken } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllStores()
  }, [])

  const fetchAllStores = async () => {
    try {
      // Check for admin session first
      const adminSession = localStorage.getItem('adminSession')
      let headers = {}
      
      if (adminSession) {
        headers['x-admin-session'] = adminSession
      } else {
        const token = await getToken()
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const { data } = await axios.get('/api/store/stores', { headers })
      setStores(data.stores || [])
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading stores...</div>

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">All Stores</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-4 mb-4">
              {store.logo && (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{store.name}</h2>
                <p className="text-sm text-gray-500">{store.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Status:</span> {store.status}</p>
              <p><span className="font-medium">Products:</span> {store.productsCount || 0}</p>
              <p><span className="font-medium">Orders:</span> {store.ordersCount || 0}</p>
            </div>

            <Link 
              href={`/store/all-stores/${store._id}`}
              className="mt-4 block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No stores found
        </div>
      )}
    </div>
  )
}
