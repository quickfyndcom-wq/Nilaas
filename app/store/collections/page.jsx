'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CollectionsPage() {
  const [collections, setCollections] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '/shop',
    size: 'small',
    order: 0
  })
  const [editingId, setEditingId] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Fetch collections
  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const res = await axios.get('/api/store/collections')
      setCollections(res.data.collections || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Failed to fetch collections')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) : value
    }))
  }

  const handleImageUrlChange = (e) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, image: url }))
    if (url.startsWith('http')) {
      setImagePreview(url)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    setUploading(true)

    try {
      const formDataToUpload = new FormData()
      formDataToUpload.append('image', file)

      const uploadRes = await axios.post('/api/store/collections/upload', formDataToUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const imageUrl = uploadRes.data.url
      setFormData(prev => ({ ...prev, image: imageUrl }))
      setImagePreview(imageUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.image || formData.image.trim() === '') {
      toast.error('Image is required - please upload an image first')
      return
    }

    if (formData.image.startsWith('data:')) {
      toast.error('Image is still uploading - please wait')
      return
    }

    try {
      if (editingId) {
        // Update
        await axios.put('/api/store/collections', {
          collectionId: editingId,
          ...formData
        })
        toast.success('Collection updated successfully')
      } else {
        // Create
        const res = await axios.post('/api/store/collections', formData)
        setCollections(prev => [...prev, res.data.collection])
        toast.success('Collection created successfully')
      }

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        link: '/shop',
        size: 'small',
        order: 0
      })
      setImagePreview('')
      setEditingId(null)
      fetchCollections()
    } catch (error) {
      console.error('Error saving collection:', error)
      toast.error(error.response?.data?.error || 'Failed to save collection')
    }
  }

  const handleEdit = (collection) => {
    setFormData({
      title: collection.title || '',
      subtitle: collection.subtitle || '',
      description: collection.description || '',
      image: collection.image || '',
      link: collection.link || '/shop',
      size: collection.size || 'small',
      order: collection.order || 0
    })
    setImagePreview(collection.image || '')
    setEditingId(collection._id)
  }

  const handleDelete = async (collectionId) => {
    if (!confirm('Delete this collection?')) return

    try {
      await axios.delete(`/api/store/collections?collectionId=${collectionId}`)
      toast.success('Collection deleted successfully')
      fetchCollections()
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Failed to delete collection')
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      link: '/shop',
      size: 'small',
      order: 0
    })
    setImagePreview('')
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collections Management</h1>
          <p className="text-gray-600">Manage store collections displayed on homepage</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Collection' : 'Create New Collection'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Floral Bloom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="e.g., every Ear"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="/shop?category=earrings"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="small">Small</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order 
                  <span className="text-xs text-gray-500 font-normal"> (0 = first, 1 = second, etc.)</span>
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Collection description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">✓ JPG, PNG, WebP (Max 5MB) - {uploading ? 'Uploading...' : 'Ready'}</p>
            </div>

            {/* Image URL (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Or Paste Image URL (Optional)</label>
              <input
                type="text"
                value={formData.image}
                onChange={handleImageUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-48 w-full object-cover rounded-lg"
                  onError={() => setImagePreview('')}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingId ? 'Update Collection' : 'Create Collection'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Collections List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Collections ({collections.length})</h2>
          </div>

          {collections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No collections yet. Create your first collection above!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {collections.map(collection => (
                <div key={collection._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{collection.title}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {collection.size}
                        </span>
                      </div>
                      {collection.subtitle && (
                        <p className="text-sm text-gray-600 italic">{collection.subtitle}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Link: {collection.link}</p>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mt-2">{collection.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(collection)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(collection._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  {collection.image && (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="mt-4 h-32 w-full object-cover rounded-lg"
                    />
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
