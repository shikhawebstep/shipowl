import React from 'react';
import RTO from '@/components/admin/orders/RTO';

// ✅ This disables static prerendering and fixes the error
export const dynamic = 'force-dynamic';

export default function Page() {
  return <RTO />;
}
