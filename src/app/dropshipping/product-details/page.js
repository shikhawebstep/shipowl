'use client'

import dynamic from 'next/dynamic';

// Dynamically import ProductDetails with ssr: false
const ProductDetails = dynamic(() => import('@/components/dropshipping/home/ProductDetails'), { 
  ssr: false 
});

export default function Page() {
  return (
    <div>
      <ProductDetails />
    </div>
  );
}
