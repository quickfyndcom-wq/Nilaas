import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { label: 'Wedding', slug: 'wedding', img: '/assets/collection/wedding.jpg' },
  { label: 'Engagement', slug: 'engagement', img: '/assets/collection/engagement.jpg' },
  { label: 'Gifting', slug: 'gifting', img: '/assets/collection/gifting.jpg' },
  { label: 'Daily Wear', slug: 'daily-wear', img: '/assets/collection/daily-wear.jpg' },
  { label: 'Festive', slug: 'festive', img: '/assets/collection/festive.jpg' },
  { label: 'Party Wear', slug: 'party-wear', img: '/assets/collection/party-wear.jpg' },
];

const FindYourPieceModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          ×
        </button>
        {step === 1 && (
          <div className="flex flex-col items-center">
            <span className="bg-yellow-200 text-yellow-800 font-semibold px-3 py-1 rounded-full mb-3 text-xs">Find Your Perfect Piece</span>
            <h2 className="text-2xl font-bold text-center mb-2">Hi, Looking For Something Special?</h2>
            <button
              className="flex items-center border-2 border-orange-300 rounded-xl px-4 py-3 mt-4 mb-2 hover:shadow-lg transition"
              onClick={() => setStep(2)}
            >
              <span className="text-lg font-semibold mr-3">Yes, Something unique!</span>
              <img src="/assets/collection/gifting.jpg" alt="unique" className="w-14 h-14 rounded-full object-cover" />
            </button>
            <button
              className="mt-4 text-gray-400 hover:text-gray-700 text-sm"
              onClick={() => setOpen(false)}
            >
              I’m just browsing
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center">
            <span className="bg-yellow-200 text-yellow-800 font-semibold px-3 py-1 rounded-full mb-3 text-xs">Find Your Perfect Piece</span>
            <h2 className="text-2xl font-bold text-center mb-2">What’s On Your Mind Today?</h2>
            <p className="text-gray-500 text-center mb-4 text-sm">Jewellery tailored for your outfit, occasion & taste!</p>
            <div className="grid grid-cols-2 gap-3 w-full mb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  className="flex flex-col items-center bg-yellow-50 hover:bg-yellow-100 rounded-xl p-3 border border-yellow-100 hover:border-yellow-300 transition"
                  onClick={() => router.push(`/category/${cat.slug}`)}
                >
                  <span className="font-medium text-yellow-900 mb-1">{cat.label}</span>
                  <img src={cat.img} alt={cat.label} className="w-14 h-14 rounded object-cover" />
                </button>
              ))}
            </div>
            <button
              className="mt-2 text-gray-400 hover:text-gray-700 text-sm"
              onClick={() => setOpen(false)}
            >
              I’ll explore myself
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindYourPieceModal;
