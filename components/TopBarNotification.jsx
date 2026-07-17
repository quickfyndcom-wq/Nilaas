'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import Link from 'next/link'

const FASHION_FALLBACK =
  'Welcome offer: ₹199 OFF your first order & free shipping on selected styles.'

function normalizeTopBarText(text) {
  if (!text || typeof text !== 'string') return FASHION_FALLBACK
  if (/jewel|diamond|gold exchange/i.test(text)) return FASHION_FALLBACK
  return text
}

const TopBarNotification = () => {
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetch('/api/store/settings')
      .then((r) => r.json())
      .then((data) => {
        const tb = data?.settings?.topBar
        if (tb?.enabled && tb?.text) {
          setConfig({
            ...tb,
            text: normalizeTopBarText(tb.text),
            icon: /💎|diamond/i.test(tb.icon || '') ? '' : tb.icon,
          })
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!visible || !config) return null

  return (
    <div className="bg-white border-b border-[#2a1210]/10">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 border border-[#2a1210]/12 bg-white px-3 sm:px-5 py-2.5 sm:py-3">
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0 pr-8 sm:pr-0">
            <span className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#2a1210]/15 text-[#8a5a4a]">
              {config.icon ? (
                <span className="text-base leading-none">{config.icon}</span>
              ) : (
                <Sparkles size={16} />
              )}
            </span>
            <p className="font-serif text-sm sm:text-[15px] text-[#2a1210] leading-snug">
              {config.text}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            {config.buttonText && config.buttonPath && (
              <Link
                href={config.buttonPath}
                className="inline-flex items-center justify-center h-9 px-4 bg-[#2a1210] text-[#faf7f4] text-xs sm:text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition whitespace-nowrap"
              >
                {config.buttonText}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="absolute right-2 top-2 sm:static p-1.5 text-[#9a7d72] hover:text-[#2a1210] transition"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBarNotification
