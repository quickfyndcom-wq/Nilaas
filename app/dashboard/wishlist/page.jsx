'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { HeartIcon, ShoppingCartIcon } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import Loading from '@/components/Loading'
import { useAuth } from '@/lib/useAuth'

function productImage(product) {
  const img = product?.images?.[0]
  if (typeof img === 'string' && img.trim()) return img
  if (img?.url) return img.url
  return '/placeholder.png'
}

export default function DashboardWishlistPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { user, loading: authLoading, getToken } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState([])
  const [addingToCart, setAddingToCart] = useState(false)

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        setWishlist([])
        return
      }
      const { data } = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWishlist(Array.isArray(data?.wishlist) ? data.wishlist : [])
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error(error?.response?.data?.error || 'Failed to load wishlist')
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (user) {
      fetchWishlist()
    } else {
      setLoading(false)
      setWishlist([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const removeFromWishlist = async (productId) => {
    try {
      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }
      await axios.post(
        '/api/wishlist',
        { productId, action: 'remove' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setWishlist((prev) => prev.filter((item) => item.productId !== productId))
      setSelectedItems((prev) => prev.filter((id) => id !== productId))
      window.dispatchEvent(new Event('wishlistUpdated'))
      toast.success('Removed from wishlist')
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error(error?.response?.data?.error || 'Failed to remove')
    }
  }

  const handleAddToCart = (product) => {
    if (!product) return
    dispatch(
      addToCart({
        productId: product._id || product.id,
        product,
      })
    )
    toast.success('Added to cart')
  }

  const toggleSelectItem = (productId) => {
    setSelectedItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const selectAllItems = () => {
    if (selectedItems.length === wishlist.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(wishlist.map((item) => item.productId))
    }
  }

  const addSelectedToCart = () => {
    if (selectedItems.length === 0) return
    setAddingToCart(true)
    try {
      selectedItems.forEach((productId) => {
        const item = wishlist.find((w) => w.productId === productId)
        if (item?.product) handleAddToCart(item.product)
      })
      toast.success(`Added ${selectedItems.length} item(s) to cart`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add some items to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const calculateTotal = () =>
    selectedItems.reduce((total, productId) => {
      const item = wishlist.find((w) => w.productId === productId)
      return total + (item?.product?.price || 0)
    }, 0)

  if (authLoading || (user && loading)) return <Loading />

  if (!user) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-[#2a1210]">Wishlist</h1>
        <p className="mb-4 text-sm text-[#6b2f28]">Please sign in to view your wishlist.</p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('openSignInModal'))}
          className="inline-block rounded-lg bg-[#2a1210] px-4 py-2 text-sm text-[#f5ebe4]"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold text-[#2a1210] sm:text-2xl">Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="rounded-xl border border-[#2a1210]/10 bg-white p-8 text-center">
          <HeartIcon size={48} className="mx-auto mb-3 text-[#9a7d72]" />
          <h2 className="mb-1 text-lg font-semibold text-[#2a1210]">Your wishlist is empty</h2>
          <p className="mb-5 text-sm text-[#6b2f28]">Start adding products you love.</p>
          <button
            onClick={() => router.push('/products')}
            className="rounded-lg bg-[#2a1210] px-5 py-2.5 text-sm text-[#f5ebe4]"
          >
            Browse products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2a1210]/10 bg-white p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === wishlist.length && wishlist.length > 0}
                onChange={selectAllItems}
                className="h-4 w-4"
              />
              <span className="text-sm text-[#6b2f28]">
                {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
              </span>
            </div>
            {selectedItems.length > 0 && (
              <button
                onClick={addSelectedToCart}
                disabled={addingToCart}
                className="flex items-center gap-2 rounded-lg bg-[#2a1210] px-3 py-2 text-sm text-[#f5ebe4]"
              >
                <ShoppingCartIcon size={16} />
                {addingToCart ? 'Adding…' : 'Add to cart'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {wishlist.map((item) => (
              <div
                key={item.productId}
                className="rounded-xl border border-[#2a1210]/10 bg-white p-3 sm:p-4"
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.productId)}
                    onChange={() => toggleSelectItem(item.productId)}
                    className="mt-2 h-4 w-4 shrink-0"
                  />
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#f5ebe4] sm:h-24 sm:w-24">
                    <Image
                      src={productImage(item.product)}
                      alt={item.product?.name || ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-medium text-[#2a1210] sm:text-base">
                      {item.product?.name || 'Product'}
                    </h3>
                    <p className="mt-1 font-semibold text-[#2a1210]">
                      ₹{item.product?.price ?? '—'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAddToCart(item.product)}
                        className="rounded-lg bg-[#2a1210] px-3 py-1.5 text-xs text-[#f5ebe4] sm:text-sm"
                      >
                        Add to cart
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="px-3 py-1.5 text-xs text-[#6b2f28] sm:text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
