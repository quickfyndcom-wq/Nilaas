'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MapPin, Plus, Trash2, X } from 'lucide-react'
import Loading from '@/components/Loading'
import AddressModal from '@/components/AddressModal'

const field =
  'mt-1.5 w-full border-b border-[#2a1210]/20 bg-transparent px-0 py-2.5 text-base text-[#2a1210] placeholder:text-[#9a7d72] focus:outline-none focus:border-[#2a1210]'

function ProfileContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('details')
  const [addresses, setAddresses] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [addrToEdit, setAddrToEdit] = useState(null)
  const [managingAddressId, setManagingAddressId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
  })
  const [draft, setDraft] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
  })

  useEffect(() => {
    if (searchParams.get('tab') === 'addresses') setTab('addresses')
  }, [searchParams])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
      if (u) {
        setProfileData({
          displayName: u.displayName || '',
          email: u.email || '',
          phoneNumber: '',
        })
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await auth.currentUser.getIdToken()
        const { data } = await axios.get('/api/user/update-profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled || !data?.user) return
        setProfileData((prev) => ({
          displayName: data.user.name || prev.displayName || user.displayName || '',
          email: data.user.email || prev.email || user.email || '',
          phoneNumber: data.user.phone || '',
        }))
      } catch (err) {
        console.error('[PROFILE] load error:', err?.response?.data || err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return
      try {
        setAddrLoading(true)
        const token = await auth.currentUser.getIdToken()
        const { data } = await axios.get('/api/address', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAddresses(
          Array.isArray(data?.addresses) ? data.addresses : Array.isArray(data) ? data : []
        )
      } catch (err) {
        console.error('[PROFILE] addresses error:', err?.response?.data || err.message)
      } finally {
        setAddrLoading(false)
      }
    }
    loadAddresses()
  }, [user])

  const startEditDetails = () => {
    setDraft({ ...profileData })
    setEditingDetails(true)
  }

  const cancelEditDetails = () => {
    setDraft({ ...profileData })
    setEditingDetails(false)
  }

  const saveProfile = async () => {
    if (!auth.currentUser) return
    try {
      setSaving(true)
      await updateProfile(auth.currentUser, { displayName: draft.displayName })
      const token = await auth.currentUser.getIdToken()
      const { data } = await axios.post(
        '/api/user/update-profile',
        {
          name: draft.displayName,
          email: draft.email,
          phoneNumber: draft.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const next = {
        displayName: data?.user?.name || draft.displayName,
        email: data?.user?.email || draft.email,
        phoneNumber: data?.user?.phone || draft.phoneNumber,
      }
      setProfileData(next)
      setDraft(next)
      setEditingDetails(false)
      toast.success('Saved')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    setUploading(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'profile-photos')
      const { data } = await axios.post('/api/s3/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      if (data.url) {
        await updateProfile(auth.currentUser, { photoURL: data.url })
        setUser({ ...user, photoURL: data.url })
        toast.success('Photo updated')
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const deleteAddress = async (a) => {
    if (!confirm('Delete this address?')) return
    try {
      const token = await auth.currentUser.getIdToken()
      await axios.delete(`/api/address?id=${a.id || a._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Deleted')
      setAddresses(addresses.filter((x) => (x.id || x._id) !== (a.id || a._id)))
      setManagingAddressId(null)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed')
    }
  }

  if (user === undefined) return <Loading />

  if (user === null) {
    return (
      <div className="py-16 text-center">
        <p className="mb-3 font-medium text-[#2a1210]">Please sign in</p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('openSignInModal'))}
          className="bg-[#2a1210] px-5 py-2.5 text-sm text-white"
        >
          Sign in
        </button>
      </div>
    )
  }

  const displayName = profileData.displayName || user.displayName || 'Member'
  const initial = (displayName?.[0] || user.email?.[0] || 'N').toUpperCase()

  return (
    <div className="mx-auto max-w-lg">
      {/* Identity */}
      <div className="mb-8 text-center sm:text-left sm:flex sm:items-center sm:gap-5">
        <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden bg-[#2a1210] sm:mx-0">
          {user.photoURL ? (
            <Image src={user.photoURL} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-[#f5ebe4]">
              {initial}
            </div>
          )}
        </div>
        <div className="mt-3 min-w-0 sm:mt-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-[#2a1210]">
            {displayName}
          </h1>
          <p className="mt-0.5 truncate text-sm text-[#6b2f28]">
            {profileData.email || user.email}
          </p>
        </div>
      </div>

      {/* Tabs — underline style */}
      <div className="mb-6 flex gap-6 border-b border-[#2a1210]/10">
        {[
          { id: 'details', label: 'Details' },
          { id: 'addresses', label: 'Addresses' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setEditingDetails(false)
              setManagingAddressId(null)
            }}
            className={`relative pb-3 text-sm transition ${
              tab === t.id
                ? 'font-semibold text-[#2a1210]'
                : 'text-[#9a7d72] hover:text-[#2a1210]'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#2a1210]" />
            )}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <section>
          {!editingDetails ? (
            <>
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">Name</p>
                  <p className="mt-1 text-lg text-[#2a1210]">{profileData.displayName || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">Email</p>
                  <p className="mt-1 break-all text-lg text-[#2a1210]">
                    {profileData.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">Phone</p>
                  <p className="mt-1 text-lg text-[#2a1210]">
                    {profileData.phoneNumber || 'Not added yet'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={startEditDetails}
                className="mt-8 w-full border border-[#2a1210] py-3 text-sm font-medium text-[#2a1210] transition hover:bg-[#2a1210] hover:text-[#f5ebe4]"
              >
                Edit details
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#2a1210]">Edit details</p>
                <button
                  type="button"
                  onClick={cancelEditDetails}
                  className="p-1 text-[#9a7d72]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">
                  Name
                </span>
                <input
                  type="text"
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  className={field}
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">
                  Email
                </span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className={field}
                  placeholder="you@email.com"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9a7d72]">
                  Phone
                </span>
                <input
                  type="tel"
                  value={draft.phoneNumber}
                  onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })}
                  className={field}
                  placeholder="+91 …"
                />
              </label>

              <label className="block cursor-pointer text-sm text-[#6b2f28] underline underline-offset-2">
                {uploading ? 'Uploading photo…' : 'Change profile photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => uploadPhoto(e.target.files?.[0])}
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 bg-[#2a1210] py-3 text-sm font-medium text-[#f5ebe4] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditDetails}
                  disabled={saving}
                  className="px-4 py-3 text-sm text-[#6b2f28]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'addresses' && (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setAddrToEdit(null)
              setShowAddrModal(true)
            }}
            className="flex w-full items-center justify-center gap-2 border border-dashed border-[#2a1210]/30 py-3.5 text-sm text-[#2a1210]"
          >
            <Plus size={16} /> Add address
          </button>

          {addrLoading ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-2 text-[#9a7d72]" size={22} />
              <p className="text-sm text-[#6b2f28]">No addresses saved</p>
            </div>
          ) : (
            addresses.map((a) => {
              const id = String(a.id || a._id)
              const managing = managingAddressId === id
              return (
                <div key={id} className="border-b border-[#2a1210]/10 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#2a1210]">{a.name || 'Address'}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#6b2f28]">
                        {[a.street || a.address, a.city, a.state, a.zip || a.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {a.phone && (
                        <p className="mt-1 text-xs text-[#9a7d72]">{a.phone}</p>
                      )}
                    </div>
                    {!managing ? (
                      <button
                        type="button"
                        onClick={() => setManagingAddressId(id)}
                        className="shrink-0 text-xs font-medium uppercase tracking-wide text-[#9a7d72] hover:text-[#2a1210]"
                      >
                        Manage
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setManagingAddressId(null)}
                        className="shrink-0 p-1 text-[#9a7d72]"
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {managing && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddrToEdit(a)
                          setShowAddrModal(true)
                          setManagingAddressId(null)
                        }}
                        className="flex-1 border border-[#2a1210] py-2 text-xs font-medium text-[#2a1210]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAddress(a)}
                        className="inline-flex flex-1 items-center justify-center gap-1 border border-red-200 py-2 text-xs font-medium text-red-700"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      )}

      <AddressModal
        open={showAddrModal}
        setShowAddressModal={setShowAddrModal}
        isEdit={!!addrToEdit}
        initialAddress={addrToEdit}
        onAddressAdded={(newAddr) => setAddresses([newAddr, ...addresses])}
        onAddressUpdated={(upd) =>
          setAddresses(addresses.map((x) => ((x.id || x._id) === (upd.id || upd._id) ? upd : x)))
        }
      />
    </div>
  )
}

export default function DashboardProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileContent />
    </Suspense>
  )
}
