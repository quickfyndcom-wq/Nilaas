"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['All', 'Orders', 'Shipping', 'Payment', 'Returns', 'Account']

const FAQS = [
  { q: 'How do I redeem Encircle Points?', a: 'Login, proceed to checkout, and apply your Encircle points at payment. Points can be combined with select offers as per terms.', c: 'Payment' },
  { q: 'Do I need to pay shipping / delivery charges?', a: 'Shipping is free on qualified orders; otherwise a nominal fee may apply based on location and cart value. Final charges appear at checkout.', c: 'Shipping' },
  { q: 'Can I send gifts to my loved ones?', a: 'Yes. Add the recipient address during checkout and include a gift note. We do not include pricing in gift packages.', c: 'Orders' },
  { q: 'What happens if my order is lost in transit?', a: 'Contact support with your order number. We will investigate with the courier and reship or refund as per policy.', c: 'Shipping' },
  { q: 'Is Cash On Delivery (COD) available?', a: 'COD is available for select pin codes and eligible order amounts. Please keep exact cash ready at delivery.', c: 'Payment' },
  { q: 'Questions on Tokenization', a: 'Card tokenization replaces your card number with a secure token, improving security and enabling faster checkout for future orders.', c: 'Payment' },
  { q: 'How do I track my order?', a: 'Visit our Track Order page and enter your email and order number. You will also receive email updates at each stage.', c: 'Orders' },
  { q: 'How do I start a return?', a: 'Go to Orders in your account or use the Returns page to submit a request within the return window.', c: 'Returns' },
  { q: 'How long do refunds take?', a: 'Refunds are typically processed within 5-7 business days after the product passes quality checks.', c: 'Returns' },
  { q: 'How can I update my address?', a: 'Edit saved addresses from your Account dashboard or during checkout.', c: 'Account' },
]

export default function FAQsPage() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [openIdx, setOpenIdx] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQS.filter(item => {
      const matchesCat = cat === 'All' || item.c === cat
      const matchesQ = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      return matchesCat && matchesQ
    })
  }, [query, cat])

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Help & Contact</h1>
          <p className="mt-2 text-slate-600">Top Customer Questions</p>
        </div>

        {/* Contact short-cuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/help" className="border rounded-xl p-4 text-center hover:shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-2"><span className="text-[#008C6D]">💬</span></div>
            <p className="font-medium text-slate-900">Chat with Us</p>
          </Link>
          <a href="tel:18002660123" className="border rounded-xl p-4 text-center hover:shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-2"><span className="text-[#008C6D]">📞</span></div>
            <p className="font-medium text-slate-900">Call Us At</p>
            <p className="text-xs text-slate-600">1800-266-0123</p>
          </a>
          <a href="mailto:support@nilaas.in" className="border rounded-xl p-4 text-center hover:shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-2"><span className="text-[#008C6D]">✉️</span></div>
            <p className="font-medium text-slate-900">Write to Us</p>
            <p className="text-xs text-slate-600">support@nilaas.in</p>
          </a>
        </div>
        <p className="text-center text-xs text-slate-500 mb-10">The toll-free number applies to domestic orders within India. International customers may use WhatsApp, chat, or email.</p>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-sm border ${cat === c ? 'bg-[#008C6D] text-white border-[#008C6D]' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search FAQs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#008C6D] focus:border-transparent"
            />
          </div>
        </div>

        {/* FAQ list */}
        <div className="divide-y border rounded-xl">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-slate-50"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            >
              <span className="text-slate-800 text-sm sm:text-base">{item.q}</span>
              <span className="text-[#008C6D]">{openIdx === idx ? '−' : '+'}</span>
            </button>
          ))}
        </div>

        {/* Answers */}
        <div className="mt-2">
          {filtered.map((item, idx) => (
            <div key={`ans-${idx}`} className={`${openIdx === idx ? 'block' : 'hidden'} bg-white border border-slate-200 rounded-xl p-4 mt-2`}>
              <p className="text-slate-700 text-sm">{item.a}</p>
              <p className="text-xs text-slate-500 mt-2">Category: {item.c}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
