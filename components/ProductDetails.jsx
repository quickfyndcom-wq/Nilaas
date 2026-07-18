'use client'

import {
  StarIcon,
  Share2Icon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  TruckIcon,
  RefreshCwIcon,
  RulerIcon,
  ChevronDownIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { addToCart, uploadCart } from '@/lib/features/cart/cartSlice'
import MobileProductActions from './MobileProductActions'
import { useAuth } from '@/lib/useAuth'
import { colorToSwatch, isLightSwatch } from '@/lib/fashion-colors'
import { trackMeta } from '@/lib/metaPixel'

function formatMoney(val) {
  const num = Number(val)
  if (Number.isNaN(num)) return '0'
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function resolveImageUrl(img) {
  if (!img) return null
  if (typeof img === 'string') return img.trim() || null
  if (typeof img === 'object') return img.url || img.src || img.secure_url || null
  return null
}

const ProductDetails = ({ product, reviews = [] }) => {
  const loading = useSelector((state) => state.product?.status === 'loading')
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
  const images = useMemo(() => {
    if (!Array.isArray(product?.images)) return []
    return product.images.map(resolveImageUrl).filter(Boolean)
  }, [product?.images])
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const mainImage = images[activeImageIndex] || images[0] || null
  const [imageLoading, setImageLoading] = useState(true)
  const [displayImage, setDisplayImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showWishlistToast, setShowWishlistToast] = useState(false)
  const [wishlistMessage, setWishlistMessage] = useState('')
  const [showCartToast, setShowCartToast] = useState(false)
  const [showEnquiryModal, setShowEnquiryModal] = useState(false)
  const [enquiryName, setEnquiryName] = useState('')
  const [enquiryEmail, setEnquiryEmail] = useState('')
  const [enquiryCountryCode, setEnquiryCountryCode] = useState('+91')
  const [enquiryPhone, setEnquiryPhone] = useState('')
  const [enquiryMessage, setEnquiryMessage] = useState('')
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [openPanel, setOpenPanel] = useState('story')
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const dispatch = useDispatch()
  const cartCount = useSelector((state) => state.cart.total)
  const shareMenuRef = useRef(null)

  const [fetchedReviews, setFetchedReviews] = useState([])
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await axios.get(`/api/review?productId=${product._id}`)
        setFetchedReviews(data.reviews || [])
      } catch {}
    })()
  }, [product._id])

  // Meta Pixel — ViewContent when product page is viewed
  useEffect(() => {
    if (!product?._id) return
    trackMeta('ViewContent', {
      content_ids: [String(product._id)],
      content_name: product.name || product.title || '',
      content_type: 'product',
      value: Number(product.price) || 0,
      currency: 'INR',
    })
  }, [product._id])

  const reviewsToUse = fetchedReviews.length > 0 ? fetchedReviews : reviews
  const averageRating =
    reviewsToUse.length > 0
      ? reviewsToUse.reduce((acc, item) => acc + (item.rating || 0), 0) / reviewsToUse.length
      : typeof product.averageRating === 'number'
        ? product.averageRating
        : 0
  const reviewCount =
    reviewsToUse.length > 0
      ? reviewsToUse.length
      : typeof product.ratingCount === 'number'
        ? product.ratingCount
        : 0

  const variants = Array.isArray(product.variants) ? product.variants : []
  const variantColors = [...new Set(variants.map((v) => v.options?.color).filter(Boolean))]
  const variantSizes = [...new Set(variants.map((v) => v.options?.size).filter(Boolean))]
  const colors =
    variantColors.length > 0
      ? variantColors
      : Array.isArray(product.colors)
        ? product.colors
        : []
  const sizes =
    variantSizes.length > 0 ? variantSizes : Array.isArray(product.sizes) ? product.sizes : []

  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedSize, setSelectedSize] = useState(sizes[0] || null)

  const selectedVariant =
    variants.find((v) => {
      const cOk = v.options?.color ? v.options.color === selectedColor : true
      const sOk = v.options?.size ? v.options.size === selectedSize : true
      return cOk && sOk
    }) || null

  // Reset gallery when product / image list changes
  useEffect(() => {
    setActiveImageIndex(0)
    const first = images[0] || null
    setDisplayImage(first)
    setImageLoading(Boolean(first))
  }, [product._id, images[0]])

  // Show loader when switching to a new main image
  useEffect(() => {
    if (!mainImage) return
    if (mainImage === displayImage) {
      setImageLoading(false)
      setIsFading(false)
      return
    }
    setImageLoading(true)
    setIsFading(true)
  }, [mainImage, displayImage])

  // Prefer variant image when color/size changes
  useEffect(() => {
    const variantUrl = resolveImageUrl(selectedVariant?.image)
    if (!variantUrl || images.length === 0) return
    const idx = images.findIndex((u) => u === variantUrl)
    if (idx >= 0 && idx !== activeImageIndex) {
      setActiveImageIndex(idx)
    }
  }, [selectedVariant?.image, selectedColor, selectedSize, images])

  const effPrice = selectedVariant?.price ?? product.price
  const effAED = selectedVariant?.AED ?? product.AED
  const discountPercent =
    Number(effAED) > Number(effPrice)
      ? Math.round(((Number(effAED) - Number(effPrice)) / Number(effAED)) * 100)
      : 0
  const numericEffPrice = Number(effPrice)
  const numericEffAED = Number(effAED)
  const showPrice = Number.isFinite(numericEffPrice) && numericEffPrice > 0
  const showStrike = showPrice && Number.isFinite(numericEffAED) && numericEffAED > numericEffPrice
  const inStock =
    selectedVariant?.stock != null
      ? Number(selectedVariant.stock) > 0
      : product.inStock !== false && (product.stockQuantity == null || product.stockQuantity > 0)

  const fabricDetails = Array.isArray(product.fabricDetails)
    ? product.fabricDetails.filter((r) => r?.label && r?.value)
    : []
  const generalDetails = Array.isArray(product.generalDetails)
    ? product.generalDetails.filter((r) => r?.label && r?.value)
    : []
  const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : []
  const badges = Array.isArray(product.badges) ? product.badges.filter(Boolean) : []

  useEffect(() => {
    setEnquiryMessage(
      `Hello, I'm interested in ${product.name}${selectedSize ? ` · Size ${selectedSize}` : ''}${selectedColor ? ` · ${selectedColor}` : ''}.\nPlease share availability and delivery details.`
    )
  }, [product._id, product.name, selectedSize, selectedColor])

  useEffect(() => {
    ;(async () => {
      try {
        if (isSignedIn) {
          const { data } = await axios.get('/api/wishlist')
          setIsInWishlist(data.wishlist?.some((item) => item.productId === product._id))
        } else {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]')
          setIsInWishlist(guestWishlist.some((item) => item && item.productId === product._id))
        }
      } catch {}
    })()
  }, [isSignedIn, product._id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false)
      }
    }
    if (showShareMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showShareMenu])

  const selectImage = (idx) => {
    if (idx === activeImageIndex) return
    setActiveImageIndex(idx)
  }

  const handleMainImageLoad = () => {
    setDisplayImage(mainImage)
    setImageLoading(false)
    setIsFading(false)
  }

  const handleWishlist = async () => {
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      if (isSignedIn) {
        const action = isInWishlist ? 'remove' : 'add'
        await axios.post('/api/wishlist', { productId: product._id, action })
        setIsInWishlist(!isInWishlist)
        setWishlistMessage(isInWishlist ? 'Removed from wishlist' : 'Saved to wishlist')
      } else {
        const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]')
        if (isInWishlist) {
          localStorage.setItem(
            'guestWishlist',
            JSON.stringify(guestWishlist.filter((item) => item && item.productId !== product._id))
          )
          setIsInWishlist(false)
          setWishlistMessage('Removed from wishlist')
        } else {
          guestWishlist.push({
            productId: product._id,
            name: product.name,
            price: effPrice,
            AED: effAED,
            images: product.images,
            discount: discountPercent,
            inStock: product.inStock,
            addedAt: new Date().toISOString(),
          })
          localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist))
          setIsInWishlist(true)
          setWishlistMessage('Saved to wishlist')
        }
      }
      setShowWishlistToast(true)
      window.dispatchEvent(new Event('wishlistUpdated'))
      setTimeout(() => setShowWishlistToast(false), 3000)
    } catch {
      setWishlistMessage('Failed to update wishlist')
      setShowWishlistToast(true)
      setTimeout(() => setShowWishlistToast(false), 3000)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleShare = (platform) => {
    const url = window.location.href
    const text = `Check out ${product.name} on Nilaas`
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    }
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=700')
      setShowShareMenu(false)
    }
  }

  const toggleShareMenu = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && window.innerWidth < 768) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Nilaas`,
          url: window.location.href,
        })
        return
      } catch {}
    }
    setShowShareMenu((prev) => !prev)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowShareMenu(false)
      }, 1600)
    } catch {}
  }

  const handleEnquirySubmit = async (e) => {
    e.preventDefault()
    if (enquirySubmitting) return
    setEnquirySubmitting(true)
    try {
      const normalizedPhone = enquiryPhone.trim().startsWith('+')
        ? enquiryPhone.trim()
        : `${enquiryCountryCode} ${enquiryPhone.trim()}`
      await axios.post('/api/appointment', {
        name: enquiryName,
        email: enquiryEmail,
        phone: normalizedPhone,
        message: enquiryMessage,
        productId: product._id,
        image: product.images?.[0] || null,
      })
      setShowEnquiryModal(false)
      setEnquiryName('')
      setEnquiryEmail('')
      setEnquiryPhone('')
      toast.success('Enquiry sent — we will get back to you soon.')
    } catch {
      toast.error('Failed to send enquiry. Please try again.')
    } finally {
      setEnquirySubmitting(false)
    }
  }

  const requireSize = sizes.length > 0 && !selectedSize
  const handleOrderNow = () => {
    if (requireSize) {
      toast.error('Please select a size')
      return
    }
    for (let i = 0; i < quantity; i++) dispatch(addToCart({ productId: product._id }))
    router.push('/cart')
  }

  const handleAddToCart = async () => {
    if (requireSize) {
      toast.error('Please select a size')
      return
    }
    for (let i = 0; i < quantity; i++) dispatch(addToCart({ productId: product._id }))
    trackMeta('AddToCart', {
      content_ids: [String(product._id)],
      content_name: product.name || product.title || '',
      content_type: 'product',
      value: (Number(product.price) || 0) * quantity,
      currency: 'INR',
      contents: [{ id: String(product._id), quantity }],
    })
    if (isSignedIn) {
      try {
        await dispatch(uploadCart()).unwrap()
      } catch {}
    }
    setShowCartToast(true)
    setTimeout(() => setShowCartToast(false), 3000)
  }

  const togglePanel = (key) => setOpenPanel((prev) => (prev === key ? '' : key))

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#8a6f64]">Loading…</div>
    )
  }
  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#8a6f64]">
        Product not found.
      </div>
    )
  }

  const descriptionHtml =
    product.attributes?.description || product.description || product.shortDescription || ''

  return (
    <div className="relative bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-[#2a1210]/08">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px] tracking-wide text-[#8a6f64]">
            <Link href="/" className="hover:text-[#2a1210] transition">
              Home
            </Link>
            <span aria-hidden>/</span>
            {product.category && (
              <>
                <Link
                  href={`/category/${String(product.category)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')}`}
                  className="hover:text-[#2a1210] transition"
                >
                  {product.category}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span className="text-[#2a1210] truncate max-w-[220px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
          {/* Gallery — fills left column at true 4:5 (taller), tight gap to details */}
          <div className="order-1 lg:sticky lg:top-16 lg:self-start w-full space-y-3">
            <div
              className="relative w-full overflow-hidden bg-slate-50 border border-slate-100"
              style={{ aspectRatio: '4 / 5' }}
            >
              {(badges[0] || discountPercent > 0) && (
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                  {badges[0] && (
                    <span className="bg-[#2a1210] text-white text-[11px] tracking-[0.14em] uppercase px-3 py-1.5">
                      {badges[0]}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-[#6b2f28] text-white text-[11px] tracking-wide px-3 py-1.5">
                      {discountPercent}% off
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className="absolute top-3 right-3 z-10 h-10 w-10 flex items-center justify-center bg-white/95 shadow-sm text-[#2a1210] transition hover:bg-white"
                aria-label="Wishlist"
              >
                <HeartIcon
                  size={20}
                  fill={isInWishlist ? '#b91c1c' : 'none'}
                  className={isInWishlist ? 'text-red-600' : ''}
                  strokeWidth={1.75}
                />
              </button>

              {/* Keep previous image visible so the frame never goes blank */}
              {displayImage && displayImage !== mainImage && (
                <Image
                  src={displayImage}
                  alt=""
                  fill
                  className="object-cover object-center opacity-40"
                  sizes="(min-width:1024px) 620px, 100vw"
                />
              )}

              <Image
                key={mainImage || 'placeholder'}
                src={mainImage || 'https://placehold.co/800x1000?text=Nilaas'}
                alt={product.name}
                fill
                priority
                onLoad={handleMainImageLoad}
                onLoadingComplete={handleMainImageLoad}
                className={`object-cover object-center transition-opacity duration-300 ${
                  imageLoading || isFading ? 'opacity-0' : 'opacity-100'
                }`}
                sizes="(min-width:1024px) 620px, 100vw"
              />

              {imageLoading && (
                <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none bg-slate-50/40">
                  <div className="h-9 w-9 rounded-full border-2 border-[#2a1210]/15 border-t-[#2a1210] animate-spin" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => selectImage(idx)}
                    className={`relative shrink-0 w-14 sm:w-16 overflow-hidden bg-slate-50 border transition ${
                      activeImageIndex === idx
                        ? 'border-[#2a1210] ring-1 ring-[#2a1210]'
                        : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <Image src={img} alt="" fill className="object-cover object-top" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product details — right column */}
          <div className="order-2 lg:order-2 space-y-6 min-w-0">
            <div className="space-y-3 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a]">
                  {product.brand || 'Nilaas'}
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleShareMenu}
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#6e5048] hover:text-[#2a1210] transition"
                  >
                    <Share2Icon size={15} strokeWidth={1.75} />
                    Share
                  </button>
                  {showShareMenu && (
                    <div
                      ref={shareMenuRef}
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#2a1210]/10 shadow-xl z-50 p-2"
                    >
                      {['whatsapp', 'facebook', 'twitter'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleShare(p)}
                          className="w-full text-left px-3 py-2.5 text-sm text-[#2a1210] hover:bg-[#faf7f4] capitalize"
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="w-full text-left px-3 py-2.5 text-sm text-[#2a1210] hover:bg-[#faf7f4] border-t border-[#2a1210]/08"
                      >
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h1 className="font-serif text-[1.85rem] sm:text-[2.35rem] leading-[1.15] text-[#2a1210] tracking-tight">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-[15px] leading-relaxed text-[#6e5048] max-w-[42ch]">
                  {product.shortDescription}
                </p>
              )}

              {(reviewCount > 0 || averageRating > 0) && (
                <div className="flex items-center gap-2 text-sm text-[#6e5048]">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        size={14}
                        className={i < Math.round(averageRating) ? 'text-[#c4a035]' : 'text-[#d4c4b8]'}
                        fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span>
                    {averageRating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </span>
                </div>
              )}

              {showPrice && (
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-[1.75rem] font-medium text-[#2a1210] tabular-nums">
                    {currency}
                    {formatMoney(numericEffPrice)}
                  </span>
                  {showStrike && (
                    <span className="text-base text-[#9a7d72] line-through tabular-nums">
                      {currency}
                      {formatMoney(numericEffAED)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-sm font-medium text-[#6b2f28]">{discountPercent}% off</span>
                  )}
                </div>
              )}
              <p className="text-xs text-[#9a7d72]">Inclusive of taxes · Easy returns</p>
            </div>

            {colors.length > 0 && (
              <div className="space-y-2.5 animate-[fadeIn_0.65s_ease-out]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#2a1210] font-medium">Color</span>
                  <span className="text-[#6e5048]">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    const swatch = colorToSwatch(color)
                    const active = selectedColor === color
                    const light = isLightSwatch(color)
                    return (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => setSelectedColor(color)}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          active
                            ? 'border-[#2a1210] scale-110'
                            : light
                              ? 'border-slate-300 hover:border-slate-400'
                              : 'border-transparent ring-1 ring-[#2a1210]/15 hover:ring-[#2a1210]/35'
                        }`}
                        style={{ background: swatch }}
                        aria-label={color}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="space-y-2.5 animate-[fadeIn_0.75s_ease-out]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#2a1210] font-medium">Size</span>
                  <button
                    type="button"
                    onClick={() => togglePanel('size')}
                    className="inline-flex items-center gap-1 text-[#8a5a4a] hover:text-[#2a1210] transition"
                  >
                    <RulerIcon size={14} />
                    Size guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const active = selectedSize === size
                    const sizeStock =
                      variants.length > 0
                        ? variants.some((v) => {
                            const sOk = v.options?.size === size
                            const cOk = selectedColor
                              ? !v.options?.color || v.options.color === selectedColor
                              : true
                            return sOk && cOk && (v.stock == null || Number(v.stock) > 0)
                          })
                        : true
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!sizeStock}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-11 px-3.5 text-sm border transition ${
                          active
                            ? 'bg-[#2a1210] text-[#faf7f4] border-[#2a1210]'
                            : sizeStock
                              ? 'border-[#2a1210]/20 text-[#2a1210] hover:border-[#2a1210]'
                              : 'border-[#2a1210]/10 text-[#c4b5a8] line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#2a1210]">Qty</span>
              <div className="inline-flex items-center border border-[#2a1210]/20">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-11 w-11 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon size={16} />
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-11 w-11 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5"
                  aria-label="Increase quantity"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
              <span
                className={`text-xs font-medium ${inStock ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}
              >
                {inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {product.showBuyButton !== false && (
                <button
                  type="button"
                  onClick={handleOrderNow}
                  disabled={!inStock}
                  className="flex-1 h-13 min-h-[52px] px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy now
                </button>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 h-13 min-h-[52px] px-6 border border-[#2a1210] text-[#2a1210] text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 hover:bg-[#2a1210] hover:text-[#faf7f4] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBagIcon size={17} strokeWidth={1.75} />
                Add to bag
              </button>
            </div>

            {product.enableEnquiry && product.showEnquiryButton !== false && (
              <button
                type="button"
                onClick={() => setShowEnquiryModal(true)}
                className="w-full text-sm text-[#8a5a4a] underline underline-offset-4 hover:text-[#2a1210] transition"
              >
                Ask about this piece
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#2a1210]/10">
              {[
                { icon: TruckIcon, label: 'Pan-India delivery' },
                { icon: RefreshCwIcon, label: 'Easy returns' },
                { icon: RulerIcon, label: 'True-to-size fit' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 text-[12px] text-[#6e5048] py-2"
                >
                  <Icon size={16} className="shrink-0 text-[#8a5a4a]" strokeWidth={1.6} />
                  {label}
                </div>
              ))}
            </div>

            {(product.sku || tags.length > 0) && (
              <div className="text-xs text-[#9a7d72] space-y-1.5">
                {product.sku && <p>SKU · {selectedVariant?.sku || product.sku}</p>}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 border border-[#2a1210]/10 text-[#6e5048]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Story / details stay in the right column so the image can remain sticky */}
            <div className="mt-4 space-y-0 border-t border-[#2a1210]/10">
              {[
                {
                  key: 'story',
                  title: 'The story',
                  body: descriptionHtml ? (
                    <div
                      className="text-[15px] text-[#4a3832] leading-relaxed prose prose-sm max-w-none overflow-x-auto
                        [&_p]:mb-3 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-[#2a1210] [&_h2]:mt-6 [&_h2]:mb-2
                        [&_h3]:font-semibold [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm
                        [&_th]:border [&_th]:border-[#2a1210]/15 [&_th]:bg-[#f3e8e2] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
                        [&_td]:border [&_td]:border-[#2a1210]/12 [&_td]:px-3 [&_td]:py-2"
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  ) : (
                    <p className="text-[#6e5048]">Details coming soon.</p>
                  ),
                },
                ...(fabricDetails.length || generalDetails.length
                  ? [
                      {
                        key: 'fabric',
                        title: 'Fabric & details',
                        body: (
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            {[...fabricDetails, ...generalDetails].map((row, i) => (
                              <div
                                key={`${row.label}-${i}`}
                                className="flex justify-between gap-4 border-b border-[#2a1210]/08 pb-2"
                              >
                                <dt className="text-[#8a6f64]">{row.label}</dt>
                                <dd className="text-[#2a1210] font-medium text-right">{row.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'size',
                  title: 'Size & fit',
                  body: (
                    <div className="text-[15px] text-[#4a3832] space-y-3 leading-relaxed">
                      <p>
                        Models typically wear sizes that match standard Indian ethnic / western charts.
                        If you are between sizes, we recommend sizing up for a relaxed drape.
                      </p>
                      {sizes.length > 0 && (
                        <p className="text-sm text-[#6e5048]">
                          Available: {sizes.join(' · ')}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'care',
                  title: 'Care',
                  body: (
                    <ul className="text-[15px] text-[#4a3832] space-y-2 list-disc ml-5 leading-relaxed">
                      <li>Gentle machine wash or dry clean as per fabric care label</li>
                      <li>Wash dark colours separately for the first few washes</li>
                      <li>Do not bleach · Iron on medium heat</li>
                      <li>Dry in shade to preserve print & colour</li>
                    </ul>
                  ),
                },
              ].map((panel) => {
                const open = openPanel === panel.key
                return (
                  <div key={panel.key} className="border-b border-[#2a1210]/10">
                    <button
                      type="button"
                      onClick={() => togglePanel(panel.key)}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="font-serif text-xl text-[#2a1210]">{panel.title}</span>
                      <ChevronDownIcon
                        size={20}
                        className={`text-[#8a6f64] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-400 ${
                        open ? 'max-h-[2000px] pb-6 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {panel.body}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry modal */}
      {showEnquiryModal && (
        <div
          className="fixed inset-0 z-[10000] bg-[#2a1210]/45 flex items-center justify-center p-4"
          onClick={() => setShowEnquiryModal(false)}
        >
          <div
            className="bg-white w-full max-w-xl border border-[#2a1210]/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form className="p-6 sm:p-8 space-y-4" onSubmit={handleEnquirySubmit}>
              <h3 className="font-serif text-2xl text-[#2a1210]">Ask about this piece</h3>
              <p className="text-sm text-[#6e5048]">We usually reply within a few hours.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full border border-[#2a1210]/20 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={enquiryEmail}
                  onChange={(e) => setEnquiryEmail(e.target.value)}
                  className="w-full border border-[#2a1210]/20 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
                />
                <div className="sm:col-span-2 flex border border-[#2a1210]/20 bg-white overflow-hidden">
                  <select
                    value={enquiryCountryCode}
                    onChange={(e) => setEnquiryCountryCode(e.target.value)}
                    className="w-28 shrink-0 border-r border-[#2a1210]/15 px-2 py-2.5 text-sm bg-white focus:outline-none"
                  >
                    <option value="+91">IN +91</option>
                    <option value="+971">UAE +971</option>
                    <option value="+1">US +1</option>
                    <option value="+44">UK +44</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="Phone"
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <textarea
                rows={4}
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                className="w-full border border-[#2a1210]/20 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#2a1210]"
              />
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEnquiryModal(false)}
                  className="px-4 py-2.5 text-sm text-[#6e5048]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="px-5 py-2.5 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold disabled:opacity-60"
                >
                  {enquirySubmitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWishlistToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 bg-white border border-[#2a1210]/15 shadow-xl px-5 py-3.5 flex items-center gap-3 z-[9999] max-w-[90vw]">
          <HeartIcon
            size={18}
            className={wishlistMessage.includes('Saved') ? 'text-red-600' : 'text-[#6e5048]'}
            fill={wishlistMessage.includes('Saved') ? 'currentColor' : 'none'}
          />
          <div>
            <p className="text-sm font-medium text-[#2a1210]">{wishlistMessage}</p>
            {wishlistMessage.includes('Saved') && (
              <a href="/wishlist" className="text-xs text-[#8a5a4a] underline">
                View wishlist
              </a>
            )}
          </div>
        </div>
      )}

      {showCartToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 bg-white border border-[#2a1210]/15 shadow-xl px-5 py-3.5 flex items-center gap-3 z-[9999] max-w-[90vw]">
          <ShoppingBagIcon size={18} className="text-[#2a1210]" />
          <div>
            <p className="text-sm font-medium text-[#2a1210]">Added to bag</p>
            <a href="/cart" className="text-xs text-[#8a5a4a] underline">
              View bag
            </a>
          </div>
        </div>
      )}

      <MobileProductActions
        onOrderNow={handleOrderNow}
        onAddToCart={handleAddToCart}
        effPrice={effPrice}
        currency={currency}
        cartCount={cartCount}
        disabled={!inStock}
      />
    </div>
  )
}

export default ProductDetails
