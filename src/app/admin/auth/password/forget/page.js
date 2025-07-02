'use client'

import dynamic from 'next/dynamic';

// Dynamically load the ForgotPassword component without SSR
const ForgotPassword = dynamic(() => import('@/components/admin/ForgotPassword'), {
  ssr: false, // Disable SSR for this component
});

export default function Page() {
  return <ForgotPassword />;
}
