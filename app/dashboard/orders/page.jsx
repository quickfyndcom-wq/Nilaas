'use client'

import dynamic from 'next/dynamic'
import Loading from '@/components/Loading'

const OrdersClient = dynamic(() => import('@/app/(public)/orders/OrdersClient'), {
  ssr: false,
  loading: () => <Loading />,
})

export default function DashboardOrdersPage() {
  return <OrdersClient embedded />
}
