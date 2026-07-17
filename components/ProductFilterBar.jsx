import { useState, useMemo } from 'react'
import { FilterIcon, XIcon } from 'lucide-react'

export default function ProductFilterBar({
  products = [],
  filters,
  setFilters,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  searchQuery,
  setSearchQuery,
  categories = []
}) {
  // Count active filters
  const activeFiltersCount =
    (filters.categories?.length || 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0)

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
      {/* Filter Toggle */}
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
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search by name, tag..."
        className="w-64 md:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      {/* Category Quick Filters */}
      {categories.slice(0, 5).map(cat => (
        <button
          key={cat}
          onClick={() => setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
              ? prev.categories.filter(c => c !== cat)
              : [...prev.categories, cat]
          }))}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs ${filters.categories.includes(cat) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          {cat}
          {filters.categories.includes(cat) && <XIcon size={12} />}
        </button>
      ))}
      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600">Sort By:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="newest">Best Matches</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  )
}
