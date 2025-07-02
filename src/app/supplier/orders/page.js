"use client"
import dynamic from 'next/dynamic';

const Orders = dynamic(() => import('@/components/supplier/orders/Orders'), { ssr: false });

export default function Page() {
  return <Orders />;
}
