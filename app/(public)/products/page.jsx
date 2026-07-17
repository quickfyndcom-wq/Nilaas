'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'
import ProductCard from '@/components/ProductCard'
import { ChevronDownIcon, ChevronUpIcon, FilterIcon, XIcon, StarIcon, PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ProductsContent() {
    const dispatch = useDispatch();
    const products = useSelector(state => state.product.list)

    // Always fetch latest products on mount
    useEffect(() => {
        dispatch(fetchProducts({}))
    }, [dispatch])
    const searchParams = useSearchParams()
    const categoryParam = searchParams.get('category')

    const [showFilters, setShowFilters] = useState(false)
    const [showMoreCats, setShowMoreCats] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState({ price: true, categories: true, rating: true, stock: false })
    const [filters, setFilters] = useState({
        categories: categoryParam ? [categoryParam] : [],
        priceRange: [0, 100000],
        minRating: 0,
        inStock: false
    })
    const [sortBy, setSortBy] = useState('newest') // newest, price-low, price-high, rating
    const [searchQuery, setSearchQuery] = useState('')

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set()
        products.forEach(p => p.category && cats.add(p.category))
        return Array.from(cats).sort()
    }, [products])

    // Toggle category filter
    const toggleCategory = (category) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }))
    }

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            categories: [],
            priceRange: [0, 100000],
            minRating: 0,
            inStock: false
        })
        setSortBy('newest')
    }

    const applyPriceRange = (min, max) => {
        setFilters(prev => ({ ...prev, priceRange: [min, max] }))
    }

    const applyCategory = (label) => {
        // Map friendly labels to actual category keys where needed
        const category = label === 'Gold Jewellery' ? 'Gold' : label
        toggleCategory(category)
    }

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = [...products]

        // Only include products with a slug
        filtered = filtered.filter(p => p.slug && typeof p.slug === 'string' && p.slug.length > 0)

        // Filter by category
        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category))
        }

        // Filter by price range
        filtered = filtered.filter(p => 
            p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
        )

        // Filter by rating
        if (filters.minRating > 0) {
            filtered = filtered.filter(p => {
                const avgRating = p.rating?.length 
                    ? p.rating.reduce((acc, r) => acc + r.rating, 0) / p.rating.length 
                    : 0
                return avgRating >= filters.minRating
            })
        }

        // Filter by stock
        if (filters.inStock) {
            filtered = filtered.filter(p => p.inStock)
        }

        // Text search filter
        if (searchQuery && searchQuery.trim().length > 0) {
            const q = searchQuery.trim().toLowerCase()
            filtered = filtered.filter(p => {
                const fields = [p.name, p.description, p.shortDescription, p.category]
                const tags = Array.isArray(p.tags) ? p.tags : []
                const inText = fields.some(f => typeof f === 'string' && f.toLowerCase().includes(q))
                const inTags = tags.some(t => String(t).toLowerCase().includes(q))
                return inText || inTags
            })
        }

        // Sort products
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price)
                break
            case 'rating':
                filtered.sort((a, b) => {
                    const avgA = a.rating?.length ? a.rating.reduce((acc, r) => acc + r.rating, 0) / a.rating.length : 0
                    const avgB = b.rating?.length ? b.rating.reduce((acc, r) => acc + r.rating, 0) / b.rating.length : 0
                    return avgB - avgA
                })
                break
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                break
        }

        return filtered
    }, [products, filters, sortBy])

    const activeFiltersCount = 
        filters.categories.length + 
        (filters.minRating > 0 ? 1 : 0) + 
        (filters.inStock ? 1 : 0) +
        (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0)

    return (
        <div className="bg-white">
            <div className="max-w-[1400px] mx-auto px-4 py-6">
                {/* Header with Results Count */}
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-3xl md:text-4xl font-serif text-gray-900">
                        All Jewellery <span className="text-gray-500 text-xl">({filteredProducts.length} results)</span>
                    </h1>
                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e)=> setSearchQuery(e.target.value)}
                            placeholder="Search by name, tag..."
                            className="w-64 md:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                {/* Filter Chips & Sort */}
                <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
                    {/* Filter Toggle (desktop + mobile) */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                        <FilterIcon size={18} />
                        Filter
                        {activeFiltersCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Quick Filters (suggested) */}
                    <button
                        onClick={() => applyPriceRange(25000, 50000)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                        aria-label="₹ 25,000 - ₹ 50,000"
                    >
                        <PlusIcon size={14} />
                        <span>₹ 25,000 - ₹ 50,000</span>
                    </button>
                    <button
                        onClick={() => applyCategory('Gifts For Him')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                    >
                        <PlusIcon size={14} />
                        <span>Gifts For Him</span>
                    </button>
                    <button
                        onClick={() => applyCategory('Women')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                    >
                        <PlusIcon size={14} />
                        <span>Women</span>
                    </button>
                    <button
                        onClick={() => applyCategory('Gold Jewellery')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                    >
                        <PlusIcon size={14} />
                        <span>Gold Jewellery</span>
                    </button>
                    <button
                        onClick={() => setShowMoreCats(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                    >
                        <PlusIcon size={14} />
                        <span>Show More</span>
                        {showMoreCats ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                    </button>

                    {showMoreCats && (
                        <div className="w-full flex flex-wrap items-center gap-2 pl-8">
                            {categories.slice(0, 10).map(cat => (
                                <button
                                    key={`more-${cat}`}
                                    onClick={() => applyCategory(cat)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50"
                                >
                                    <PlusIcon size={12} />
                                    <span>{cat}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Active Filter Chips */}
                    {filters.categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                        >
                            <span>{cat}</span>
                            <XIcon size={14} />
                        </button>
                    ))}
                    
                    {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                        >
                            <span>₹ {filters.priceRange[0].toLocaleString()} - ₹ {filters.priceRange[1].toLocaleString()}</span>
                            <XIcon size={14} />
                        </button>
                    )}

                    {filters.minRating > 0 && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                        >
                            <span className="flex items-center gap-1">
                                <StarIcon size={14} className="fill-yellow-400 text-yellow-400" />
                                {filters.minRating}+ Rating
                            </span>
                            <XIcon size={14} />
                        </button>
                    )}

                    {filters.inStock && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, inStock: false }))}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                        >
                            <span>In Stock Only</span>
                            <XIcon size={14} />
                        </button>
                    )}

                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
                        >
                            Clear All
                        </button>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sort By:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        >
                            <option value="newest">Best Matches</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                        </select>
                    </div>
                </div>

                {/* Filter Modal - Only on Filter Click */}
                {showFilters && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowFilters(false)}></div>
                        
                        {/* Filter Panel */}
                        <div className="fixed inset-y-0 left-0 w-full sm:w-96 bg-white z-50 overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Filter By</h2>
                                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                                    <XIcon size={24} />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Clear Filters */}
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium border border-orange-600 rounded px-4 py-2 hover:bg-orange-50"
                                    >
                                        Clear Filters
                                    </button>
                                )}

                                {/* Price */}
                                <div className="border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleGroup('price')}
                                        className="w-full flex items-center justify-between py-2 text-gray-900 font-medium hover:text-orange-600"
                                    >
                                        <span>Price</span>
                                        {expandedGroups.price ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                                    </button>
                                    {expandedGroups.price && (
                                        <div className="mt-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={filters.priceRange[0]}
                                                    onChange={(e) => setFilters(prev => ({
                                                        ...prev,
                                                        priceRange: [Number(e.target.value), prev.priceRange[1]]
                                                    }))}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                                />
                                                <span className="text-gray-500">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={filters.priceRange[1]}
                                                    onChange={(e) => setFilters(prev => ({
                                                        ...prev,
                                                        priceRange: [prev.priceRange[0], Number(e.target.value)]
                                                    }))}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100000"
                                                step="1000"
                                                value={filters.priceRange[1]}
                                                onChange={(e) => setFilters(prev => ({
                                                    ...prev,
                                                    priceRange: [prev.priceRange[0], Number(e.target.value)]
                                                }))}
                                                className="w-full accent-purple-600"
                                            />
                                            <p className="text-xs text-gray-600">
                                                ₹ {filters.priceRange[0].toLocaleString()} - ₹ {filters.priceRange[1].toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Jewellery Type / Categories */}
                                <div className="border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleGroup('categories')}
                                        className="w-full flex items-center justify-between py-2 text-gray-900 font-medium hover:text-orange-600"
                                    >
                                        <span>Jewellery Type</span>
                                        {expandedGroups.categories ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                                    </button>
                                    {expandedGroups.categories && (
                                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                            {categories.map(category => (
                                                <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.categories.includes(category)}
                                                        onChange={() => toggleCategory(category)}
                                                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{category}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Minimum Rating */}
                                <div className="border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleGroup('rating')}
                                        className="w-full flex items-center justify-between py-2 text-gray-900 font-medium hover:text-orange-600"
                                    >
                                        <span>Minimum Rating</span>
                                        {expandedGroups.rating ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                                    </button>
                                    {expandedGroups.rating && (
                                        <div className="mt-3 space-y-2">
                                            {[4, 3, 2, 1].map(rating => (
                                                <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input
                                                        type="radio"
                                                        name="rating"
                                                        checked={filters.minRating === rating}
                                                        onChange={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                                                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: rating }).map((_, i) => (
                                                            <StarIcon key={i} size={14} fill="#FFA500" className="text-orange-500" />
                                                        ))}
                                                        <span className="text-sm text-gray-700">& Up</span>
                                                    </div>
                                                </label>
                                            ))}
                                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    checked={filters.minRating === 0}
                                                    onChange={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                                                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                                                />
                                                <span className="text-sm text-gray-700">All Ratings</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Availability */}
                                <div>
                                    <button
                                        onClick={() => toggleGroup('stock')}
                                        className="w-full flex items-center justify-between py-2 text-gray-900 font-medium hover:text-orange-600"
                                    >
                                        <span>Availability</span>
                                        {expandedGroups.stock ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                                    </button>
                                    {expandedGroups.stock && (
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={filters.inStock}
                                                onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                            <span className="text-sm font-medium text-gray-900">In Stock Only</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                                <button
                                    onClick={clearFilters}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Clear Filters
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium"
                                >
                                    Show Results ({filteredProducts.length})
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-6">

                    {/* Products Grid */}
                    <main className="flex-1">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-gray-400 mb-4">
                                    <FilterIcon size={64} className="mx-auto" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading products…</div>}>
            <ProductsContent />
        </Suspense>
    )
}
