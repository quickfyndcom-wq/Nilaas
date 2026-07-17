'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/useAuth'
import PageTitle from '@/components/PageTitle'

export default function ShopCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [heading, setHeading] = useState({ title: '', subtitle: '' })
  const [editingHeading, setEditingHeading] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, getToken } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user])

  const fetchData = async () => {
    try {
      const token = await getToken(true)
      const [categoriesRes, settingsRes] = await Promise.all([
        axios.get('/api/store/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('/api/store/settings')
      ])

      // Load categories (only parent categories)
      if (categoriesRes.data.categories) {
        const parentCategories = categoriesRes.data.categories.filter(cat => !cat.parentId)
        setCategories(parentCategories || [])
      }

      // Load heading
      if (settingsRes.data.settings?.shopCategoriesHeading) {
        setHeading(settingsRes.data.settings.shopCategoriesHeading)
      }

      // Load selected categories
      if (settingsRes.data.settings?.shopCategoriesDisplay?.selectedIds) {
        setSelectedCategories(settingsRes.data.settings.shopCategoriesDisplay.selectedIds)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    }
  }

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else if (prev.length < 7) {
        return [...prev, categoryId]
      } else {
        toast.error('Maximum 7 categories can be selected')
        return prev
      }
    })
  }

  const saveSelection = async () => {
    try {
      setLoading(true)
      const token = await getToken(true)
      await axios.put('/api/store/settings', {
        shopCategoriesDisplay: {
          selectedIds: selectedCategories,
          order: selectedCategories
        }
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Selection saved!')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const saveHeading = async () => {
    try {
      setLoading(true)
      const token = await getToken(true)
      await axios.put('/api/store/settings', {
        shopCategoriesHeading: heading
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Heading saved!')
      setEditingHeading(false)
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <PageTitle title="Shop by Categories" subtitle="Manage categories displayed on homepage" />

      {/* Heading Editor */}
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

            <div className="flex gap-2">
              <button
                onClick={saveHeading}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingHeading(false)
                  fetchData()
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-xl font-serif text-gray-900 mb-1">{heading.title}</h4>
            {heading.subtitle && <p className="text-gray-600">{heading.subtitle}</p>}
          </div>
        )}
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Categories (Max 7)</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedCategories.length} of 7 selected
          </p>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => toggleCategory(category._id.toString())}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                    selectedCategories.includes(category._id.toString())
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id.toString())}
                      onChange={() => {}}
                      className="w-4 h-4 rounded mt-1"
                    />
                    <div className="flex-1">
                      {category.image && (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveSelection}
              disabled={loading || selectedCategories.length === 0}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : `Save Selection (${selectedCategories.length} selected)`}
            </button>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No categories available</p>
            <p className="text-sm text-gray-400">Create categories first in the Categories page</p>
            <a
              href="/store/categories"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Categories →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
