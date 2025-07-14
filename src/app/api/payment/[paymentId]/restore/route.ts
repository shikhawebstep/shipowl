import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getPaymentById, restorePayment } from '@/app/models/payment';

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role: string;
    // other optional properties if needed
}

interface SupplierStaff {
    id: number;
    name: string;
    email: string;
    password: string;
    role?: string;
    admin?: MainAdmin;
}

interface UserCheckResult {
    status: boolean;
    message?: string;
    admin?: SupplierStaff;
}

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const paymentId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Payment Request:', { paymentId });

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const paymentIdNum = Number(paymentId);
    if (isNaN(paymentIdNum)) {
      logMessage('warn', 'Invalid payment ID', { paymentId });
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const paymentResult = await getPaymentById(paymentIdNum);
    logMessage('debug', 'Payment fetch result:', paymentResult);
    if (!paymentResult?.status) {
      logMessage('warn', 'Payment not found', { paymentIdNum });
      return NextResponse.json({ status: false, message: 'Payment not found' }, { status: 404 });
    }

    // Restore the payment (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restorePayment(adminId, String(adminRole), paymentIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Payment restored successfully:', restoreResult.restoredPayment);
      return NextResponse.json({ status: true, payment: restoreResult.restoredPayment }, { status: 200 });
    }

    logMessage('error', 'Payment restore failed');
    return NextResponse.json({ status: false, error: 'Payment restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Payment restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
