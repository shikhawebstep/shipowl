"use client"

import { useAdmin } from '@/components/admin/middleware/AdminMiddleWareContext'
import React, { useEffect } from 'react'

export default function Dashboard() {
  const { verifyAdminAuth } = useAdmin();
  useEffect(() => {
    verifyAdminAuth();
  }, [verifyAdminAuth])

  return (
    <div>Dashboard</div>
  )
}
