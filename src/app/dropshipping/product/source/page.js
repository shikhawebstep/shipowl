"use client"
import dynamic from 'next/dynamic'

const ProductList = dynamic(() => import('@/components/dropshipping/product/ProductList'), { 
  ssr: false 
})

export default function Page() {
  return <ProductList />
}
