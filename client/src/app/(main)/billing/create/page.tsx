
import React, { Suspense } from 'react'
import BillingPage from '@/components/Billing/BillingPage'

export const dynamic = "force-dynamic";

const page = () => {
  return (
    <BillingPage/>
  )
}

export default page