'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  FolderIcon,
  ImageIcon,
  XIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  SparklesIcon,
  ShirtIcon,
} from 'lucide-react'
import { NILAAS_QUICK_CATEGORIES } from '@/lib/fashion-categories'

export default function StoreCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentId: '',
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const { user, loading: authLoading, getToken } = useAuth()

  const showToast = (type, title, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ type, title, message })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4500)
  }

  const fetchCategories = async () => {
    try {
      const token = await getToken(true)
      if (!token) {
        setLoading(false)
        return
      }
      const res = await fetch('/api/store/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setCategories(Array.isArray(data.categories) ? data.categories : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingCategory
        ? `/api/store/categories/${editingCategory._id}`
        : '/api/store/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const token = await getToken(true)
      if (!token) {
        showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
        return
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(
          'success',
          editingCategory ? 'Category updated' : 'Category created',
          editingCategory
            ? 'Your changes were saved successfully.'
            : 'Ready to use on nilaas.in shop and menus.'
        )
        setShowModal(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', image: '', parentId: '' })
        fetchCategories()
      } else {
        showToast('error', 'Unable to save category', data.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      showToast('error', 'Unable to save category', 'Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Products using it will keep the old name until you edit them.')) return
    try {
      const token = await getToken(true)
      if (!token) {
        showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
        return
      }
      const res = await fetch(`/api/store/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Category deleted', 'The category was removed successfully.')
        fetchCategories()
      } else {
        showToast('error', 'Unable to delete category', data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      showToast('error', 'Unable to delete category', 'Please try again in a moment.')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId || '',
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const token = await getToken(true)
      if (!token) {
        showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
        return
      }
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'categories')
      const res = await fetch('/api/s3/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
      setFormData((prev) => ({ ...prev, image: data.url }))
    } catch (err) {
      console.error('Upload error:', err)
      showToast('error', 'Image upload failed', 'Please try another image or retry the upload.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const openCreate = (preset = {}) => {
    setEditingCategory(null)
    setFormData({
      name: preset.name || '',
      description: preset.description || '',
      image: '',
      parentId: preset.parentId || '',
    })
    setShowModal(true)
  }

  const handleSeedFashion = async () => {
    setSeeding(true)
    try {
      const token = await getToken(true)
      if (!token) {
        showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
        return
      }
      const res = await fetch('/api/store/categories/seed-fashion', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', 'Setup failed', data.error || 'Could not create fashion categories')
        return
      }
      showToast(
        'success',
        'Fashion categories ready',
        data.created > 0
          ? `Added ${data.created} ladies fashion categories for nilaas.in`
          : 'Your fashion categories were already set up'
      )
      await fetchCategories()
    } catch (error) {
      console.error('Seed error:', error)
      showToast('error', 'Setup failed', 'Please try again in a moment.')
    } finally {
      setSeeding(false)
    }
  }

  const parentCategories = categories.filter((cat) => !cat.parentId)
  const existingNames = new Set(categories.map((c) => (c.name || '').toLowerCase()))
  const quickSuggestions = NILAAS_QUICK_CATEGORIES.filter(
    (name) => !existingNames.has(name.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-rose-200 border-t-rose-700" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed right-4 top-4 z-[60] w-[calc(100vw-2rem)] max-w-sm">
          <div
            role="alert"
            className={[
              'overflow-hidden rounded-2xl border bg-white shadow-2xl',
              toast.type === 'error' ? 'border-red-200' : 'border-emerald-200',
            ].join(' ')}
          >
            <div className={toast.type === 'error' ? 'h-1.5 bg-red-500' : 'h-1.5 bg-emerald-500'} />
            <div className="flex gap-3 p-4">
              <div
                className={[
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600',
                ].join(' ')}
              >
                {toast.type === 'error' ? <AlertTriangleIcon size={18} /> : <CheckCircle2Icon size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                <p className="mt-1 text-sm leading-5 text-gray-600">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Dismiss notification"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Nilaas · nilaas.in</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Fashion Categories</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-600">
            Organize your ladies fashion catalogue — ethnic, western, festive, accessories and more.
            These power shop filters, menus, and homepage sections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {parentCategories.length === 0 && (
            <button
              type="button"
              onClick={handleSeedFashion}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-900 disabled:opacity-50"
            >
              <SparklesIcon size={18} />
              {seeding ? 'Setting up…' : 'Setup fashion categories'}
            </button>
          )}
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
          >
            <PlusIcon size={18} />
            Add category
          </button>
        </div>
      </div>

      {/* Quick add */}
      {quickSuggestions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShirtIcon size={16} className="text-rose-700" />
            <p className="text-sm font-semibold text-gray-900">Quick add for ladies fashion</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => openCreate({ name })}
                className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 transition hover:border-rose-400 hover:bg-rose-50"
              >
                + {name}
              </button>
            ))}
          </div>
          {parentCategories.length > 0 && (
            <button
              type="button"
              onClick={handleSeedFashion}
              disabled={seeding}
              className="mt-3 text-xs font-medium text-rose-800 underline-offset-2 hover:underline disabled:opacity-50"
            >
              {seeding ? 'Adding missing categories…' : 'Fill in full Nilaas fashion tree (skips existing)'}
            </button>
          )}
        </div>
      )}

      {/* List */}
      {parentCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-6 py-16 text-center">
          <FolderIcon size={56} className="mx-auto mb-4 text-rose-300" />
          <p className="text-xl font-semibold text-gray-800">No fashion categories yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Set up Nilaas ladies fashion categories in one click — Kurtis, Sarees, Dresses, Co-ords,
            Accessories, and more — then attach images anytime.
          </p>
          <button
            type="button"
            onClick={handleSeedFashion}
            disabled={seeding}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-900 disabled:opacity-50"
          >
            <SparklesIcon size={18} />
            {seeding ? 'Creating…' : 'Setup fashion categories'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {parentCategories.map((parent) => (
            <div
              key={parent._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 border-b border-rose-50 bg-gradient-to-r from-rose-50/70 to-white p-4">
                <div className="flex min-w-0 items-center gap-4">
                  {parent.image ? (
                    <img
                      src={parent.image}
                      alt={parent.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-rose-100">
                      <FolderIcon size={28} className="text-rose-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-gray-900">{parent.name}</h3>
                    {parent.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">{parent.description}</p>
                    )}
                    <p className="mt-1 text-xs text-rose-800/70">
                      {(parent.children || []).length} subcategories · /category/{parent.slug || '…'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openCreate({ parentId: parent._id })}
                    className="rounded-lg px-2.5 py-2 text-xs font-medium text-rose-800 hover:bg-rose-50"
                    title="Add subcategory"
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(parent)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(parent._id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>

              {parent.children?.length > 0 && (
                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
                  {parent.children.map((child) => (
                    <div
                      key={child._id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {child.image ? (
                          <img
                            src={child.image}
                            alt={child.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                            <FolderIcon size={18} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{child.name}</p>
                          {child.description && (
                            <p className="truncate text-xs text-gray-500">{child.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(child)}
                          className="rounded p-1.5 text-slate-600 hover:bg-white"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(child._id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-rose-50 bg-white px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Nilaas fashion</p>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Edit category' : 'Add category'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingCategory(null)
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="e.g. Kurtis, Sarees, Dresses, Co-ord Sets"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Parent category (optional)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">None — top-level (e.g. Ethnic Wear)</option>
                  {parentCategories
                    .filter((cat) => cat._id !== editingCategory?._id)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Nest under Ethnic Wear, Western Wear, Accessories, etc.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Short note for your team, e.g. Festive silk sarees"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category image (optional)
                </label>
                {formData.image ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100">
                    <img src={formData.image} alt="Category" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-rose-200 p-6 text-center">
                    <ImageIcon size={40} className="mx-auto mb-2 text-rose-300" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="category-image-upload"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="category-image-upload"
                      className="inline-block cursor-pointer rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-900 transition hover:bg-rose-100"
                    >
                      {uploading ? 'Uploading…' : 'Upload look image'}
                    </label>
                    <p className="mt-2 text-xs text-gray-500">Square or portrait fashion shot · JPG/PNG/WebP</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 rounded-lg bg-rose-800 px-4 py-2 text-white transition hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
