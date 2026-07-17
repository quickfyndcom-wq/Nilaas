'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

export default function Section5Settings() {
  const DEFAULT_GENDER_CATEGORIES = [
    { title: '', image: '', link: '' },
    { title: '', image: '', link: '' },
    { title: '', image: '', link: '' }
  ]
  const [heading, setHeading] = useState({
    title: 'Curated For You',
    subtitle: 'Shop By Gender'
  })
  const [genderCategories, setGenderCategories] = useState(DEFAULT_GENDER_CATEGORIES)
  const [editingHeading, setEditingHeading] = useState(false)
  const [editingCategories, setEditingCategories] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings');
      console.log('📥 Section 5 Settings loaded:', settingsRes.data.settings?.section5GenderCategories)

      // Load heading from settings
      if (settingsRes.data.settings?.section5Heading) {
        setHeading(settingsRes.data.settings.section5Heading)
      }

      // Load gender categories with fallback when empty
      const cats = settingsRes.data.settings?.section5GenderCategories
      if (Array.isArray(cats) && cats.length > 0) {
        setGenderCategories(cats)
      } else {
        setGenderCategories(DEFAULT_GENDER_CATEGORIES)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleSaveHeading = async () => {
    setLoading(true)
    try {
      const { data } = await axios.put('/api/store/settings', {
        section5Heading: heading
      })
      
      if (data.success) {
        toast.success('Section 5 heading updated!')
        setEditingHeading(false)
        // Sync local state from server response to avoid stale refetch
        if (data.settings?.section5Heading) {
          setHeading(data.settings.section5Heading)
        }
      }
    } catch (error) {
      console.error('Error saving heading:', error)
      toast.error('Failed to save heading')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (index, field, value) => {
    const updated = [...genderCategories]
    updated[index][field] = value
    setGenderCategories(updated)
  }

  const handleImageUpload = async (index, file) => {
    if (!file) return

    setUploadingIndex(index)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/store/upload-banner', formData)

      if (response.data.url) {
        handleCategoryChange(index, 'image', response.data.url)
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploadingIndex(null)
    }
  }

  const saveGenderCategories = async () => {
    setLoading(true)
    try {
      console.log('💾 Saving gender categories:', genderCategories)
      const response = await axios.put('/api/store/settings', {
        section5GenderCategories: genderCategories
      })
      console.log('✅ Save response:', response.data)
      toast.success('Gender categories updated')
      setEditingCategories(false)
      // Sync local state without immediate refetch to avoid race conditions
      if (response.data.settings?.section5GenderCategories) {
        setGenderCategories(response.data.settings.section5GenderCategories)
      }
    } catch (error) {
      console.error('Error saving gender categories:', error)
      toast.error('Failed to save gender categories')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageTitle title="Section 5 Settings (Shop By Gender)" />

        {/* Heading Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Section Heading</h3>
            {!editingHeading && (
              <button
                onClick={() => setEditingHeading(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingHeading ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={heading.title}
                  onChange={(e) => setHeading(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={heading.subtitle}
                  onChange={(e) => setHeading(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveHeading}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingHeading(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xl font-serif text-gray-900 mb-1">{heading.title}</h4>
              <p className="text-gray-600">{heading.subtitle}</p>
            </div>
          )}
        </div>

        {/* Gender Categories Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gender Categories (3 Items)</h3>
            {!editingCategories && (
              <button
                onClick={() => setEditingCategories(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingCategories ? (
            <div className="space-y-6">
              {genderCategories.map((category, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Category {index + 1}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => handleCategoryChange(index, 'title', e.target.value)}
                        placeholder="e.g., Women Jewellery, Men Jewellery, Kids Jewellery"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image Upload
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                          disabled={uploadingIndex === index}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {uploadingIndex === index && (
                          <p className="text-sm text-blue-600">Uploading...</p>
                        )}
                        {category.image && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Preview:</p>
                            <img 
                              src={category.image} 
                              alt={category.title || 'Preview'}
                              className="w-full h-40 object-cover rounded-lg"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={category.link}
                        onChange={(e) => handleCategoryChange(index, 'link', e.target.value)}
                        placeholder="/shop?gender=women or /category/women"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveGenderCategories}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Categories'}
                </button>
                <button
                  onClick={() => setEditingCategories(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {genderCategories.map((category, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-48 object-cover rounded-lg mb-2"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <h4 className="font-medium text-gray-900">{category.title || `Category ${index + 1}`}</h4>
                  {category.link && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{category.link}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
