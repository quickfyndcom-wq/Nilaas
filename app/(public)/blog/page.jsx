'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { ChevronDown } from 'lucide-react'

export default function BlogPage() {
  const [blogs, setBlogs] = useState([])
  const [sliderBanners, setSliderBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [filterCategory, setFilterCategory] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blogsResponse, bannersResponse] = await Promise.all([
          axios.get('/api/blogs'),
          axios.get('/api/slider-banners')
        ])
        
        if (blogsResponse.data?.blogs) {
          setBlogs(blogsResponse.data.blogs)
          const uniqueCategories = [...new Set(blogsResponse.data.blogs.map(b => b.category))].filter(Boolean)
          setCategories(uniqueCategories)
        }
        
        if (bannersResponse.data?.banners) {
          setSliderBanners(bannersResponse.data.banners)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-slide effect
  useEffect(() => {
    const totalSlides = Math.max(
      sliderBanners.length,
      blogs.filter(b => b.featuredInSlider).length
    )
    
    if (totalSlides === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(totalSlides, 5))
    }, 5000)
    return () => clearInterval(interval)
  }, [sliderBanners.length, blogs.length])

  // Sort and filter blogs
  const getSortedBlogs = (blogsToSort) => {
    let sorted = [...blogsToSort]
    
    switch(sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title))
        break
      default:
        break
    }
    return sorted
  }

  const getFilteredAndSortedBlogs = () => {
    let filtered = blogs
    
    if (filterCategory !== 'all') {
      filtered = blogs.filter(b => b.category === filterCategory)
    }
    
    return getSortedBlogs(filtered)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading articles...</p>
      </main>
    )
  }

  const sortedAndFilteredBlogs = getFilteredAndSortedBlogs()
  const featuredBlogs = sortedAndFilteredBlogs
    .filter(b => b.featuredInSlider)
    .slice(0, 5)
  
  // Combine custom banners and featured articles for slider
  const sliderContent = [
    ...sliderBanners.map(banner => ({ type: 'banner', ...banner })),
    ...featuredBlogs.map(blog => ({ type: 'blog', ...blog }))
  ]
  
  const allBlogs = sortedAndFilteredBlogs

  return (
    <main className="min-h-screen bg-white">
      {/* Full Width Hero Slider */}
      {sliderContent.length > 0 && (
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900">
          {/* Slides */}
          <div 
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {sliderContent.map((slide) => {
              if (slide.type === 'banner') {
                return (
                  <div key={slide._id} className="flex-shrink-0 w-full h-full relative">
                    <img
                      src={slide.backgroundImage}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-2xl">
                          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-serif text-white mb-4 drop-shadow-2xl">
                            {slide.title}
                          </h1>
                          <div className="flex gap-4">
                            <Link
                              href={slide.buttonLink || '/'}
                              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-amber-50 transition-all duration-300 rounded shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                              {slide.buttonText || 'Shop Now'}
                              <span className="text-lg">→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              } else {
                // Blog article slide
                const blog = slide
                return (
                  <div key={blog._id} className="flex-shrink-0 w-full h-full relative">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-2xl">
                          {blog.category && (
                            <span className="inline-block px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold uppercase tracking-wide mb-4 rounded">
                              {blog.category}
                            </span>
                          )}
                          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-serif text-white mb-4 drop-shadow-2xl">
                            {blog.title}
                          </h1>
                          <p className="text-base sm:text-lg text-white/90 mb-8">
                            {blog.excerpt}
                          </p>
                          
                          {/* Slider Button */}
                          <div className="flex gap-4">
                            <Link
                              href={blog.sliderButtonLink || `/blog/${blog.slug}`}
                              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-amber-50 transition-all duration-300 rounded shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                              {blog.sliderButtonText || 'Read More'}
                              <span className="text-lg">→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>

          {/* Slide Indicators */}
          {sliderContent.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
              {sliderContent.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-10 sm:w-12 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blog Posts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
            Latest Articles
          </h2>
          <p className="text-lg text-gray-600">
            Expert insights, trends, and guides on jewelry and gold
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          {/* Filter by Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentSlide(0)
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
          </div>

          {/* Sort by */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentSlide(0)
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:border-amber-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* Blog Grid */}
        {allBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No articles available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {allBlogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
              >
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-200">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    {blog.category && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-semibold rounded-full text-xs uppercase">
                        {blog.category}
                      </span>
                    )}
                    {blog.createdAt && (
                      <span className="text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    {blog.author && (
                      <span className="text-sm text-gray-500">By {blog.author}</span>
                    )}
                    <span className="text-amber-700 font-semibold text-sm group-hover:underline">
                      Read More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
