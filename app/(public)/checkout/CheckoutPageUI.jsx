"use client";

import React, { useState, useEffect } from "react";
import { countryCodes } from "@/assets/countryCodes";
import { indiaStatesAndDistricts } from "@/assets/indiaStatesAndDistricts";
import { useSelector, useDispatch } from "react-redux";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { clearCart, addToCart, removeFromCart, deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { fetchShippingSettings, calculateShipping } from "@/lib/shipping";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

const inputClass =
  "w-full border border-[#2a1210]/15 bg-white px-4 py-2.5 text-sm text-[#2a1210] placeholder:text-[#9a7d72] focus:outline-none focus:border-[#2a1210] transition";

function getProductImage(item) {
  const first = item?.images?.[0] || item?.image;
  if (typeof first === "string" && first.trim()) return first;
  if (first?.url) return first.url;
  return "https://placehold.co/200x250?text=Nilaas";
}

const SignInModal = dynamic(() => import("@/components/SignInModal"), { ssr: false });
const AddressModal = dynamic(() => import("@/components/AddressModal"), { ssr: false });

export default function CheckoutPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const dispatch = useDispatch();
  const addressList = useSelector((state) => state.address?.list || []);
  const addressFetchError = useSelector((state) => state.address?.error);
  const { cartItems, hydrated: cartHydrated } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);

  const [form, setForm] = useState({
    addressId: "",
    payment: "razorpay",
    phoneCode: '+91',
    country: 'India',
    state: 'Kerala',
    district: '',
    street: '',
    city: '',
    pincode: '',
    name: '',
    email: '',
    phone: '',
  });

  // For India state/district dropdowns
  const keralaDistricts = indiaStatesAndDistricts.find(s => s.state === 'Kerala')?.districts || [];
  const [districts, setDistricts] = useState(keralaDistricts);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingSetting, setShippingSetting] = useState(null);
  const [shipping, setShipping] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Coupon logic
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!coupon.trim()) {
      setCouponError("Enter a coupon code to see discount.");
      return;
    }
    setCouponError("");
    // TODO: Add real coupon validation logic here
  };

  const router = useRouter();

  // Fetch products if not loaded
  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(fetchProducts({}));
    }
  }, [dispatch, products]);

  // Fetch addresses for logged-in users
  useEffect(() => {
    if (user && getToken) {
      dispatch(fetchAddress({ getToken }));
    }
  }, [user, getToken, dispatch]);

  // Auto-select first address
  useEffect(() => {
    if (user && addressList.length > 0 && !form.addressId) {
      setForm((f) => ({ ...f, addressId: addressList[0]._id }));
    }
  }, [user, addressList, form.addressId]);

  // Build cart array
  const cartArray = [];
  console.log('Checkout - Cart Items:', cartItems);
  console.log('Checkout - Products:', products?.map(p => ({ id: p._id, name: p.name })));
  
  for (const [key, value] of Object.entries(cartItems || {})) {
    const product = products?.find((p) => String(p._id) === String(key));
    if (product) {
      console.log('Found product for key:', key, product.name);
      cartArray.push({ ...product, quantity: value });
    } else {
      console.log('No product found for key:', key);
    }
  }
  
  console.log('Checkout - Final Cart Array:', cartArray);

  const subtotal = cartArray.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping;

  // Load shipping settings
  useEffect(() => {
    async function loadShipping() {
      const setting = await fetchShippingSettings();
      setShippingSetting(setting);
    }
    loadShipping();
  }, []);

  // Calculate dynamic shipping based on settings
  useEffect(() => {
    if (shippingSetting && cartArray.length > 0) {
      const calculatedShipping = calculateShipping({ cartItems: cartArray, shippingSetting });
      setShipping(calculatedShipping);
    } else {
      setShipping(0);
    }
  }, [shippingSetting, cartArray]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      // Update districts when state changes
      const stateObj = indiaStatesAndDistricts.find(s => s.state === value);
      setDistricts(stateObj ? stateObj.districts : []);
      setForm(f => ({ ...f, state: value, district: '' }));
    } else if (name === 'country') {
      setForm(f => ({ ...f, country: value, state: '', district: '' }));
      if (value !== 'India') setDistricts([]);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const [formError, setFormError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    // Validate required fields
    if (cartArray.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }
    setPlacingOrder(true);
    try {
      let addressId = form.addressId;
      // If logged in and no address selected, skip address creation for now
      // Orders can work without addressId
      
      // Validate payment method
      if (user && !form.payment) {
        setFormError("Please select a payment method.");
        setPlacingOrder(false);
        return;
      }
      if (!user) {
        if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.state || !form.country) {
          setFormError("Please fill all required shipping details.");
          setPlacingOrder(false);
          return;
        }
        if (!form.payment) {
          setFormError("Please select a payment method.");
          setPlacingOrder(false);
          return;
        }
      }
      // Build order payload
      let payload;
      
      console.log('Checkout - User state:', user ? 'logged in' : 'guest');
      console.log('Checkout - User object:', user);
      
      if (user) {
        console.log('Building logged-in user payload...');
        payload = {
          items: cartArray.map(({ _id, quantity }) => ({ id: _id, quantity })),
          paymentMethod: form.payment === 'cod' ? 'COD' : form.payment.toUpperCase(),
          shippingFee: shipping,
        };
        // Only add addressId if it exists
        if (addressId || (addressList[0] && addressList[0]._id)) {
          payload.addressId = addressId || addressList[0]._id;
        } else if (form.street && form.city && form.state && form.country) {
          // User is logged in but has no saved address - include address in payload
          payload.addressData = {
            name: form.name || user.displayName || '',
            email: form.email || user.email || '',
            phone: form.phone || '',
            street: form.street,
            city: form.city,
            state: form.state,
            country: form.country || 'UAE',
            zip: form.zip || form.pincode || '000000',
            district: form.district || ''
          };
        }
      } else {
        console.log('Building guest payload...');
        payload = {
          isGuest: true,
          guestInfo: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.street,
            street: form.street,
            city: form.city,
            state: form.state,
            country: form.country || 'India',
            pincode: form.pincode || '',
            district: form.district || '',
            zip: form.pincode || '000000',
          },
          items: cartArray.map(({ _id, quantity }) => ({ id: _id, quantity })),
          paymentMethod: form.payment === 'cod' ? 'COD' : form.payment.toUpperCase(),
          shippingFee: shipping,
        };
      }
      
      console.log('Submitting order:', payload);
      
      let fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      
      if (user && getToken) {
        console.log('Adding Authorization header for logged-in user...');
        const token = await getToken();
        console.log('Got token:', token ? 'yes' : 'no');
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`,
        };
      } else {
        console.log('No Authorization header - guest checkout');
      }
      
      console.log('Final fetch options:', { ...fetchOptions, body: 'payload' });
      
      const res = await fetch("/api/orders", fetchOptions);
      if (!res.ok) {
        const errorText = await res.text();
        let msg = errorText;
        try {
          const data = JSON.parse(errorText);
          msg = data.message || data.error || errorText;
        } catch {}
        setFormError(msg);
        setPlacingOrder(false);
        return;
      }
      const data = await res.json();

      // Online payment via Razorpay Checkout
      if (data.razorpay?.orderId) {
        try {
          await openRazorpayCheckout({
            key: data.razorpay.key,
            amount: data.razorpay.amount,
            currency: data.razorpay.currency || 'INR',
            orderId: data.razorpay.orderId,
            name: 'Nilaas',
            description: 'Order payment',
            prefill: data.razorpay.prefill || {},
            onSuccess: async (payment) => {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: payment.razorpay_order_id,
                  razorpay_payment_id: payment.razorpay_payment_id,
                  razorpay_signature: payment.razorpay_signature,
                  orderIds: data.orderIds || [data.id],
                }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed')
              }
              const paidOrderId = verifyData.id || data.id
              if (!paidOrderId) {
                throw new Error('Payment succeeded but order id is missing. Check My Orders.')
              }
              dispatch(clearCart())
              router.replace(`/order-success?orderId=${paidOrderId}`)
            },
          })
        } catch (payErr) {
          if (payErr?.message === 'Payment cancelled') {
            setFormError('Payment was cancelled. Your bag is still here — try Pay & place order again.')
          } else {
            setFormError(payErr.message || 'Payment failed. Please try again.')
          }
        } finally {
          setPlacingOrder(false)
        }
        return
      }

      const orderId = data._id || data.id || data.order?._id
      if (!orderId) {
        setFormError('Order may have been placed, but we could not open the confirmation page. Check My Orders.')
        setPlacingOrder(false)
        return
      }
      // Bag is cleared only after a successful order — this is intentional
      dispatch(clearCart())
      router.replace(`/order-success?orderId=${orderId}`)
    } catch (err) {
      setFormError(err.message || "Order failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (authLoading || !cartHydrated || !products || products.length === 0) {
    return (
      <div className="bg-white min-h-[50vh] flex items-center justify-center py-20">
        <p className="text-sm text-[#6e5048]">Loading your bag…</p>
      </div>
    );
  }

  if (!cartItems || Object.keys(cartItems).length === 0) {
    return (
      <div className="bg-white min-h-[55vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md border border-[#2a1210]/10 bg-white px-8 py-12">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">Nilaas</p>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2a1210] mb-3">Your bag is empty</h1>
          <p className="text-sm text-[#6e5048] mb-2 leading-relaxed">
            After you place an order, items are removed from the bag automatically.
          </p>
          <p className="text-sm text-[#6e5048] mb-8 leading-relaxed">
            If you just ordered, open your confirmation or My Orders — you do not need to checkout again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="inline-flex h-12 px-6 border border-[#2a1210] text-[#2a1210] text-sm font-semibold tracking-wide hover:bg-[#2a1210] hover:text-[#faf7f4] transition items-center justify-center"
            >
              My orders
            </button>
            <button
              type="button"
              onClick={() => router.push('/shop')}
              className="inline-flex h-12 px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition items-center justify-center"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8 border-b border-[#2a1210]/08 pb-6">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">Nilaas</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2a1210]">Checkout</h1>
          <p className="mt-2 text-sm text-[#6e5048]">
            {cartArray.length} {cartArray.length === 1 ? 'item' : 'items'} · Secure checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
            {/* Bag items */}
            <section className="border border-[#2a1210]/10 p-5 sm:p-7">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#8a5a4a] mb-1">Your bag</p>
              <h2 className="font-serif text-2xl text-[#2a1210] mb-5">Items</h2>
              <div className="space-y-0 divide-y divide-[#2a1210]/10">
                {cartArray.map((item) => (
                  <div key={item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <Link
                      href={`/product/${item.slug || item._id}`}
                      className="relative w-[72px] sm:w-[88px] shrink-0 overflow-hidden bg-slate-50 border border-slate-100"
                      style={{ aspectRatio: '4 / 5' }}
                    >
                      <Image
                        src={getProductImage(item)}
                        alt={item.name || 'Product'}
                        fill
                        className="object-cover object-center"
                        sizes="88px"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        href={`/product/${item.slug || item._id}`}
                        className="font-serif text-base sm:text-lg text-[#2a1210] leading-snug hover:text-[#6b2f28] line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-[#6e5048] mt-1 tabular-nums">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </p>
                      <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center border border-[#2a1210]/20">
                          <button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5"
                            onClick={() => {
                              if (item.quantity > 1) {
                                dispatch(removeFromCart({ productId: item._id }))
                              }
                            }}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="min-w-[1.75rem] text-center text-sm tabular-nums text-[#2a1210]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5"
                            onClick={() => dispatch(addToCart({ productId: item._id }))}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-xs tracking-wide uppercase text-[#9a7d72] hover:text-[#2a1210] transition"
                          onClick={() => dispatch(deleteItemFromCart({ productId: item._id }))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping method */}
            <section className="border border-[#2a1210]/10 p-5 sm:p-7">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#8a5a4a] mb-1">Delivery</p>
              <h2 className="font-serif text-2xl text-[#2a1210] mb-4">Shipping method</h2>
              <div className="border border-[#2a1210] bg-white p-4 sm:p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-[#2a1210]">
                    {shipping === 0
                      ? (shippingSetting?.methodTitleFree || 'Free shipping')
                      : (shippingSetting?.methodTitlePaid || 'Standard shipping')}
                  </p>
                  <p className="text-sm text-[#6e5048] mt-0.5">
                    {(shippingSetting?.deliverySubtitle || 'Delivered within {days} days').replace(
                      /\{days\}/gi,
                      shippingSetting?.estimatedDays || '1-3'
                    )}
                  </p>
                </div>
                <p className="font-semibold text-[#2a1210] tabular-nums shrink-0">
                  {shipping === 0
                    ? (shippingSetting?.freePriceLabel || 'FREE')
                    : `₹${shipping.toLocaleString('en-IN')}`}
                </p>
              </div>
            </section>

            {/* Shipping details + payment */}
            <section className="border border-[#2a1210]/10 p-5 sm:p-7">
              <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                {formError && (
                  <div className="border border-[#2a1210]/20 bg-white px-4 py-3 text-sm text-[#6b2f28]">
                    {formError}
                  </div>
                )}

                {!user && (
                  <div className="border border-[#2a1210]/12 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#2a1210]">Checkout as guest</p>
                      <p className="text-sm text-[#6e5048] mt-0.5">
                        Place your order without creating an account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSignIn(true)}
                      className="text-sm font-semibold text-[#2a1210] underline underline-offset-4 whitespace-nowrap"
                    >
                      Sign in instead
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-[11px] tracking-[0.22em] uppercase text-[#8a5a4a] mb-1">Address</p>
                  <h2 className="font-serif text-2xl text-[#2a1210]">Shipping details</h2>
                </div>

                {addressFetchError && (
                  <div className="text-sm text-[#6b2f28]">
                    {addressFetchError === 'Unauthorized' ? (
                      <>
                        Session expired.{' '}
                        <button
                          className="underline font-semibold"
                          type="button"
                          onClick={() => setShowSignIn(true)}
                        >
                          Sign in again
                        </button>
                      </>
                    ) : (
                      addressFetchError
                    )}
                  </div>
                )}

                {addressList.length > 0 && !showAddressModal && !addressFetchError ? (
                  <div className="border border-[#2a1210]/12 bg-white p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="text-sm text-[#4a3832] space-y-0.5">
                      <p className="font-semibold text-[#2a1210] text-base">{addressList[0].name}</p>
                      <p>{addressList[0].district || addressList[0].city}</p>
                      <p>{addressList[0].street}</p>
                      <p>
                        {addressList[0].city}, {addressList[0].state}, {addressList[0].country}
                      </p>
                      <p className="text-[#6e5048] pt-1">
                        {addressList[0].phoneCode} {addressList[0].phone}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-3 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        className="text-sm font-semibold text-[#2a1210] underline underline-offset-4"
                        onClick={() => setShowAddressModal(true)}
                      >
                        Change address
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-[#6e5048] hover:text-[#2a1210] underline underline-offset-4"
                        onClick={() => setShowAddressModal(true)}
                      >
                        Add new address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      className={inputClass}
                      type="text"
                      name="name"
                      placeholder="Full name"
                      value={form.name || ''}
                      onChange={handleChange}
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        className={`${inputClass} max-w-[110px]`}
                        name="phoneCode"
                        value={form.phoneCode}
                        onChange={handleChange}
                        required
                      >
                        {countryCodes.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        type="tel"
                        name="phone"
                        placeholder="Phone number"
                        value={form.phone || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <input
                      className={inputClass}
                      type="email"
                      name="email"
                      placeholder="Email address (optional)"
                      value={form.email || ''}
                      onChange={handleChange}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className={inputClass}
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        value={form.pincode || ''}
                        onChange={handleChange}
                        required={form.country === 'India'}
                      />
                      <input
                        className={inputClass}
                        type="text"
                        name="city"
                        placeholder="City"
                        value={form.city || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {form.country === 'India' && (
                      <select
                        className={inputClass}
                        name="district"
                        value={form.district}
                        onChange={handleChange}
                        required={!!form.state}
                        disabled={!form.state}
                      >
                        <option value="">Select district</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      className={inputClass}
                      type="text"
                      name="street"
                      placeholder="Full address (street, building, apartment)"
                      value={form.street || ''}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        className={inputClass}
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select state</option>
                        {indiaStatesAndDistricts.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClass}
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        required
                      >
                        <option value="India">India</option>
                        {countryCodes
                          .filter((c) => c.label !== 'India')
                          .map((c) => (
                            <option key={c.label} value={c.label.replace(/ \(.*\)/, '')}>
                              {c.label.replace(/ \(.*\)/, '')}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#2a1210]/10">
                  <p className="text-[11px] tracking-[0.22em] uppercase text-[#8a5a4a] mb-1">Payment</p>
                  <h2 className="font-serif text-2xl text-[#2a1210] mb-4">Payment method</h2>
                  <div className="flex flex-col gap-3">
                    <label
                      className={`flex items-start gap-3 cursor-pointer border px-4 py-3.5 transition ${
                        form.payment === 'razorpay'
                          ? 'border-[#2a1210] bg-white'
                          : 'border-[#2a1210]/15 hover:border-[#2a1210]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={form.payment === 'razorpay'}
                        onChange={handleChange}
                        className="accent-[#2a1210] w-4 h-4 mt-0.5"
                      />
                      <span>
                        <span className="block font-medium text-[#2a1210]">Pay online</span>
                        <span className="block text-sm text-[#6e5048] mt-0.5">
                          UPI, cards, netbanking &amp; wallets via Razorpay
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex items-start gap-3 cursor-pointer border px-4 py-3.5 transition ${
                        form.payment === 'cod'
                          ? 'border-[#2a1210] bg-white'
                          : 'border-[#2a1210]/15 hover:border-[#2a1210]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={form.payment === 'cod'}
                        onChange={handleChange}
                        className="accent-[#2a1210] w-4 h-4 mt-0.5"
                      />
                      <span>
                        <span className="block font-medium text-[#2a1210]">Cash on delivery</span>
                        <span className="block text-sm text-[#6e5048] mt-0.5">
                          Pay when your order arrives
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 border border-[#2a1210]/10 bg-white p-5 sm:p-7">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#8a5a4a] mb-1">Summary</p>
              <h2 className="font-serif text-2xl text-[#2a1210] mb-5">Order details</h2>

              <form onSubmit={handleApplyCoupon} className="mb-5 flex gap-2">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Discount code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 border border-[#2a1210] text-[#2a1210] text-sm font-semibold hover:bg-[#2a1210] hover:text-[#faf7f4] transition"
                >
                  Apply
                </button>
              </form>
              {couponError && <p className="text-xs text-[#6b2f28] mb-3">{couponError}</p>}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#6e5048]">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-[#2a1210]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#6e5048]">
                  <span>Shipping &amp; handling</span>
                  <span className="tabular-nums text-[#2a1210]">
                    {shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'FREE'}
                  </span>
                </div>
                <div className="border-t border-[#2a1210]/10 pt-4 flex justify-between items-baseline">
                  <span className="font-serif text-xl text-[#2a1210]">Total</span>
                  <span className="text-lg font-semibold text-[#2a1210] tabular-nums">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="mt-6 w-full h-13 min-h-[52px] bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition disabled:opacity-50"
                disabled={placingOrder}
              >
                {placingOrder
                  ? form.payment === 'razorpay'
                    ? 'Opening payment…'
                    : 'Placing order…'
                  : form.payment === 'razorpay'
                    ? 'Pay & place order'
                    : 'Place order'}
              </button>

              <p className="mt-4 text-xs text-[#9a7d72] text-center leading-relaxed">
                By placing your order you agree to our terms &amp; return policy.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AddressModal
        open={showAddressModal}
        setShowAddressModal={setShowAddressModal}
        onAddressAdded={(addr) => {
          setForm((f) => ({ ...f, addressId: addr._id }))
          dispatch(fetchAddress({ getToken }))
        }}
      />
      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </div>
  )
}