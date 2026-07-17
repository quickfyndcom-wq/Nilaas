'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/lib/useAuth'

export default function HomeHeroPage() {
  const { getToken } = useAuth()
  const [heroSlides, setHeroSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHeroSlides()
  }, [])

  const fetchHeroSlides = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/store/hero', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHeroSlides(data.slides || [])
    } catch (error) {
      console.error('Error fetching hero slides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getToken()
      await axios.post('/api/store/hero', { slides: heroSlides }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Hero slides updated!')
    } catch (error) {
      console.error('Error saving hero slides:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading hero settings...</div>

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Homepage Hero Management</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Manage the hero banner slides displayed on the homepage.
        </p>

        <div className="space-y-6">
          {heroSlides.map((slide, index) => (
            <div key={index} className="border rounded p-4">
              <h3 className="font-semibold mb-3">Slide {index + 1}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={slide.title || ''}
                  onChange={(e) => {
                    const updated = [...heroSlides]
                    updated[index].title = e.target.value
                    setHeroSlides(updated)
                  }}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Subtitle"
                  value={slide.subtitle || ''}
                  onChange={(e) => {
                    const updated = [...heroSlides]
                    updated[index].subtitle = e.target.value
                    setHeroSlides(updated)
                  }}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={slide.image || ''}
                  onChange={(e) => {
                    const updated = [...heroSlides]
                    updated[index].image = e.target.value
                    setHeroSlides(updated)
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
