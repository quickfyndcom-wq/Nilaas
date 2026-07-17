'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import axios from 'axios'
import Loading from '@/components/Loading'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AddressModal from '@/components/AddressModal'
import DashboardSidebar from '@/components/DashboardSidebar'
import { User, MapPin, Phone, CreditCard, Save, Plus, Trash2, Edit2, X } from 'lucide-react'

export default function DashboardProfilePage() {
  const [user, setUser] = useState(undefined)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [addrToEdit, setAddrToEdit] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // New states for phone numbers and cards
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [savedCards, setSavedCards] = useState([])
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  
  // Profile form state for auto-save
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: ''
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
      if (u) {
        setProfileData({
          displayName: u.displayName || '',
          email: u.email || '',
          phoneNumber: u.phoneNumber || ''
        })
      }
    })
    return () => unsub()
  }, [])
  
  // Auto-save profile changes with debounce
  useEffect(() => {
    if (!user || !profileData.displayName) return
    
    const timeoutId = setTimeout(async () => {
      if (
        profileData.displayName !== user.displayName ||
        profileData.email !== user.email ||
        profileData.phoneNumber !== user.phoneNumber
      ) {
        try {
          setAutoSaving(true)
          await updateProfile(auth.currentUser, { 
            displayName: profileData.displayName 
          })
          
          const token = await auth.currentUser.getIdToken()
          await axios.post('/api/user/update-profile', 
            { 
              email: profileData.email,
              phoneNumber: profileData.phoneNumber 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          
          setUser({ 
            ...user, 
            displayName: profileData.displayName,
            email: profileData.email,
            phoneNumber: profileData.phoneNumber 
          })
          toast.success('Profile auto-saved', { duration: 2000 })
        } catch (err) {
          console.error('Auto-save failed:', err)
        } finally {
          setAutoSaving(false)
        }
      }
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [profileData])

  // load saved addresses for the user
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return
      try {
        setAddrLoading(true)
        const token = await auth.currentUser.getIdToken(true)
        const { data } = await axios.get('/api/address', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const list = Array.isArray(data?.addresses) ? data.addresses : (Array.isArray(data) ? data : [])
        setAddresses(list)
      } catch (err) {
        console.error('[PROFILE] addresses error:', err?.response?.data || err.message)
      } finally {
        setAddrLoading(false)
      }
    }
    loadAddresses()
  }, [user])
  
  // Load phone numbers (stored in localStorage for demo)
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`phoneNumbers_${user.uid}`)
      if (saved) {
        setPhoneNumbers(JSON.parse(saved))
      }
    }
  }, [user])
  
  // Load saved cards (stored in localStorage for demo)
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`cards_${user.uid}`)
      if (saved) {
        setSavedCards(JSON.parse(saved))
      }
    }
  }, [user])
  
  // Handlers for phone numbers
  const handleAddPhone = (phoneData) => {
    const newPhone = {
      id: Date.now(),
      ...phoneData,
      isPrimary: phoneNumbers.length === 0
    }
    const updated = [...phoneNumbers, newPhone]
    setPhoneNumbers(updated)
    localStorage.setItem(`phoneNumbers_${user.uid}`, JSON.stringify(updated))
    toast.success('Phone number added')
    setShowPhoneForm(false)
  }
  
  const handleUpdatePhone = (id, phoneData) => {
    const updated = phoneNumbers.map(p => p.id === id ? { ...p, ...phoneData } : p)
    setPhoneNumbers(updated)
    localStorage.setItem(`phoneNumbers_${user.uid}`, JSON.stringify(updated))
    toast.success('Phone number updated')
    setEditingPhone(null)
  }
  
  const handleDeletePhone = (id) => {
    if (confirm('Delete this phone number?')) {
      const updated = phoneNumbers.filter(p => p.id !== id)
      setPhoneNumbers(updated)
      localStorage.setItem(`phoneNumbers_${user.uid}`, JSON.stringify(updated))
      toast.success('Phone number deleted')
    }
  }
  
  const handleSetPrimaryPhone = (id) => {
    const updated = phoneNumbers.map(p => ({
      ...p,
      isPrimary: p.id === id
    }))
    setPhoneNumbers(updated)
    localStorage.setItem(`phoneNumbers_${user.uid}`, JSON.stringify(updated))
    toast.success('Primary phone updated')
  }
  
  // Handlers for cards
  const handleAddCard = (cardData) => {
    const newCard = {
      id: Date.now(),
      ...cardData,
      isPrimary: savedCards.length === 0
    }
    const updated = [...savedCards, newCard]
    setSavedCards(updated)
    localStorage.setItem(`cards_${user.uid}`, JSON.stringify(updated))
    toast.success('Card added')
    setShowCardForm(false)
  }
  
  const handleDeleteCard = (id) => {
    if (confirm('Delete this card?')) {
      const updated = savedCards.filter(c => c.id !== id)
      setSavedCards(updated)
      localStorage.setItem(`cards_${user.uid}`, JSON.stringify(updated))
      toast.success('Card deleted')
    }
  }
  
  const handleSetPrimaryCard = (id) => {
    const updated = savedCards.map(c => ({
      ...c,
      isPrimary: c.id === id
    }))
    setSavedCards(updated)
    localStorage.setItem(`cards_${user.uid}`, JSON.stringify(updated))
    toast.success('Primary card updated')
  }

  if (user === undefined) return <Loading />

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">Dashboard / Profile</h1>
        <p className="text-slate-600 mb-6">You need to sign in to view your profile.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">Go to Home</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'phones', label: 'Phone Numbers', icon: Phone },
    { id: 'cards', label: 'Payment Cards', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <DashboardSidebar />

          <main className="lg:col-span-3">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Your Profile</h1>
              <p className="text-slate-600">Manage your personal information, addresses, and payment methods</p>
            </div>

            {/* Tabs - Mobile Dropdown, Desktop Tabs */}
            <div className="mb-6">
              {/* Mobile Dropdown */}
              <div className="lg:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden lg:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">{renderTabContent()}</div>
          </main>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        open={showAddrModal}
        setShowAddressModal={setShowAddrModal}
        isEdit={!!addrToEdit}
        initialAddress={addrToEdit}
        onAddressAdded={(newAddr) => setAddresses([newAddr, ...addresses])}
        onAddressUpdated={(upd) => setAddresses(addresses.map((x) => (x.id === upd.id ? upd : x)))}
      />
    </div>
  )

  function renderTabContent() {
    switch (activeTab) {
      case 'profile':
        return <ProfileInfoTab />
      case 'addresses':
        return <AddressesTab />
      case 'phones':
        return <PhoneNumbersTab />
      case 'cards':
        return <PaymentCardsTab />
      default:
        return null
    }
  }

  // Profile Info Tab Component
  function ProfileInfoTab() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              {user.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt="Profile" 
                  width={100} 
                  height={100} 
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white">
                  {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              
              {/* Upload Photo Button */}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition">
                <Edit2 className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
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
                          'Content-Type': 'multipart/form-data'
                        }
                      })
                      
                      if (data.url) {
                        await updateProfile(auth.currentUser, { photoURL: data.url })
                        setUser({ ...user, photoURL: data.url })
                        toast.success('Photo updated')
                      }
                    } catch (err) {
                      toast.error(err?.response?.data?.error || 'Failed to upload')
                    } finally {
                      setUploading(false)
                    }
                  }}
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">{user.displayName || 'No name set'}</h2>
              <p className="text-slate-600">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Member since {new Date(user.metadata?.creationTime).toLocaleDateString()}
                </span>
                {autoSaving && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="your@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              <Save className="w-4 h-4 inline mr-1" />
              Changes are automatically saved after you stop typing
            </p>
          </div>
        </div>
      </div>
    )
  }
  // Addresses Tab Component
  function AddressesTab() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Saved Addresses</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your delivery addresses</p>
          </div>
          <button
            onClick={() => { setAddrToEdit(null); setShowAddrModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        <div className="p-6">
          {addrLoading ? (
            <div className="flex items-center justify-center h-48"><Loading /></div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No saved addresses yet</p>
              <button
                onClick={() => { setAddrToEdit(null); setShowAddrModal(true) }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.id || a._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">{a.name || 'Address'}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setAddrToEdit(a); setShowAddrModal(true) }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this address?')) return
                          try {
                            const token = await auth.currentUser.getIdToken(true)
                            await axios.delete(`/api/address?id=${a.id || a._id}`, { 
                              headers: { Authorization: `Bearer ${token}` } 
                            })
                            toast.success('Address deleted')
                            setAddresses(addresses.filter((x) => (x.id || x._id) !== (a.id || a._id)))
                          } catch (err) {
                            toast.error(err?.response?.data?.error || 'Delete failed')
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p>{a.street}</p>
                    <p>{[a.city, a.state, a.zip].filter(Boolean).join(', ')}</p>
                    <p className="text-slate-600">{a.country || 'India'}</p>
                    {a.phone && (
                      <p className="text-slate-600 flex items-center gap-1 mt-2">
                        <Phone className="w-3 h-3" />
                        {a.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Phone Numbers Tab Component
  function PhoneNumbersTab() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Phone Numbers</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your contact numbers</p>
          </div>
          <button
            onClick={() => setShowPhoneForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Phone
          </button>
        </div>

        <div className="p-6">
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No phone numbers saved</p>
              <button
                onClick={() => setShowPhoneForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Number
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {phoneNumbers.map((phone) => (
                <div key={phone.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{phone.label || 'Phone'}</span>
                        {phone.isPrimary && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700">{phone.countryCode} {phone.number}</p>
                    </div>
                    <div className="flex gap-1">
                      {!phone.isPrimary && (
                        <button
                          onClick={() => handleSetPrimaryPhone(phone.id)}
                          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhone(phone.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phone Number Form Modal */}
          {showPhoneForm && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Add Phone Number</h3>
                  <button
                    onClick={() => setShowPhoneForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    handleAddPhone({
                      label: formData.get('label'),
                      countryCode: formData.get('countryCode'),
                      number: formData.get('number')
                    })
                    e.currentTarget.reset()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Label</label>
                    <input
                      name="label"
                      type="text"
                      required
                      placeholder="e.g., Mobile, Home, Work"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Code</label>
                      <select
                        name="countryCode"
                        className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="+91">+91</option>
                        <option value="+971">+971</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Number</label>
                      <input
                        name="number"
                        type="tel"
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Add Phone Number
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPhoneForm(false)}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Payment Cards Tab Component
  function PaymentCardsTab() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment Cards</h2>
            <p className="text-sm text-slate-600 mt-1">Securely manage your payment methods</p>
          </div>
          <button
            onClick={() => setShowCardForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <div className="p-6">
          {savedCards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No payment cards saved</p>
              <button
                onClick={() => setShowCardForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedCards.map((card) => (
                <div key={card.id} className="relative border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white hover:shadow-xl transition overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <CreditCard className="w-8 h-8" />
                      {card.isPrimary && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="mb-6">
                      <p className="text-sm opacity-75 mb-1">Card Number</p>
                      <p className="text-lg font-mono tracking-wider">
                        •••• •••• •••• {card.lastFour}
                      </p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-75 mb-1">Card Holder</p>
                        <p className="font-medium">{card.holderName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-75 mb-1">Expires</p>
                        <p className="font-medium">{card.expiry}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      {!card.isPrimary && (
                        <button
                          onClick={() => handleSetPrimaryCard(card.id)}
                          className="flex-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Card Form Modal */}
          {showCardForm && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Add Payment Card</h3>
                  <button
                    onClick={() => setShowCardForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const cardNumber = formData.get('cardNumber')
                    handleAddCard({
                      holderName: formData.get('holderName'),
                      lastFour: cardNumber.slice(-4),
                      expiry: formData.get('expiry'),
                      type: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card'
                    })
                    e.currentTarget.reset()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Card Holder Name</label>
                    <input
                      name="holderName"
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                    <input
                      name="cardNumber"
                      type="text"
                      required
                      maxLength="16"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                      <input
                        name="expiry"
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                      <input
                        name="cvv"
                        type="text"
                        required
                        maxLength="3"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Add Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCardForm(false)}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  🔒 Your card information is securely stored
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}