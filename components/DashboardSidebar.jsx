'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { signOut } from 'firebase/auth'
import {
  User,
  Package,
  Heart,
  Clock,
  MapPin,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'

const MENU = [
  { label: 'Profile', href: '/dashboard/profile', icon: User, match: 'profile' },
  { label: 'Orders', href: '/dashboard/orders', icon: Package, match: 'orders' },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart, match: 'wishlist' },
  {
    label: 'Addresses',
    href: '/dashboard/profile?tab=addresses',
    icon: MapPin,
    match: 'addresses',
  },
  { label: 'Browse history', href: '/browse-history', icon: Clock, match: 'history' },
  { label: 'Help', href: '/help', icon: HelpCircle, match: 'help' },
]

function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    if (user) {
      await signOut(auth)
      window.location.href = '/'
    }
  }

  const isActive = (item) => {
    if (item.match === 'addresses') {
      return pathname === '/dashboard/profile' && searchParams.get('tab') === 'addresses'
    }
    if (item.match === 'profile') {
      return pathname === '/dashboard/profile' && searchParams.get('tab') !== 'addresses'
    }
    if (item.match === 'orders') return pathname.startsWith('/dashboard/orders')
    if (item.match === 'wishlist') return pathname.startsWith('/dashboard/wishlist')
    if (item.match === 'history') return pathname.startsWith('/browse-history')
    if (item.match === 'help') return pathname.startsWith('/help')
    return pathname === item.href
  }

  const linkClass = (active) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition ${
      active
        ? 'bg-[#2a1210] text-[#f5ebe4] font-medium'
        : 'text-[#6b2f28] hover:bg-[#f5ebe4]'
    }`

  const NavLinks = ({ onNavigate, horizontal = false }) => (
    <nav className={horizontal ? 'flex gap-2 overflow-x-auto pb-1 scrollbar-none' : 'flex flex-col gap-0.5'}>
      {MENU.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={linkClass(active)}
          >
            <Icon size={16} className="shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile: title + menu button + horizontal tabs */}
      <div className="lg:hidden border-b border-[#2a1210]/10 bg-[#faf6f2]">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d72]">Nilaas</p>
            <p className="text-base font-semibold text-[#2a1210] leading-tight">My account</p>
            {user?.email && (
              <p className="mt-0.5 truncate text-xs text-[#9a7d72]">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-[#2a1210]/15 bg-white p-2.5 text-[#2a1210]"
          >
            <Menu size={18} />
          </button>
        </div>
        <div className="px-3 pb-3 -mx-0">
          <NavLinks horizontal />
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(280px,88vw)] flex-col bg-[#faf6f2] p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#2a1210]">My account</p>
                {user?.email && (
                  <p className="mt-0.5 truncate text-xs text-[#9a7d72]">{user.email}</p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-[#6b2f28]">
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 px-3 py-2.5 text-sm text-[#9a7d72]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar — in-flow sticky, clears site navbar + category strip */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-[#2a1210]/10">
        <div className="sticky top-28 max-h-[calc(100vh-7.5rem)] overflow-y-auto px-3 py-6">
          <div className="mb-5 px-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7d72]">Nilaas</p>
            <p className="mt-1 text-base font-semibold leading-snug text-[#2a1210]">My account</p>
            {user?.email && (
              <p className="mt-1 truncate text-xs text-[#9a7d72]">{user.email}</p>
            )}
          </div>
          <NavLinks />
          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#9a7d72] hover:text-[#6b2f28]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default function DashboardSidebar() {
  return (
    <Suspense fallback={<div className="hidden lg:block w-56 shrink-0" />}>
      <SidebarNav />
    </Suspense>
  )
}
