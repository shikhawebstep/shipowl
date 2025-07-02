'use client'

import dynamic from 'next/dynamic'

const Profile = dynamic(() => import('@/components/admin/supplier/Profile'), {
  ssr: false // Disable server-side rendering
})

export default function Page() {
  return (
    <Profile />
  )
}
