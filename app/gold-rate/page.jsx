'use client'

import GoldRateWidget from '@/components/GoldRateWidget'
import Link from 'next/link'

export default function GoldRatePage() {

  return (
    <div className="max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1">
          <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium" aria-current="page">Gold Rate</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Today's Gold Price in Dubai</h1>
        <p className="text-base text-gray-600 max-w-3xl">
          Welcome to Nilaas's daily gold price tracker for India! We provide you with the most accurate and up-to-date gold prices in India Dirham (INR) per gram, allowing you to make informed decisions when purchasing or selling gold jewelry.
        </p>
      </div>

      {/* Gold Rate Widget */}
      <div className="mb-8">
        <GoldRateWidget showCalculator={true} />
      </div>

      {/* Content Sections */}
      <div className="space-y-8 prose max-w-none">
        {/* Dubai Gold Rate */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding Dubai Gold Rates</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The Live Retail Gold Rate in Dubai is prominently displayed in gold trading locations such as the Gold Souk, Deira. This is not the global spot rate but a maximum rate that jewellers and dealers are allowed to charge on the gold content of retail sales and has a small margin built into it to offset bullion delivery and customs charges.
            </p>
            <p>
              The purchase price of gold jewelry in Dubai is therefore a combination of the current Dubai retail gold rate plus a making charge. The price of the gold is set but the making charge can be negotiated.
            </p>
            <p>
              At Nilaas, we source our gold responsibly and price our jewelry transparently. Our calculator above helps you understand the complete breakdown of costs including metal value, making charges, wastage, and applicable VAT.
            </p>
          </div>
        </section>

        {/* International Gold Rate */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">International Gold Rate</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The International Gold Rate or Spot rate that we display on our charts is the current gold rate reported from real transactions taking place globally. Gold is a commonly traded metal and the price will fluctuate as rates are negotiated and agreed upon internationally.
            </p>
            <p>
              The gold bullion market also has access to the LBMA Gold Fix, a benchmark rate set twice every trading day in London and used as guidance for global trades.
            </p>
            <p>
              The international gold rate is an important factor that can impact the gold price in Dubai. As a major player in the global gold market, Dubai is influenced by the fluctuations in international gold rates. When international gold rates increase, the gold price in Dubai is likely to follow suit and vice versa.
            </p>
          </div>
        </section>

        {/* Gold Carat Rates */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gold Carat Rates Explained</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The Carat or Karat of Gold is a mark of the purity of the metal and an important factor to consider when buying gold jewelry. The carat rating of gold refers to the amount of pure gold in a piece of jewelry or bullion.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Common Gold Purities:</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>24K Gold:</strong> 99.9% pure gold - the highest purity. Softer and more malleable, ideal for investment and some jewelry.</li>
                <li><strong>22K Gold:</strong> 91.6% pure gold - traditionally popular in UAE and India. Good balance of purity and durability.</li>
                <li><strong>18K Gold:</strong> 75% pure gold - more durable for everyday wear, commonly used in fine jewelry worldwide.</li>
              </ul>
            </div>
            <p>
              It's important to understand that the carat rating can also impact the durability and strength of the gold piece. 24-karat gold is softer and more malleable than lower-carat ratings, which can make it more prone to scratches and dents. Lower carat ratings, like 18-karat gold, are stronger and more durable but may contain more alloy metals that can affect the color and appearance of the gold.
            </p>
          </div>
        </section>

        {/* Why Buy from Nilaas */}
        <section className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Nilaas for Gold Jewelry?</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Nilaas is committed to providing authentic, high-quality gold jewelry at transparent prices in the UAE. We understand that buying gold is an investment, which is why we offer:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Live gold rate updates throughout the day</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Transparent pricing calculator with full breakdown</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Certified purity for all gold products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Wide selection of 24K, 22K, and 18K jewelry</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Competitive making charges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span>Secure online shopping with UAE delivery</span>
              </li>
            </ul>
            <p className="text-sm text-amber-900 bg-amber-100 rounded-lg p-3 mt-4">
              <strong>Pro Tip:</strong> Use our calculator above to estimate the complete price of any gold piece based on current rates. This helps you budget accurately and compare prices transparently.
            </p>
          </div>
        </section>

        {/* Gold Investment Guide */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gold Investment in UAE</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Investing in gold can provide a hedge against inflation, and Dubai offers attractive opportunities due to its thriving gold market. However, it's important to remember that the gold price can fluctuate, and market conditions can change quickly.
            </p>
            <p>
              When buying gold jewelry in UAE, consider both the metal value and the artistry. At Nilaas, our pieces combine investment-grade gold with exquisite craftsmanship, making them perfect for personal enjoyment or as heirlooms.
            </p>
            <p>
              Whether you choose to invest in physical gold jewelry or monitor the market for future purchases, staying informed about the gold price and market conditions is essential. Bookmark this page to track live rates and use our tools to make informed decisions.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center py-4">
          <p>
            Prices shown are indicative and may vary. Actual retail prices include making charges, stone costs (if applicable), and VAT. 
            Nilaas updates gold rates throughout the day based on international market movements. 
            For the most accurate pricing on specific products, please contact our customer service or visit our showroom.
          </p>
        </div>
      </div>
    </div>
  )
}
