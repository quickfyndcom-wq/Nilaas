'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
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
      const { data } = await axios.get('/api/products?fastDelivery=true');
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching fast delivery products:', err);
      setError('Failed to load fast delivery products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <PageTitle title="Fast Delivery" />
      <div className="bg-[#faf6f2] -mt-12 min-h-[50vh]">
        <div className="bg-[#1a0f0d] text-[#f5ebe4] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TruckIcon size={40} className="animate-bounce" />
              <ZapIcon size={32} className="text-[#c9a99a]" />
            </div>
            <h1 className="font-serif text-3xl md:text-5xl text-center mb-4">
              Fast Delivery
            </h1>
            <p className="text-center text-[#d4c4bb] text-lg max-w-2xl mx-auto">
              Dresses, kurtis and co-ords ready to ship quickly — everyday ethnic fashion for women.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {error ? (
            <div className="text-center py-16">
              <div className="text-red-600 text-lg mb-4">{error}</div>
              <button
                type="button"
                onClick={fetchFastDeliveryProducts}
                className="px-6 py-3 bg-[#2a1210] text-[#f5ebe4] text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <TruckIcon size={80} className="mx-auto text-[#e8ddd4] mb-6" />
              <h2 className="font-serif text-2xl text-[#2a1210] mb-3">
                No fast delivery styles right now
              </h2>
              <p className="text-[#6e5048] mb-6">
                Check back soon, or browse the full collection.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-3 bg-[#2a1210] text-[#f5ebe4] text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition"
              >
                Shop the collection
              </Link>
            </div>
          ) : (
            <>
              <div className="border-l-4 border-[#6b2f28] bg-white p-4 mb-8">
                <div className="flex items-center gap-3">
                  <ZapIcon className="text-[#6b2f28]" size={24} />
                  <div>
                    <h3 className="font-semibold text-[#2a1210] mb-1">
                      Quick ship picks
                    </h3>
                    <p className="text-sm text-[#6e5048]">
                      These styles are marked for faster dispatch from Nilaas.
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
