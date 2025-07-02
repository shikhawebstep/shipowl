"use client"
import dynamic from 'next/dynamic';
import React from 'react';
const Rto = dynamic(() => import('@/components/supplier/rto/Rto'), {
  ssr: false,  // This disables server-side rendering for this component
});

export default function Page() {
  return <Rto />;
}
