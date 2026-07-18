'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function HomePageSettingsPage() {
  const [settings, setSettings] = useState({
    collectionsHeading: {
      title: 'Nilaas Collections',
      subtitle: 'Explore our newly launched collection',
      image: '',
      content: '',
      visible: true
    },
    bestSellingSection: {
      title: 'Best Selling Products',
      subtitle: 'Shop our most popular items',
      image: '',
      content: '',
      visible: true
    },
    featuredSection: {
      title: 'Featured Collection',
      subtitle: 'Discover our curated selection',
      image: '',
      content: '',
      visible: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState({})

  // Fetch settings
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/store/settings')
      if (res.data.settings) {
        setSettings(res.data.settings)
        // Set image previews
        const previews = {}
        Object.keys(res.data.settings).forEach(key => {
          if (res.data.settings[key].image) {
            previews[key] = res.data.settings[key].image
          }
        })
        setImagePreview(previews)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleImageUrlChange = (section, url) => {
    handleFieldChange(section, 'image', url)
    if (url.startsWith('http')) {
      setImagePreview(prev => ({
        ...prev,
        [section]: url
      }))
    }
  }

  const handleImageUpload = async (section, file) => {
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post('/api/store/upload-banner', formData)
      const imageUrl = res.data.url
      
      handleFieldChange(section, 'image', imageUrl)
      setImagePreview(prev => ({
        ...prev,
        [section]: imageUrl
      }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      console.log('💾 Saving settings:', JSON.stringify(settings, null, 2))
      console.log('📌 collectionsHeading.visible being sent:', settings.collectionsHeading?.visible)
      
      const res = await axios.put('/api/store/settings', settings)
      if (res.data.success) {
        toast.success(res.data.message || 'Settings updated successfully')
        console.log('✅ Settings saved successfully')
        // Scroll to preview section to show what was saved
        setTimeout(() => {
          document.querySelectorAll('[data-preview]').forEach(el => {
            el.classList.add('highlight-preview')
          })
          setTimeout(() => {
            document.querySelectorAll('[data-preview]').forEach(el => {
              el.classList.remove('highlight-preview')
            })
          }, 2000)
        }, 100)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save settings'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading && Object.keys(settings).length === 0) {
    return <div className="text-center py-8">Loading...</div>
  }

  const sections = [
    { key: 'collectionsHeading', label: 'Section 2' },
    { key: 'bestSellingSection', label: 'Best Selling Section' },
    { key: 'featuredSection', label: 'Featured Section' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes highlightPulse {
          0% { background-color: rgba(34, 197, 94, 0.15); box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }
          100% { background-color: rgb(219, 234, 254); }
        }
        .highlight-preview {
          animation: highlightPulse 2s ease-out forwards;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Homepage Content</h1>
          <p className="text-gray-600">Manage homepage section headings, images, and content</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Sections */}
          {sections.map((section) => (
            <div key={section.key} className="border-b border-gray-200 last:border-b-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">{section.label}</h2>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                      <input
                        type="checkbox"
                        checked={settings[section.key].visible !== false}
                        onChange={(e) => handleFieldChange(section.key, 'visible', e.target.checked)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {settings[section.key].visible !== false ? '✅ Visible' : '❌ Hidden'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={settings[section.key].title}
                      onChange={(e) => handleFieldChange(section.key, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="e.g., Nilaas Collections"
                    />
                    <p className="text-xs text-gray-500 mt-1">Main heading for this section</p>
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings[section.key].subtitle}
                      onChange={(e) => handleFieldChange(section.key, 'subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="e.g., Explore our newly launched collection"
                    />
                    <p className="text-xs text-gray-500 mt-1">Secondary text below the main heading</p>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Content
                    </label>
                    <textarea
                      value={settings[section.key].content}
                      onChange={(e) => handleFieldChange(section.key, 'content', e.target.value)}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Additional content or description for this section..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional detailed content</p>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={settings[section.key].image}
                      onChange={(e) => handleImageUrlChange(section.key, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste image URL directly</p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(section.key, file)
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload image to S3 (max recommended: 5MB)</p>
                  </div>

                  {/* Image Preview */}
                  {imagePreview[section.key] && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                      <img
                        src={imagePreview[section.key]}
                        alt="Preview"
                        className="h-48 w-full object-cover rounded-lg border border-gray-200"
                        onError={() => {
                          setImagePreview(prev => {
                            const newPreviews = { ...prev }
                            delete newPreviews[section.key]
                            return newPreviews
                          })
                        }}
                      />
                    </div>
                  )}

                  {/* Text Preview */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300" data-preview>
                    <p className="text-xs text-blue-700 font-semibold mb-3">📱 LIVE PREVIEW:</p>
                    <div>
                      <h3 className="text-2xl font-serif text-gray-900 mb-1">
                        {settings[section.key].title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {settings[section.key].subtitle}
                      </p>
                      {settings[section.key].content && (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">
                          {settings[section.key].content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-gray-900 px-8 py-2 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
