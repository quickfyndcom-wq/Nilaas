'use client'
import { useRouter } from 'next/navigation';

export default function OrderFailed() {
  const router = useRouter();
  return (
    <div className='max-w-xl mx-auto p-6 bg-white rounded-lg shadow mt-10 text-center'>
      <h2 className='text-2xl font-bold text-red-600 mb-2'>Order Failed</h2>
      <p className='mb-4 text-gray-700'>Sorry, your order could not be placed. Please try again or contact support.</p>
      <button className='bg-orange-500 text-white px-6 py-2 rounded-lg font-bold' onClick={() => router.push('/')}>Continue Shopping</button>
    </div>
  );
}
