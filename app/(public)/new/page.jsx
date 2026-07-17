'use client'
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ProductCard from "@/components/ProductCard";
import PageTitle from "@/components/PageTitle";
import { FilterIcon, XIcon } from "lucide-react";

export default function NewProductsPage() {
    const products = useSelector(state => state.product.list);
    const [filters, setFilters] = useState({
        priceRange: [0, 100000],
        categories: []
    });
    const [sortBy, setSortBy] = useState('newest');

    // Sort and filter products
    const newProducts = useMemo(() => {
        let filtered = [...products].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA; // newest first
        });

        // Apply price filter
        filtered = filtered.filter(product => {
            const price = product.price || 0;
            return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });

        // Apply category filter if selected
        if (filters.categories.length > 0) {
            filtered = filtered.filter(product => 
                filters.categories.includes(product.category)
            );
        }

        // Apply sort
        if (sortBy === 'price-low') {
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        }

        return filtered;
    }, [products, filters, sortBy]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">New Arrivals</h1>
                <p className="text-sm text-gray-500">{newProducts.length} item{newProducts.length === 1 ? '' : 's'}</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
                {/* Filter Toggle */}
                <button
                    onClick={() => {}}
                    className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                >
                    <FilterIcon size={18} />
                    Filter
                </button>

                {/* Price Filter Chip */}
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                        <span>₹{filters.priceRange[0].toLocaleString('en-IN')} - ₹{filters.priceRange[1].toLocaleString('en-IN')}</span>
                        <XIcon size={14} />
                    </button>
                )}

                {/* Sort Dropdown */}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort By:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                    >
                        <option value="newest">Best Matches</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {newProducts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
                    No products available yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {newProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
