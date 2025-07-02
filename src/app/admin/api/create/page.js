"use client"
import dynamic from 'next/dynamic';

const Create = dynamic(() => import('@/components/admin/api-credentials/Create'), { 
  ssr: false // Disable SSR for this component
});

export default function Page() {
  return <Create />;
}
