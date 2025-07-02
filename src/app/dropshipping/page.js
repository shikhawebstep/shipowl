"use client"
import dynamic from 'next/dynamic'

// Dynamically import the Home component and disable SSR
const Home = dynamic(() => import('@/components/dropshipping/home/Home'), {
  ssr: false // Disable server-side rendering for the Home component
})

export default function Page() {
  return <Home />
}
