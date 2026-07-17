'use client'

import axios from 'axios'
export const dynamic = 'force-dynamic'
import {
  CircleDollarSignIcon,
  ShoppingBasketIcon,
  StarIcon,
  TagsIcon,
  UsersIcon,
  ShoppingCartIcon,
  TruckIcon,
  PackageIcon,
  CheckCircle2Icon,
  ClockIcon,
} from 'lucide-react'
import ContactMessagesSeller from './ContactMessagesSeller.jsx'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS = [
  '#2a1210',
  '#047857',
  '#0f766e',
  '#b45309',
  '#1d4ed8',
  '#7c3aed',
  '#be123c',
  '#64748b',
  '#ca8a04',
]

function formatInr(n, currency = '₹') {
  return `${currency}${Number(n || 0).toLocaleString('en-IN')}`
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white border border-emerald-200 rounded-xl p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
        {subtitle ? <p className="text-xs text-emerald-700/70 mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="w-full h-64 sm:h-72">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalEarnings: 0,
    totalOrders: 0,
    totalCustomers: 0,
    abandonedCarts: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
    salesLast7Days: 0,
    salesLast30Days: 0,
    ordersLast7Days: 0,
    ordersLast30Days: 0,
    salesOverTime: [],
    ordersByStatus: [],
    paymentBreakdown: [],
    topProducts: [],
    recentOrders: [],
    ratings: [],
  })

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { auth } = await import('@/lib/firebase')
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            try {
              if (!user) {
                setLoading(false)
                unsubscribe()
                resolve()
                return
              }
              const callDashboard = async (idToken) =>
                axios.get('/api/store/dashboard', {
                  timeout: 15000,
                  headers: { Authorization: `Bearer ${idToken}` },
                })

              let token = await user.getIdToken()
              let response
              try {
                response = await callDashboard(token)
              } catch (tokenError) {
                if (tokenError.response?.status === 401) {
                  response = await callDashboard(await user.getIdToken(true))
                } else {
                  throw tokenError
                }
              }
              if (response?.data?.dashboardData) {
                setDashboardData((prev) => ({ ...prev, ...response.data.dashboardData }))
              }
            } catch (e) {
              console.error('[Dashboard]', e.message)
            } finally {
              setLoading(false)
              unsubscribe()
              resolve()
            }
          })
        })
      } catch (e) {
        console.error('[Dashboard] Firebase:', e.message)
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const cards = [
    { title: 'Total earnings', value: formatInr(dashboardData.totalEarnings, currency), icon: CircleDollarSignIcon, hint: `AOV ${formatInr(dashboardData.avgOrderValue, currency)}` },
    { title: 'Total orders', value: dashboardData.totalOrders, icon: TagsIcon, hint: `${dashboardData.ordersLast30Days} in 30 days` },
    { title: 'Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon, hint: 'Live catalogue' },
    { title: 'Customers', value: dashboardData.totalCustomers, icon: UsersIcon, hint: 'Unique buyers' },
    { title: 'Pending', value: dashboardData.pendingOrders, icon: ClockIcon, hint: 'Needs action' },
    { title: 'In shipping', value: dashboardData.shippedOrders, icon: TruckIcon, hint: 'Manifested → OFD' },
    { title: 'Delivered', value: dashboardData.deliveredOrders, icon: CheckCircle2Icon, hint: 'Completed' },
    { title: 'Abandoned carts', value: dashboardData.abandonedCarts, icon: ShoppingCartIcon, hint: 'Recovery opportunity' },
  ]

  const statusChartData = (dashboardData.ordersByStatus || []).map((s, i) => ({
    ...s,
    fill: STATUS_COLORS[i % STATUS_COLORS.length],
  }))

  return (
    <div className="text-emerald-800 mb-28">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl text-emerald-700">
            Seller <span className="text-emerald-900 font-semibold">Dashboard</span>
          </h1>
          <p className="text-sm text-emerald-700/70 mt-1">
            Sales, orders, and shipping overview
            {loading ? ' · loading…' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/store/orders"
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
          >
            Manage orders
          </Link>
          <Link
            href="/store/shipping"
            className="text-sm font-semibold px-3 py-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50"
          >
            Shipping settings
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 mb-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex items-start justify-between gap-3 border border-emerald-200 p-4 rounded-xl bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-700">{card.title}</p>
              <b className="block text-xl sm:text-2xl font-semibold text-emerald-950 mt-1 truncate">
                {card.value}
              </b>
              <p className="text-[11px] text-emerald-600/80 mt-1">{card.hint}</p>
            </div>
            <card.icon size={36} className="w-9 h-9 p-2 text-emerald-700 bg-emerald-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Last 7 days</p>
          <p className="text-2xl font-semibold text-emerald-950 mt-1">
            {formatInr(dashboardData.salesLast7Days, currency)}
          </p>
          <p className="text-xs text-emerald-700 mt-1">{dashboardData.ordersLast7Days} orders</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Last 30 days</p>
          <p className="text-2xl font-semibold text-emerald-950 mt-1">
            {formatInr(dashboardData.salesLast30Days, currency)}
          </p>
          <p className="text-xs text-emerald-700 mt-1">{dashboardData.ordersLast30Days} orders</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Avg order value</p>
          <p className="text-2xl font-semibold text-emerald-950 mt-1">
            {formatInr(dashboardData.avgOrderValue, currency)}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            {dashboardData.cancelledOrders} cancelled / RTO
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <ChartCard
          title="Revenue (30 days)"
          subtitle="Daily sales from store orders"
          className="xl:col-span-2"
        >
          {(dashboardData.salesOverTime || []).length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.salesOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#047857' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#047857' }} width={48} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: '#a7f3d0', fontSize: 12 }}
                  formatter={(v, name) =>
                    name === 'revenue' ? [formatInr(v, currency), 'Revenue'] : [v, 'Orders']
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#047857"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payment mix" subtitle="COD vs prepaid">
          {(dashboardData.paymentBreakdown || []).length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.paymentBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {dashboardData.paymentBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill || STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Orders by status" subtitle="Current pipeline" className="xl:col-span-1">
          {statusChartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#047857' }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={100}
                  tick={{ fontSize: 10, fill: '#065f46' }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top products" subtitle="By units sold" className="xl:col-span-2">
          {(dashboardData.topProducts || []).length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.topProducts} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#047857' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#047857' }} allowDecimals={false} width={36} />
                <Tooltip
                  formatter={(v, name) =>
                    name === 'revenue' ? [formatInr(v, currency), 'Revenue'] : [v, 'Qty']
                  }
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || _}
                />
                <Bar dataKey="qty" fill="#059669" radius={[4, 4, 0, 0]} name="qty" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent orders + shipping shortcut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-10">
        <div className="xl:col-span-2 bg-white border border-emerald-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-950">Recent orders</h3>
            <Link href="/store/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          {(dashboardData.recentOrders || []).length === 0 ? (
            <p className="text-sm text-emerald-500 text-center py-10">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50/80 text-xs uppercase text-emerald-700">
                  <tr>
                    <th className="text-left px-4 py-2.5">Order</th>
                    <th className="text-left px-4 py-2.5">Customer</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {dashboardData.recentOrders.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-emerald-50/40 cursor-pointer"
                      onClick={() => router.push('/store/orders')}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-emerald-900">
                        {o.shortOrderNumber || String(o._id).slice(-6)}
                        {o.awb ? (
                          <span className="block text-[10px] text-emerald-600 mt-0.5">AWB {o.awb}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-800">{o.customer}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {(o.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-950">
                        {formatInr(o.total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push('/store/shipping')}
            className="w-full text-left border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all rounded-xl p-4 flex items-center gap-3"
          >
            <span className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <TruckIcon size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-emerald-900">Shipping & delivery</span>
              <span className="block text-xs text-emerald-700/80 mt-0.5">
                Checkout labels, delivery days & FREE shipping
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/store/orders')}
            className="w-full text-left border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all rounded-xl p-4 flex items-center gap-3"
          >
            <span className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <PackageIcon size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-emerald-900">Orders & Delhivery</span>
              <span className="block text-xs text-emerald-700/80 mt-0.5">
                Ship, labels, pickup & status sync
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/store/manage-product')}
            className="w-full text-left border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all rounded-xl p-4 flex items-center gap-3"
          >
            <span className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <ShoppingBasketIcon size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-emerald-900">Manage products</span>
              <span className="block text-xs text-emerald-700/80 mt-0.5">
                {dashboardData.totalProducts} products in catalogue
              </span>
            </span>
          </button>
        </div>
      </div>

      <h2 className="text-emerald-900 font-semibold flex items-center gap-2">
        <StarIcon size={18} className="text-emerald-600" />
        Recent reviews
      </h2>

      <div className="mt-4 mb-10">
        {dashboardData.ratings && dashboardData.ratings.length > 0 ? (
          dashboardData.ratings.map((review, index) => (
            <div
              key={review._id || index}
              className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-5 border-b border-green-200 text-sm text-emerald-700 max-w-4xl hover:bg-green-50/30 px-3 rounded transition"
            >
              <div>
                <div className="flex gap-3">
                  {review.user && (
                    <Image
                      src={
                        review.user.image && review.user.image.trim() !== ''
                          ? review.user.image
                          : '/placeholder.png'
                      }
                      alt={review.user.name ? `${review.user.name} avatar` : 'Customer avatar'}
                      className="w-10 aspect-square rounded-full border-2 border-green-200"
                      width={100}
                      height={100}
                    />
                  )}
                  <div>
                    <p className="font-medium text-emerald-900">
                      {review.user ? review.user.name : 'Customer'}
                    </p>
                    <p className="font-light text-emerald-600">
                      {review.createdAt ? new Date(review.createdAt).toDateString() : ''}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-emerald-700 max-w-xs leading-6">{review.review}</p>
              </div>
              <div className="flex flex-col justify-between gap-4 sm:items-end">
                <div className="flex flex-col sm:items-end">
                  <p className="text-emerald-600">{review.product?.category}</p>
                  <p className="font-medium text-emerald-900">{review.product?.name}</p>
                  <div className="flex items-center">
                    {Array(5)
                      .fill('')
                      .map((_, i) => (
                        <StarIcon
                          key={i}
                          size={17}
                          className="text-transparent mt-0.5"
                          fill={review.rating >= i + 1 ? '#10b981' : '#D1FAE5'}
                        />
                      ))}
                  </div>
                </div>
                {review.product && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/product/${review.product.slug || review.product._id}`)
                    }
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-5 py-2 rounded transition-all font-medium border border-emerald-300"
                  >
                    View Product
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-emerald-400 border border-dashed border-emerald-200 rounded-xl">
            <p>No reviews yet</p>
          </div>
        )}
      </div>

      <ContactMessagesSeller />
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-emerald-400 border border-dashed border-emerald-100 rounded-lg">
      No data yet
    </div>
  )
}
