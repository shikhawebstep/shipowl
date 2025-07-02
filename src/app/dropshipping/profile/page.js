import React from 'react';
import ProfileList from '@/components/dropshipping/dropshipper/ProfileList';

// ✅ Key line to fix the prerendering issue
export const dynamic = 'force-dynamic';

export default function Page() {
  return <ProfileList />;
}
