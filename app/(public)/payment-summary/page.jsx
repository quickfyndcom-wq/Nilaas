'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import PageTitle from '@/components/PageTitle';

export default function PaymentSummaryPage() {
  const router = useRouter();
  const { cartItems } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);
  const [selectedPayment, setSelectedPayment] = useState('card');

  // Build cart array
  const cartArray = [];
  for (const [key, value] of Object.entries(cartItems || {})) {
    const product = products?.find((p) => String(p._id) === String(key));
    if (product) {
      cartArray.push({ ...product, quantity: value });
    }
  }

  const subtotal = cartArray.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const processingFee = 0;
  const discount = subtotal * 0.05; // 5% off
  const vat = (subtotal - discount + processingFee) * 0.05; // 5% VAT
  const total = subtotal - discount + processingFee + vat;

  const paymentOptions = [
    {
      id: 'card',
      name: 'Pay by Card',
      fee: 'Processing Fees: ₹0.00',
      icon: '💳',
    },
    {
      id: 'tabby',
      name: 'TABBY - FREE INSTALLMENT DEBIT CARD ACCEPTED',
      fee: 'Processing Fees: ₹0.00',
      icon: '🏷️',
    },
    {
      id: 'tamara',
      name: 'TAMARA - FREE INSTALLMENT DEBIT CARD ACCEPTED',
      fee: 'Processing Fees: ₹0.00',
      icon: '🏷️',
    },
  ];

  if (!cartItems || Object.keys(cartItems).length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</div>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Order Summary & Payment" />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column: Payment Options */}
            <div className="md:col-span-2">
              <div className="bg-white">
                {/* Order Summary Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Summary</h2>
                </div>

                {/* Payment Options */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Options</h3>
                  <div className="space-y-4">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPayment === option.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.id}
                          checked={selectedPayment === option.id}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="w-6 h-6 mt-1 accent-purple-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.fee}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {cartArray.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start gap-4 pb-4 border-b border-gray-200"
                      >
                        {item.images?.[0] && (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            Qty: {item.quantity} × ₹ {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          ₹ {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Price Details & Summary */}
            <div className="md:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Price Details</h3>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Processing Fee</span>
                    <span className="font-semibold">₹{processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Promotion Discount</span>
                    <span className="font-semibold">-5% OFF ₹{discount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b-2 border-yellow-300 my-4"></div>

                {/* Total */}
                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total (Inc. of VAT)</span>
                    <span className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Savings Badge */}
                <div className="bg-yellow-100 rounded-lg p-4 mb-6 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Your Total Savings</div>
                    <div className="text-green-600 font-bold">₹{discount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Pay Now Button */}
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
                >
                  <span>💳</span>
                  Pay Now ₹{total.toFixed(2)}
                </button>

                {/* Security Info */}
                <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  Safe & Secure Payment Transaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
