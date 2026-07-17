"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import LeftImage from '@/assets/collection/stunning-every-ear.webp'

export default function BookAppointmentPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', type: 'In-store', store: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) 
  const [stores, setStores] = useState([])
  const [useCustomStore, setUseCustomStore] = useState(false)

  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data } = await axios.get('/api/stores')
        setStores(Array.isArray(data.stores) ? data.stores : [])
      } catch {}
    }
    loadStores()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const validate = () => {
    const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email)
    const phoneOk = /^[0-9+\-()\s]{7,}$/i.test(form.phone)
    const dateOk = !!form.date
    const timeOk = !!form.time
    if (!(form.name.trim().length >= 2 && emailOk && phoneOk && dateOk && timeOk)) return false
    // Slot rules: future date, Mon-Sat, 10:00-19:00
    try {
      const d = new Date(form.date + 'T' + (form.time || '00:00'))
      const now = new Date()
      // Must be today or later
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return false
      const day = d.getDay() // 0 Sun
      if (day === 0) return false
      const [hh, mm] = (form.time || '00:00').split(':').map(n => parseInt(n, 10))
      const minutes = hh * 60 + (mm || 0)
      const start = 10 * 60
      const end = 19 * 60
      if (minutes < start || minutes > end) return false
    } catch { return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!validate()) {
      setStatus({ type: 'error', message: 'Please fill valid name, email and phone.' })
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/appointment', form)
      setStatus({ type: 'success', message: 'Appointment request sent. We will contact you shortly.' })
      setForm({ name: '', email: '', phone: '', date: '', time: '', type: 'In-store', store: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.error || 'Failed to submit. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[70vh] bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl bg-white">
          {/* Left visual */}
          <div className="relative hidden md:block">
            <Image src={LeftImage} alt="Book an appointment" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-[#008C6D]/60 mix-blend-multiply" />
            <div className="absolute inset-0 p-8 text-white flex items-end">
              <div>
                <h2 className="text-3xl font-bold">Book an Appointment</h2>
                <p className="mt-2 text-white/90">Personalized assistance for your next purchase.</p>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#008C6D]/10 flex items-center justify-center">
                <span className="text-[#008C6D] font-bold">📅</span>
              </div>
              <h3 className="text-2xl font-bold mt-3">Schedule Your Visit</h3>
              <p className="text-sm text-gray-600">Share your details and our team will confirm.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="date"
                  type="date"
                  placeholder="Preferred Date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  required
                />
                <input
                  name="time"
                  type="time"
                  placeholder="Preferred Time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                >
                  <option>In-store</option>
                  <option>Video consultation</option>
                </select>
                {stores.length > 0 && !useCustomStore ? (
                  <select
                    name="store"
                    value={form.store}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__other__') {
                        setUseCustomStore(true)
                        setForm(f => ({ ...f, store: '' }))
                      } else {
                        handleChange(e)
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  >
                    <option value="">Select Store</option>
                    {stores.map(s => (
                      <option key={s.id} value={`${s.name}${s.city ? ' - ' + s.city : ''}`}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
                    ))}
                    <option value="__other__">Other…</option>
                  </select>
                ) : (
                  <input
                    name="store"
                    type="text"
                    placeholder="Preferred Store / City"
                    value={form.store}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  />
                )}
              </div>
              <textarea
                name="message"
                placeholder="Tell us what this is about (optional)"
                value={form.message}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008C6D] hover:bg-[#00745A] text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? 'Submitting…' : 'Book Appointment'}
              </button>
            </form>

            {status && (
              <div className={`mt-3 text-sm text-center ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.message}
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              By submitting, you agree to our <a href="/terms" className="underline">Terms of Use</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
