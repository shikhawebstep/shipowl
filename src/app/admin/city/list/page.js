'use client'

import dynamic from 'next/dynamic';

const List = dynamic(() => import('@/components/admin/citymanagement/List'), {
  ssr: false, // Disable SSR for this component
});

export default function Page() {
  return (
    <>
      <List />
    </>
  );
}
