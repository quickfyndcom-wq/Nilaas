import { NextResponse } from 'next/server'

const OUNCE_TO_GRAM = 31.1034768

async function fetchFromMetalPriceAPI() {
  const apiKey = 'dde28869cb1e777033ac3e9e214353e5'
  try {
    const res = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=INR&currencies=XAU,XAG`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      console.error('Metal Price API error:', res.status, res.statusText)
      return null
    }
    
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Metal Price API returned non-JSON response')
      return null
    }
    
    const data = await res.json()
    
    // metalpriceapi returns rates where base=₹ means "1 ₹ = X units of XAU"
    // We need to invert to get "1 XAU = Y INR"
    const xauRate = data?.rates?.XAU // How many XAU per 1 AED
    const xagRate = data?.rates?.XAG // How many XAG per 1 AED
    
    if (!xauRate || Number.isNaN(Number(xauRate))) return null
    
    // Invert to get ₹ per troy ounce
    const aedPerOunceGold = 1 / xauRate
    const perGram24K = aedPerOunceGold / OUNCE_TO_GRAM
    const perGram22K = perGram24K * (22 / 24)
    const perGram18K = perGram24K * (18 / 24)
    
    let perGramSilver = null
    if (xagRate && !Number.isNaN(Number(xagRate))) {
      const aedPerOunceSilver = 1 / xagRate
      perGramSilver = Math.round(aedPerOunceSilver / OUNCE_TO_GRAM)
    }
    
    return {
      perGram24K: Math.round(perGram24K),
      perGram22K: Math.round(perGram22K),
      perGram18K: Math.round(perGram18K),
      perGramSilver,
      source: 'metalpriceapi.com'
    }
  } catch (error) {
    console.error('Metal Price API fetch error:', error.message)
    return null
  }
}

export async function GET() {
  // Try live provider, fallback to static hint
  const live = await fetchFromMetalPriceAPI()
  const now = new Date().toISOString()

  if (live) {
    return NextResponse.json({
      success: true,
      rates: { 
        perGram24K: live.perGram24K, 
        perGram22K: live.perGram22K,
        perGram18K: live.perGram18K,
        perGramSilver: live.perGramSilver
      },
      lastUpdated: now,
      disclaimer: 'Indicative rates. Actual buying price may vary with taxes, making charges and stones.'
    }, { status: 200 })
  }

  // Fallback: conservative default numbers to avoid breaking UI
  const fallback24 = 275 // ₹ per gram 24K (example fallback)
  const fallback22 = Math.round(fallback24 * (22 / 24))
  const fallback18 = Math.round(fallback24 * (18 / 24))
  return NextResponse.json({
    success: true,
    rates: { 
      perGram24K: fallback24, 
      perGram22K: fallback22,
      perGram18K: fallback18,
      perGramSilver: 3 // ₹ per gram silver (example fallback)
    },
    lastUpdated: now,
    disclaimer: 'Live provider not configured. Showing indicative ₹ fallback rates.'
  }, { status: 200 })
}
