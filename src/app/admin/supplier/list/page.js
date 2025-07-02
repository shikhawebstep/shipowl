"use client"
import dynamic from 'next/dynamic';

const SupplierList = dynamic(() => import('@/components/admin/supplier/SupplierList'), {
  ssr: false, // Disable SSR for this component
});

export default function Page() {
  return (
    <>
      <SupplierList />
    </>
  );
}
