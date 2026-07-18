'use client'

import ProductCard from "@/components/ProductCard";
import { StarIcon } from "lucide-react";
import { useSelector } from "react-redux";

export default function FiveStarRated() {
    const products = useSelector(state => state.product.list);

    // Filter products with 5-star average rating
    const fiveStarProducts = products.filter(product => {
        if (!product.rating || product.rating.length === 0) return false;
        
        const averageRating = product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length;
        return averageRating >= 4.5; // Products with 4.5+ stars
    });

    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon
                                    key={i}
                                    size={32}
                                    fill="#FFA500"
                                    className="text-orange-500"
                                />
                            ))}
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        5 Star Rated Products
                    </h1>
                    <p className="text-gray-600">
                        Discover our highest-rated products loved by customers ({fiveStarProducts.length} products)
                    </p>
                </div>

                {/* Products Grid */}
                {fiveStarProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {fiveStarProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <StarIcon size={48} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            No 5-Star Products Yet
                        </h2>
                        <p className="text-gray-500">
                            Check back soon for highly-rated products!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
