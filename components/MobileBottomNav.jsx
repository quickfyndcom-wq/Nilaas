
'use client'
import React from 'react'
import { Home, Search, ShoppingCart, User, LayoutGrid, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useAuth } from '@/lib/useAuth'

export default function MobileBottomNav() {
  const [hydrated, setHydrated] = React.useState(false)
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  React.useEffect(() => { setHydrated(true) }, []);
  const pathname = usePathname()
  const cartCount = useSelector((state) => state.cart.total)
  const { user, loading: authLoading } = useAuth();
  const isSignedIn = !!user;

  // Don't show on product pages (will have separate fixed bar)
  if (pathname?.includes('/product/')) {
    return null
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/categories', icon: LayoutGrid, label: 'Categories' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { type: 'menu', icon: Menu, label: 'Menu' },
  ]

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            if (item.type === 'menu') {
              return (
                <button
                  key="menu"
                  onClick={() => setShowMobileMenu(true)}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 transition-colors relative text-gray-500 hover:text-gray-900"
                >
                  <div className="relative mb-1">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] leading-tight font-normal">
                    {item.label}
                  </span>
                </button>
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-colors relative ${
                  isActive 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                <div className="relative mb-1">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {hydrated && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] leading-tight ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-[9999]" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute top-0 right-0 w-3/4 max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto animate-slideIn" 
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button 
                onClick={() => setShowMobileMenu(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Section */}
            {isSignedIn ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setShowMobileMenu(false)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold rounded-lg transition"
              >
                Sign In / Register
              </Link>
            )}

            {/* Menu Items */}
            <div className="flex flex-col gap-1 mt-2">
              {isSignedIn && (
                <>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
                  >
                    <User size={18} />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
                  >
                    <ShoppingCart size={18} />
                    <span className="font-medium">My Orders</span>
                  </Link>
                  <Link
                    href="/browse-history"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
                  >
                    <Search size={18} />
                    <span className="font-medium">Browse History</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
                  >
                    <LayoutGrid size={18} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <div className="my-2 border-t border-gray-200" />
                </>
              )}
              
              <Link
                href="/help-center"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Help Center</span>
              </Link>
              
              <Link
                href="/track-order"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Track Order</span>
              </Link>

              {isSignedIn && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <button
                    onClick={async () => {
                      const { signOut } = await import('@/lib/firebase')
                      await signOut()
                      setShowMobileMenu(false)
                      window.location.href = '/'
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-red-600 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
