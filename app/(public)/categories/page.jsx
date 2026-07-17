'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Using placeholder images - replace with actual category images
import Image1 from '../../../assets/collection/floral-bloom-desktop.webp'
import Image2 from '../../../assets/collection/stunning-every-ear.webp'
import Image3 from '../../../assets/collection/wedding-gifts.jpg'

const featuredCategories = [
  {
    id: 1,
    title: 'EARRINGS',
    image: Image1,
    link: '/shop?category=earrings',
    description: 'Elegant earrings for every occasion'
  },
  {
    id: 2,
    title: 'FINGER RINGS',
    image: Image2,
    link: '/shop?category=rings',
    description: 'Beautiful rings to adorn your fingers'
  },
  {
    id: 3,
    title: 'PENDANTS',
    image: Image3,
    link: '/shop?category=pendants',
    description: 'Stunning pendants for a classic look'
  },
  {
    id: 4,
    title: 'MANGALSUTRA',
    image: Image1,
    link: '/shop?category=mangalsutra',
    description: 'Traditional mangalsutra designs'
  },
  {
    id: 5,
    title: 'BRACELETS',
    image: Image2,
    link: '/shop?category=bracelets',
    description: 'Stylish bracelets for your wrist'
  },
  {
    id: 6,
    title: 'BANGLES',
    image: Image3,
    link: '/shop?category=bangles',
    description: 'Classic bangles in various designs'
  },
  {
    id: 7,
    title: 'CHAINS',
    image: Image1,
    link: '/shop?category=chains',
    description: 'Elegant chains for everyday wear'
  },
  {
    id: 8,
    title: 'NECKLACES',
    image: Image2,
    link: '/shop?category=necklaces',
    description: 'Beautiful necklaces for special occasions'
  },
  {
    id: 9,
    title: 'NOSE PINS',
    image: Image3,
    link: '/shop?category=nose-pins',
    description: 'Delicate nose pins and studs'
  },
  {
    id: 10,
    title: 'ANKLETS',
    image: Image1,
    link: '/shop?category=anklets',
    description: 'Traditional and modern anklets'
  },
  {
    id: 11,
    title: 'COINS & BARS',
    image: Image2,
    link: '/shop?category=coins-bars',
    description: 'Gold and silver coins and bars'
  },
  {
    id: 12,
    title: 'ACCESSORIES',
    image: Image3,
    link: '/shop?category=accessories',
    description: 'Complete your look with accessories'
  }
]

export default function CategoriesPage() {
    const [dbCategories, setDbCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/store/categories')
            const data = await res.json()
            if (data.categories) {
                setDbCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900 mb-4">
                        Shop by Categories
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Explore our extensive collection of jewelry across all categories
                    </p>
                </div>
            </div>

            {/* All Categories Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : dbCategories.filter(cat => !cat.parentId).length > 0 ? (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-8">All Categories</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {dbCategories.filter(cat => !cat.parentId).map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/shop?category=${encodeURIComponent(category.name)}`}
                                    className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500"
                                >
                                    {/* Image */}
                                    <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-orange-100">
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="text-center p-4">
                                                    <svg className="w-20 h-20 mx-auto text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                                        <h3 className="text-base sm:text-lg font-semibold text-white uppercase tracking-wide mb-1">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-xs sm:text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-8">Featured Categories</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {featuredCategories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={category.link}
                                    className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500"
                                >
                                    {/* Image */}
                                    <div className="aspect-square relative">
                                        <Image
                                            src={category.image}
                                            alt={category.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                                        <h3 className="text-base sm:text-lg font-semibold text-white uppercase tracking-wide mb-1">
                                            {category.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {category.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
