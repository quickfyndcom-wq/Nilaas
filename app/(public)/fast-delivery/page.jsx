'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';
import PageTitle from '@/components/PageTitle';
import Loading from '@/components/Loading';
import { TruckIcon, ZapIcon } from 'lucide-react';

export default function FastDeliveryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFastDeliveryProducts();
  }, []);

  const fetchFastDeliveryProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/products?category=Gold');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching gold products:', error);
      setError('Failed to load gold products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <PageTitle title="Gold Jewellery" />
      <div className="bg-gradient-to-b from-amber-50 to-white -mt-12 min-h-[50vh]">
 
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TruckIcon size={40} className="animate-bounce" />
              <ZapIcon size={32} className="text-yellow-300" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Gold Jewellery Collection
            </h1>
            <p className="text-center text-amber-100 text-lg max-w-2xl mx-auto">
              Explore our exquisite collection of gold jewelry. Timeless elegance in every piece.
            </p>
          </div>
        </div>

       
        <div className="max-w-7xl mx-auto px-4 py-12">
          {error ? (
            <div className="text-center py-16">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <button
                onClick={fetchFastDeliveryProducts}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <TruckIcon size={80} className="mx-auto text-gray-300 mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                No Gold Jewellery Available
              </h2>
              <p className="text-gray-600 mb-6">
                Check back soon for our gold jewelry collection!
              </p>
              <a
                href="/products"
                className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Browse All Jewellery
              </a>
            </div>
          ) : (
            <>
          
              <div className="bg-amber-50 border-l-4 border-amber-600 p-4 mb-8 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <ZapIcon className="text-amber-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Premium Gold Collection
                    </h3>
                    <p className="text-sm text-gray-600">
                      All products on this page are made from authentic gold. 
                      Browse our collection of stunning gold jewelry pieces!
                    </p>
                  </div>
                </div>
              </div>

             
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
