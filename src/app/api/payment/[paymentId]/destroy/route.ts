import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getPaymentById, deletePayment } from '@/app/models/payment';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const paymentId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Payment Request:', { paymentId });

    // Extract admin ID and role from headers
    const adminId = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate payment ID
    const paymentIdNum = Number(paymentId);
    if (isNaN(paymentIdNum)) {
      logMessage('warn', 'Invalid payment ID format', { paymentId });
      return NextResponse.json({ error: 'Payment ID is invalid' }, { status: 400 });
    }

    const paymentResult = await getPaymentById(paymentIdNum);
    if (!paymentResult?.status) {
      logMessage('warn', 'Payment not found', { paymentIdNum });
      return NextResponse.json({ status: false, message: 'Payment not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deletePayment(paymentIdNum);  // Assuming deletePayment is for permanent deletion
    logMessage('info', `Permanent delete request for payment: ${paymentIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Payment permanently deleted successfully: ${paymentIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Payment permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Payment not found or could not be deleted: ${paymentIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Payment not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during payment deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

