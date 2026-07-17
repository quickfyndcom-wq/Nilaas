'use client'

import { useState } from 'react'
import Link from 'next/link'
import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      // Fallback: open mailto if API not available
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`
      )
      window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(form.subject || 'Contact from website')}&body=${body}`
      setStatus('sent')
    }
  }

  return (
    <SitePage
      title="Contact us"
      subtitle="Questions about an order, sizing, or shipping? We’re happy to help."
      wide
    >
      <div className="grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Reach us">
            <p>
              <strong className="text-[#2a1210]">Email</strong>
              <br />
              <a href={`mailto:${SITE.email}`} className="underline text-[#6b2f28]">
                {SITE.email}
              </a>
            </p>
            <p>
              <strong className="text-[#2a1210]">Phone / WhatsApp</strong>
              <br />
              <a href={`tel:${SITE.phoneTel}`} className="underline text-[#6b2f28]">
                {SITE.phone}
              </a>
            </p>
            <p>
              <strong className="text-[#2a1210]">Hours</strong>
              <br />
              {SITE.hours}
            </p>
            <p>
              <strong className="text-[#2a1210]">Address</strong>
              <br />
              {SITE.address}
            </p>
          </Section>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/support" className="underline text-[#6b2f28]">
              Support centre
            </Link>
            <Link href="/track-order" className="underline text-[#6b2f28]">
              Track your order
            </Link>
            <Link href="/return-policy" className="underline text-[#6b2f28]">
              Returns & exchanges
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Section title="Send a message">
            {status === 'sent' ? (
              <div className="border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900 text-sm">
                Thank you. We’ve received your message and will reply shortly at the email you provided.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="font-medium text-[#2a1210]">Name</span>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={onChange}
                      className="mt-1 w-full border border-[#2a1210]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-[#2a1210]">Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={onChange}
                      className="mt-1 w-full border border-[#2a1210]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                    />
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="font-medium text-[#2a1210]">Phone</span>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="mt-1 w-full border border-[#2a1210]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-[#2a1210]">Subject</span>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                      placeholder="Order help, sizing, feedback…"
                      className="mt-1 w-full border border-[#2a1210]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-[#2a1210]">Message</span>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={onChange}
                    className="mt-1 w-full border border-[#2a1210]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                  />
                </label>
                {errorMsg ? <p className="text-sm text-red-700">{errorMsg}</p> : null}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="bg-[#2a1210] text-white px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#4a221c] disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </Section>
        </div>
      </div>
    </SitePage>
  )
}
