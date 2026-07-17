'use client'
import { useMemo } from "react";
import { useSelector } from "react-redux";
import ProductCard from "@/components/ProductCard";
import PageTitle from "@/components/PageTitle";

export default function TopSellingPage() {
    const products = useSelector(state => state.product.list);

    // Calculate total orders for each product and sort
    const topSellingProducts = useMemo(() => {
        // For now, we'll sort by creation date as a placeholder
        // In a real scenario, you'd calculate based on actual order data
        return [...products].sort((a, b) => {
            // Sort by number of ratings as a proxy for popularity
            const aRatings = a.rating?.length || 0;
            const bRatings = b.rating?.length || 0;
            return bRatings - aRatings;
        });
    }, [products]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* <PageTitle title="Top Selling Items" /> */}
            
            <div className="mb-6 mt-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Selling Products</h1>
                <p className="text-gray-600">Discover our most popular products loved by customers</p>
            </div>

            {topSellingProducts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">No products available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {topSellingProducts.map((product) => (
                        <ProductCard key={product._id || product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
