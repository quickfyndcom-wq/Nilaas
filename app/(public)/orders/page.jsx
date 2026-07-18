'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

/** My Orders lives in the customer dashboard */
export default function OrdersRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/orders')
  }, [router])
  return <Loading />
}
