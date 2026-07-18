"use client";

import { Search, ShoppingCart, Menu, X, HeartIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { auth } from '../lib/firebase';
import Image from 'next/image';
import axios from "axios";
import toast from "react-hot-toast";
import Logo from "../assets/logo/Asset 7.png";
import SignInModal from './SignInModal';

// ── MegaDropdown panel ────────────────────────────────────────────────────────
function MegaDropdown({ item, featuredImages, dropdownLinks, onClose, timerRef }) {
  const cols = item.megaMenu?.linkColumns || 1;
  const hasLinks = dropdownLinks.length > 0;
  const hasImages = featuredImages.length > 0;
  const colClass = cols === 3 ? 'grid-cols-3' : cols === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div
      className="absolute top-full left-0 right-0 mt-0 z-[200] overflow-hidden bg-white"
      style={{
        boxShadow: '0 16px 48px -8px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)',
        borderTop: '1px solid #2a1210',
      }}
      onMouseEnter={() => { if (timerRef?.current) clearTimeout(timerRef.current); }}
      onMouseLeave={() => { if (timerRef?.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(onClose, 180); }}
    >
      <div className="flex">
        {/* Links section */}
        {hasLinks && (
          <div className="flex-1 p-6">
            {item.name && (
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a5a4a] mb-4">{item.name}</p>
            )}
            <div className={`grid ${colClass} gap-3`}>
              {dropdownLinks.map((lnk, li) => (
                <Link
                  key={li}
                  href={lnk.link || '#'}
                  className="group relative flex items-center gap-3 p-3 border border-transparent transition-all duration-200 hover:border-[#2a1210]/15 hover:bg-[#faf7f4]"
                  onClick={onClose}
                >
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover:h-[60%] transition-all duration-250 ease-out bg-[#2a1210]" />
                  <span className="text-sm font-medium text-[#4a3832] transition-colors duration-200 pl-1 group-hover:text-[#2a1210]">
                    {lnk.name}
                  </span>
                </Link>
              ))}
            </div>
            {item.link && item.link !== '#' && (
              <div className="mt-5 pt-4 border-t border-[#2a1210]/10">
                <Link
                  href={item.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2a1210] hover:text-[#6b2f28] transition-colors"
                  onClick={onClose}
                >
                  View all {item.name}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Featured images section */}
        {hasImages && (
          <div className={`flex gap-4 p-5 shrink-0 ${hasLinks ? 'border-l border-gray-100 bg-gray-50/60' : 'flex-1 justify-center'}`}>
            {featuredImages.map((img, ii) => (
              <Link
                key={ii}
                href={img.link || '#'}
                className="group relative rounded-xl overflow-hidden shrink-0 block"
                style={{
                  width: featuredImages.length === 1 ? 260 : featuredImages.length === 2 ? 200 : 160,
                  height: 190,
                }}
                onClick={onClose}
              >
                <img
                  src={img.url}
                  alt={img.label || ''}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {img.label && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
                    <p className="text-white text-xs font-semibold leading-tight">{img.label}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 group-hover:text-white transition-colors">Shop now →</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Navbar = () => {
  // State for image search modal
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Helper function for image search
  const handleImageSearch = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/search-by-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      let keyword = data.keyword || (Array.isArray(data.keywords) ? data.keywords[0] : '');
      if (keyword) {
        window.location.href = `/shop?search=${encodeURIComponent(keyword)}`;
      } else {
        alert('No matching product found.');
      }
    } catch (err) {
      alert('Image search failed.');
    }
  };

  // State for categories
  const [categories, setCategories] = useState([]);
  // State for navigation menu items
  const [navMenuItems, setNavMenuItems] = useState([]);
  const [navMenuEnabled, setNavMenuEnabled] = useState(true);
  const [navActionsVisibility, setNavActionsVisibility] = useState({
    store: true,
    wishlist: true,
    cart: true
  });
  // State for animated search placeholder
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [productIndex, setProductIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [openMegaIndex, setOpenMegaIndex] = useState(null);
  const megaTimer = useRef(null);
  const hoverTimer = useRef(null);
  const categoryTimer = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Lock page scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen]);
  const cartCount = useSelector((state) => state.cart.total);
  const [signInOpen, setSignInOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const userDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // (already declared above)

  // Perf: cache categories + menu in sessionStorage and revalidate in background
  useEffect(() => {
    const CAT_KEY = 'nav:categories:v1'
    const MENU_KEY = 'nav:menu:v3'
    const MENU_ENABLED_KEY = 'nav:menu:enabled:v3'
    const ACTIONS_VISIBILITY_KEY = 'nav:actions:visibility:v1'
    const TTL = 10 * 60 * 1000 // 10 minutes

    // 1) Seed from cache immediately
    try {
      const rawCats = sessionStorage.getItem(CAT_KEY)
      if (rawCats) {
        const cached = JSON.parse(rawCats)
        if (cached && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL)) {
          setCategories(cached.data)
        }
      }
      const rawMenu = sessionStorage.getItem(MENU_KEY)
      if (rawMenu) {
        const cached = JSON.parse(rawMenu)
        if (cached && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL)) {
          setNavMenuItems(cached.data)
        }
      }

      const rawMenuEnabled = sessionStorage.getItem(MENU_ENABLED_KEY)
      if (rawMenuEnabled) {
        const cached = JSON.parse(rawMenuEnabled)
        if (typeof cached?.data === 'boolean' && (Date.now() - cached.ts < TTL)) {
          setNavMenuEnabled(cached.data)
        }
      }

      const rawActionsVisibility = sessionStorage.getItem(ACTIONS_VISIBILITY_KEY)
      if (rawActionsVisibility) {
        const cached = JSON.parse(rawActionsVisibility)
        const data = cached?.data
        if (data && typeof data === 'object' && (Date.now() - cached.ts < TTL)) {
          setNavActionsVisibility({
            store: data.store !== false,
            wishlist: data.wishlist !== false,
            cart: data.cart !== false
          })
        }
      }
    } catch {}

    // 2) Revalidate endpoints independently so a slow categories call
    // cannot abort / wipe the nav menu settings fetch.
    const controllers = []

    const fetchWithTimeout = (url, ms = 10000) => {
      const controller = new AbortController()
      controllers.push(controller)
      const timer = setTimeout(() => controller.abort(), ms)
      return fetch(url, { cache: 'no-store', signal: controller.signal }).finally(() => {
        clearTimeout(timer)
      })
    }

    const applySettings = (settingsData) => {
      const items = settingsData?.settings?.navMenuItems
      const enabled = settingsData?.settings?.navMenuEnabled
      const actionsVisibility = settingsData?.settings?.navActionsVisibility
      if (Array.isArray(items)) {
        setNavMenuItems(items)
        try { sessionStorage.setItem(MENU_KEY, JSON.stringify({ ts: Date.now(), data: items })) } catch {}
      }
      if (typeof enabled === 'boolean') {
        setNavMenuEnabled(enabled)
        try { sessionStorage.setItem(MENU_ENABLED_KEY, JSON.stringify({ ts: Date.now(), data: enabled })) } catch {}
      }
      if (actionsVisibility && typeof actionsVisibility === 'object') {
        const normalized = {
          store: actionsVisibility.store !== false,
          wishlist: actionsVisibility.wishlist !== false,
          cart: actionsVisibility.cart !== false
        }
        setNavActionsVisibility(normalized)
        try { sessionStorage.setItem(ACTIONS_VISIBILITY_KEY, JSON.stringify({ ts: Date.now(), data: normalized })) } catch {}
      }
    }

    const revalidate = async () => {
      const settingsPromise = fetchWithTimeout('/api/store/settings', 10000)
        .then(async (settingsRes) => {
          if (!settingsRes.ok) return
          applySettings(await settingsRes.json())
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error('Navbar settings fetch error:', err)
        })

      const categoriesPromise = fetchWithTimeout('/api/store/categories?lite=true', 10000)
        .then(async (catRes) => {
          if (!catRes.ok) return
          const catData = await catRes.json()
          if (Array.isArray(catData?.categories)) {
            setCategories(catData.categories)
            try { sessionStorage.setItem(CAT_KEY, JSON.stringify({ ts: Date.now(), data: catData.categories })) } catch {}
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error('Navbar categories fetch error:', err)
        })

      await Promise.all([settingsPromise, categoriesPromise])
    }

    revalidate()

    // Optional gentle refresh every 10 minutes
    const interval = setInterval(revalidate, TTL)
    return () => {
      clearInterval(interval)
      controllers.forEach((c) => c.abort())
    }
  }, [])

  // Instant menu refresh after dashboard updates nav items/icons.
  useEffect(() => {
    const MENU_KEY = 'nav:menu:v3'
    const MENU_ENABLED_KEY = 'nav:menu:enabled:v3'
    const ACTIONS_VISIBILITY_KEY = 'nav:actions:visibility:v1'

    const syncNavMenu = async () => {
      try {
        const settingsRes = await fetch('/api/store/settings', { cache: 'no-store' })
        if (!settingsRes.ok) return

        const settingsData = await settingsRes.json()
        const items = settingsData?.settings?.navMenuItems
        const enabled = settingsData?.settings?.navMenuEnabled
        const actionsVisibility = settingsData?.settings?.navActionsVisibility
        if (Array.isArray(items)) {
          setNavMenuItems(items)
          try { sessionStorage.setItem(MENU_KEY, JSON.stringify({ ts: Date.now(), data: items })) } catch {}
        }
        if (typeof enabled === 'boolean') {
          setNavMenuEnabled(enabled)
          try { sessionStorage.setItem(MENU_ENABLED_KEY, JSON.stringify({ ts: Date.now(), data: enabled })) } catch {}
        }
        if (actionsVisibility && typeof actionsVisibility === 'object') {
          const normalized = {
            store: actionsVisibility.store !== false,
            wishlist: actionsVisibility.wishlist !== false,
            cart: actionsVisibility.cart !== false
          }
          setNavActionsVisibility(normalized)
          try { sessionStorage.setItem(ACTIONS_VISIBILITY_KEY, JSON.stringify({ ts: Date.now(), data: normalized })) } catch {}
        }
      } catch (err) {
        console.error('Navbar instant sync error:', err)
      }
    }

    window.addEventListener('navMenuUpdated', syncNavMenu)
    window.addEventListener('focus', syncNavMenu)
    const onStorage = (e) => {
      if (e.key === 'nav:menu:broadcast') syncNavMenu()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('navMenuUpdated', syncNavMenu)
      window.removeEventListener('focus', syncNavMenu)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Product names for animated placeholder
  const productNames = [
    "Cotton Kurti",
    "Co-ord Set",
    "Festive Wear",
    "Everyday Tops",
    "Printed Dress",
    "Workwear",
    "Embroidered Suit",
    "Summer Linen",
    "Anarkali",
    "Casual Sets"
  ];

  // Typewriter effect for search placeholder
  useEffect(() => {
    const currentProduct = productNames[productIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (searchPlaceholder.length < currentProduct.length) {
          setSearchPlaceholder(currentProduct.substring(0, searchPlaceholder.length + 1));
        } else {
          // Wait before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (searchPlaceholder.length > 0) {
          setSearchPlaceholder(searchPlaceholder.substring(0, searchPlaceholder.length - 1));
        } else {
          // Move to next product
          setIsDeleting(false);
          setProductIndex((prev) => (prev + 1) % productNames.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [searchPlaceholder, isDeleting, productIndex, productNames]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      console.log("Navbar user:", user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom event to open sign in modal
  useEffect(() => {
    const handleOpenSignInModal = () => {
      setSignInOpen(true);
    };
    window.addEventListener('openSignInModal', handleOpenSignInModal);
    return () => window.removeEventListener('openSignInModal', handleOpenSignInModal);
  }, []);

  useEffect(() => {
    const fetchIfLoggedIn = () => {
      if (auth.currentUser) {
        fetchWishlistCount();
      } else {
        // Get guest wishlist count from localStorage
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
      }
    };
    fetchIfLoggedIn();
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      fetchIfLoggedIn();
    };
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  const fetchWishlistCount = async () => {
    try {
      if (!auth.currentUser) {
        // Get guest wishlist count from localStorage
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
        return;
      }
      const token = await auth.currentUser.getIdToken();
      const { data } = await axios.get('/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWishlistCount(data.wishlist?.length || 0);
    } catch (error) {
      // Silently handle auth errors (expected when not logged in)
      if (error.response?.status === 401) {
        // Try to get guest wishlist as fallback
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
      } else {
        console.error('Error fetching wishlist count:', error);
        setWishlistCount(0);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!cartCount || cartCount === 0) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Your cart is empty!</p>
            <p className="text-sm text-gray-600 mt-0.5">Start shopping to add items to your cart</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              router.push('/shop');
            }}
            className="px-3 py-1.5 bg-[#2a1210] text-white text-sm hover:bg-[#4a221c] transition font-medium"
          >
            Shop Now
          </button>
        </div>
      ), {
        duration: 4000,
        style: {
          padding: '16px',
          maxWidth: '500px',
        },
      });
      return;
    }
    router.push("/cart");
  };
  

  // Seller / store-admin check — DB badge links to /store
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerLoading, setIsSellerLoading] = useState(false);
  const lastCheckedUidRef = useRef(null);
  useEffect(() => {
    const uid = firebaseUser?.uid || null;
    if (!uid) {
      setIsSeller(false);
      setIsSellerLoading(false);
      lastCheckedUidRef.current = null;
      return;
    }

    // Client-side admin email → show DB immediately (same rule as /store layout)
    const allowedEmail = (
      process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      ''
    ).toLowerCase();
    const email = (firebaseUser.email || '').toLowerCase();
    if (allowedEmail && email === allowedEmail) {
      setIsSeller(true);
      setIsSellerLoading(false);
      lastCheckedUidRef.current = uid;
      return;
    }

    if (lastCheckedUidRef.current === uid) {
      return;
    }
    lastCheckedUidRef.current = uid;
    const checkSeller = async () => {
      setIsSellerLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const { data } = await axios.get('/api/store/is-seller', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsSeller(!!data.isSeller);
      } catch {
        setIsSeller(false);
        lastCheckedUidRef.current = null; // allow retry
      } finally {
        setIsSellerLoading(false);
      }
    };
    checkSeller();
  }, [firebaseUser?.uid, firebaseUser?.email]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#2a1210]/10">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8">
          {/* Main bar — same layout all pages */}
          <div className="relative flex items-center h-14 sm:h-16 lg:h-[4.5rem]">
            {/* Left — menu only (back cluttered the mobile bar) */}
            <div className="flex items-center shrink-0 z-10">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-1 text-[#2a1210] hover:bg-[#faf7f4] transition"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              {!isHomePage && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="hidden sm:inline-flex md:hidden p-2 text-[#2a1210] hover:bg-[#faf7f4] transition"
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
            </div>

            {/* Logo — centered on mobile, left-aligned from tablet */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:ml-1 shrink-0 flex items-center z-10"
            >
              <Image
                src={Logo}
                alt="Nilaas"
                width={72}
                height={72}
                className="object-contain h-11 w-auto sm:h-12 lg:h-14"
                priority
              />
            </Link>

            {/* Desktop / tablet search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 mx-3 lg:mx-8 min-w-0"
            >
              <div className="flex items-center w-full gap-2.5 border border-[#2a1210]/12 bg-white px-3.5 lg:px-4 h-10 lg:h-11 transition focus-within:border-[#2a1210]">
                <Search size={17} className="text-[#9a7d72] shrink-0" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Search kurtis, co-ords, dresses...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-[#9a7d72] text-[#2a1210] text-sm"
                />
              </div>
            </form>

            {/* Actions — keep mobile lean: wishlist + cart (+ account from sm) */}
            <div className="ml-auto flex items-center gap-0.5 sm:gap-1 shrink-0 z-10">
              {navActionsVisibility.store && (
                <Link
                  href="/find-store"
                  className="hidden xl:flex flex-col items-center justify-center w-14 py-1 text-[#6e5048] hover:text-[#2a1210] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-[10px] mt-0.5 font-medium tracking-wide">Store</span>
                </Link>
              )}

              {navActionsVisibility.wishlist && (
                <Link
                  href={firebaseUser ? '/dashboard/wishlist' : '/wishlist'}
                  className="relative flex flex-col items-center justify-center w-10 sm:w-11 lg:w-14 h-10 sm:h-11 lg:h-auto lg:py-1 text-[#6e5048] hover:text-[#2a1210] hover:bg-[#faf7f4] lg:hover:bg-transparent transition"
                  aria-label="Wishlist"
                >
                  <HeartIcon size={20} />
                  <span className="hidden lg:block text-[10px] mt-0.5 font-medium tracking-wide">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 lg:top-0 lg:right-2 text-[9px] font-bold text-white bg-[#2a1210] min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {navActionsVisibility.cart && (
                <button
                  type="button"
                  onClick={handleCartClick}
                  className="relative flex flex-col items-center justify-center w-10 sm:w-11 lg:w-14 h-10 sm:h-11 lg:h-auto lg:py-1 text-[#6e5048] hover:text-[#2a1210] hover:bg-[#faf7f4] lg:hover:bg-transparent transition"
                  aria-label="Cart"
                >
                  <ShoppingCart size={20} />
                  <span className="hidden lg:block text-[10px] mt-0.5 font-medium tracking-wide">Cart</span>
                  {isClient && cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 lg:top-0 lg:right-2 text-[9px] font-bold text-white bg-[#2a1210] min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              )}

              {isSeller && (
                <Link
                  href="/store"
                  className="hidden sm:flex flex-col items-center justify-center w-10 lg:w-14 h-10 lg:h-auto lg:py-1 text-[#6e5048] hover:text-[#2a1210] transition"
                  aria-label="Dashboard"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-[#2a1210] text-white font-bold text-[9px]">
                    DB
                  </span>
                  <span className="hidden lg:block text-[10px] mt-0.5 font-medium tracking-wide">Store</span>
                </Link>
              )}

              {firebaseUser ? (
                <div className="relative hidden sm:block" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex flex-col items-center justify-center w-10 sm:w-11 lg:w-14 h-10 sm:h-11 lg:h-auto lg:py-1 text-[#6e5048] hover:text-[#2a1210] transition"
                    aria-label="Account"
                  >
                    {firebaseUser.photoURL ? (
                      <Image
                        src={firebaseUser.photoURL}
                        alt="User"
                        width={24}
                        height={24}
                        className="rounded-full object-cover w-6 h-6"
                      />
                    ) : (
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#2a1210] text-white font-bold text-[10px]">
                        {firebaseUser.displayName?.[0]?.toUpperCase() ||
                          firebaseUser.email?.[0]?.toUpperCase() ||
                          'U'}
                      </span>
                    )}
                    <span className="hidden lg:block text-[10px] mt-0.5 font-medium tracking-wide">Account</span>
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-white border border-[#2a1210]/10 shadow-lg z-50 py-2">
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2.5 text-[#2a1210] hover:bg-[#faf7f4] text-sm"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/orders"
                        className="block px-4 py-2.5 text-[#2a1210] hover:bg-[#faf7f4] text-sm"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/browse-history"
                        className="block px-4 py-2.5 text-[#2a1210] hover:bg-[#faf7f4] text-sm"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Browse History
                      </Link>
                      {isSeller && (
                        <Link
                          href="/store"
                          className="block px-4 py-2.5 text-[#2a1210] hover:bg-[#faf7f4] text-sm"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <div className="my-1 border-t border-[#2a1210]/10" />
                      <button
                        type="button"
                        className="block w-full text-left px-4 py-2.5 text-[#2a1210] hover:bg-[#faf7f4] text-sm"
                        onClick={async () => {
                          await auth.signOut()
                          setUserDropdownOpen(false)
                          router.push('/')
                          toast.success('Signed out successfully')
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className="hidden sm:flex flex-col items-center justify-center w-10 sm:w-11 lg:w-14 h-10 sm:h-11 lg:h-auto lg:py-1 text-[#6e5048] hover:text-[#2a1210] hover:bg-[#faf7f4] lg:hover:bg-transparent transition"
                  aria-label="Account"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="hidden lg:block text-[10px] mt-0.5 font-medium tracking-wide">Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile search — full width under bar */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2.5 border border-[#2a1210]/12 bg-white px-3.5 h-10 focus-within:border-[#2a1210] transition">
                <Search size={16} className="text-[#9a7d72] shrink-0" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Search kurtis, co-ords...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-[#9a7d72] text-[#2a1210] text-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Category nav — fashion strip */}
        {navMenuEnabled && navMenuItems.length > 0 && (
          <div className="hidden md:block border-t border-[#2a1210]/10 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
              <nav
                aria-label="Shop categories"
                className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 lg:gap-x-8 py-3.5"
              >
                {navMenuItems.map((item, index) => {
                  const linkClass =
                    'group relative shrink-0 text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4a3832] hover:text-[#2a1210] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap py-1'
                  const underline =
                    'pointer-events-none absolute left-0 right-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[#2a1210] transition-transform duration-300 group-hover:scale-x-100'

                  const isCollections =
                    item.hasDropdown && item.name.toLowerCase().includes('collection')

                  if (isCollections) {
                    return (
                      <div
                        key={index}
                        className="relative shrink-0"
                        onMouseEnter={() => {
                          if (categoryTimer.current) clearTimeout(categoryTimer.current)
                          setCategoriesDropdownOpen(true)
                        }}
                        onMouseLeave={() => {
                          if (categoryTimer.current) clearTimeout(categoryTimer.current)
                          categoryTimer.current = setTimeout(() => {
                            setCategoriesDropdownOpen(false)
                            setHoveredCategory(null)
                          }, 200)
                        }}
                      >
                        <button type="button" className={linkClass}>
                          {item.icon && (
                            <img src={item.icon} alt="" className="w-3.5 h-3.5 object-contain opacity-80" aria-hidden="true" />
                          )}
                          {item.name}
                          <svg
                            className={`w-3 h-3 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className={underline} />
                        </button>

                        {categoriesDropdownOpen && categories.length > 0 && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white shadow-2xl border border-[#2a1210]/10 z-50 overflow-hidden flex min-w-[280px]">
                            <div className="w-56 xl:w-64 bg-white border-r border-[#2a1210]/10">
                              {categories
                                .filter((cat) => !cat.parentId)
                                .map((category) => {
                                  const categorySlug =
                                    category.slug ||
                                    category.name
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]+/g, '-')
                                      .replace(/^-+|-+$/g, '')
                                  return (
                                    <div
                                      key={category._id}
                                      onMouseEnter={() => setHoveredCategory(category._id)}
                                    >
                                      <Link
                                        href={`/category/${categorySlug}`}
                                        className={`flex items-center justify-between px-4 py-3 hover:bg-[#faf7f4] transition ${
                                          hoveredCategory === category._id
                                            ? 'bg-[#faf7f4] text-[#2a1210]'
                                            : 'text-[#4a3832]'
                                        }`}
                                        onClick={() => {
                                          setCategoriesDropdownOpen(false)
                                          setHoveredCategory(null)
                                        }}
                                      >
                                        <span className="font-medium text-sm">{category.name}</span>
                                        {category.children?.length > 0 && (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        )}
                                      </Link>
                                    </div>
                                  )
                                })}
                            </div>
                            {hoveredCategory && (
                              <div className="w-56 xl:w-64 bg-white p-3">
                                {categories
                                  .find((cat) => cat._id === hoveredCategory)
                                  ?.children?.map((subcat) => {
                                    const subcatSlug =
                                      subcat.slug ||
                                      subcat.name
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, '-')
                                        .replace(/^-+|-+$/g, '')
                                    return (
                                      <Link
                                        key={subcat._id}
                                        href={`/category/${subcatSlug}`}
                                        className="block px-3 py-2 text-sm text-[#6e5048] hover:text-[#2a1210] hover:bg-[#faf7f4] transition"
                                        onClick={() => {
                                          setCategoriesDropdownOpen(false)
                                          setHoveredCategory(null)
                                        }}
                                      >
                                        {subcat.name}
                                      </Link>
                                    )
                                  })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (item.hasDropdown && item.megaMenu) {
                    const mm = item.megaMenu
                    const featuredImages = (mm.images || []).filter((img) => img?.url)
                    const dropdownLinks = mm.links || []
                    const hasContent = dropdownLinks.length > 0 || featuredImages.length > 0

                    if (!hasContent) {
                      return (
                        <Link key={index} href={item.link || '/shop'} className={linkClass}>
                          {item.icon && (
                            <img src={item.icon} alt="" className="w-3.5 h-3.5 object-contain opacity-80" aria-hidden="true" />
                          )}
                          {item.name}
                          <span className={underline} />
                        </Link>
                      )
                    }

                    return (
                      <div
                        key={index}
                        className="relative shrink-0"
                        onMouseEnter={() => {
                          if (megaTimer.current) clearTimeout(megaTimer.current)
                          setOpenMegaIndex(index)
                        }}
                        onMouseLeave={() => {
                          if (megaTimer.current) clearTimeout(megaTimer.current)
                          megaTimer.current = setTimeout(() => setOpenMegaIndex(null), 180)
                        }}
                      >
                        <button type="button" className={linkClass}>
                          {item.icon && (
                            <img src={item.icon} alt="" className="w-3.5 h-3.5 object-contain opacity-80" aria-hidden="true" />
                          )}
                          {item.name}
                          <svg
                            className={`w-3 h-3 transition-transform ${openMegaIndex === index ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className={underline} />
                        </button>
                      </div>
                    )
                  }

                  const isSale = item.name.toLowerCase().includes('sale')
                  return (
                    <Link
                      key={index}
                      href={item.link || '/shop'}
                      className={`${linkClass} ${isSale ? 'text-[#8b3a2f] hover:text-[#6b2f28]' : ''}`}
                    >
                      {item.icon && (
                        <img src={item.icon} alt="" className="w-3.5 h-3.5 object-contain opacity-80" aria-hidden="true" />
                      )}
                      {item.name}
                      <span className={underline} />
                    </Link>
                  )
                })}
              </nav>

              {(() => {
                const activeItem = openMegaIndex !== null ? navMenuItems[openMegaIndex] : null
                if (!activeItem?.megaMenu) return null
                const mm = activeItem.megaMenu
                const featuredImages = (mm.images || []).filter((img) => img?.url)
                const dropdownLinks = mm.links || []
                if (dropdownLinks.length === 0 && featuredImages.length === 0) return null
                return (
                  <MegaDropdown
                    item={activeItem}
                    featuredImages={featuredImages}
                    dropdownLinks={dropdownLinks}
                    onClose={() => setOpenMegaIndex(null)}
                    timerRef={megaTimer}
                  />
                )
              })()}
            </div>
          </div>
        )}

      </nav>

      {/* Mobile drawer — outside <nav> so fixed covers the full viewport
          (backdrop-blur / sticky on nav otherwise traps position:fixed) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9999]"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0 cursor-default"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="absolute top-0 left-0 h-[100dvh] w-[min(86vw,340px)] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[#2a1210]/10 px-4 py-4 shrink-0 bg-white">
              <Image src={Logo} alt="Nilaas" width={56} height={56} className="object-contain h-10 w-auto" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-[#faf7f4] transition"
                aria-label="Close menu"
              >
                <X size={22} className="text-[#2a1210]" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto overscroll-contain">
              {firebaseUser === undefined ? null : !firebaseUser ? (
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-[#2a1210] hover:bg-[#4a221c] text-white text-sm font-semibold transition mb-3"
                  onClick={() => {
                    setSignInOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  Login
                </button>
              ) : (
                <div className="w-full px-4 py-3 bg-white text-[#2a1210] text-sm font-semibold mb-3 flex items-center gap-2 border border-[#2a1210]/10">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#2a1210] text-white font-bold text-xs">
                    {firebaseUser.displayName?.[0]?.toUpperCase() ||
                      firebaseUser.email?.[0]?.toUpperCase() ||
                      'U'}
                  </span>
                  <span className="truncate">Hi, {firebaseUser.displayName || firebaseUser.email}</span>
                </div>
              )}

              {navMenuItems.map((item, index) => (
                <Link
                  key={`m-${index}`}
                  href={item.link || '/shop'}
                  className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4] transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="h-px bg-[#2a1210]/10 my-2" />

              <Link href="/shop" className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                Shop all
              </Link>
              <Link href="/new" className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                New Arrivals
              </Link>
              <Link
                href={firebaseUser ? '/dashboard/wishlist' : '/wishlist'}
                className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4] flex justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="bg-[#2a1210] text-white text-xs px-2 py-0.5">{wishlistCount}</span>
                )}
              </Link>
              <Link href="/dashboard/orders" className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                My Orders
              </Link>
              <Link href="/about-us" className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                About us
              </Link>
              {isSeller && (
                <Link href="/store" className="px-4 py-3 text-[#2a1210] font-medium hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                  Seller Dashboard
                </Link>
              )}

              <div className="mt-auto pt-4 border-t border-[#2a1210]/10">
                <p className="text-[11px] font-semibold text-[#8a5a4a] uppercase tracking-[0.18em] mb-1 px-4">
                  Support
                </p>
                <Link href="/faq" className="block px-4 py-2.5 text-sm text-[#4a3832] hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </Link>
                <Link href="/support" className="block px-4 py-2.5 text-sm text-[#4a3832] hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                  Support
                </Link>
                <Link href="/contact-us" className="block px-4 py-2.5 text-sm text-[#4a3832] hover:bg-[#faf7f4]" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                {firebaseUser && (
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 mt-2 border border-[#2a1210]/10 text-[#2a1210] font-medium hover:bg-[#faf7f4]"
                    onClick={async () => {
                      await auth.signOut()
                      setMobileMenuOpen(false)
                      toast.success('Signed out successfully')
                      window.location.reload()
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {!firebaseUser && <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />}
    </>
  )
}

export default Navbar
