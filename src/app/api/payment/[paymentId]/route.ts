import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getPaymentById, checkTransactionIdAvailabilityForUpdate, updatePayment, softDeletePayment, restorePayment } from '@/app/models/payment';

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

export async function GET(req: NextRequest) {
  try {
    // Extract paymentId directly from the URL path
    const paymentId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Payment ID:', paymentId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const paymentIdNum = Number(paymentId);
    if (isNaN(paymentIdNum)) {
      logMessage('warn', 'Invalid payment ID', { paymentId });
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const paymentResult = await getPaymentById(paymentIdNum);
    if (paymentResult?.status) {
      logMessage('info', 'Payment found:', paymentResult.payment);
      return NextResponse.json({ status: true, payment: paymentResult.payment }, { status: 200 });
    }

    logMessage('info', 'Payment found:', paymentResult.payment);
    return NextResponse.json({ status: false, message: 'Payment not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single payment:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract paymentId directly from the URL path
    const paymentId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Payment ID:', paymentId);

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

    const extractNumber = (key: string) => Number(formData.get(key)) || null;
    const extractString = (key: string) => (formData.get(key) as string) || null;
    const extractDateTime = (key: string): Date | null => {
      const value = formData.get(key);
      if (typeof value === 'string' && value.trim()) {
        const parsedDate = new Date(value);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      }
      return null;
    };

    // Validate input
    const requiredFields = ['transactionId'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: {
        transactionId: 'string',
      },
    });

    logMessage('debug', 'Form data received:', formData);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const transactionId = extractString('transactionId') || '';
    const { status: checkTransactionIdAvailabilityResult, message: checkTransactionIdAvailabilityMessage } = await checkTransactionIdAvailabilityForUpdate(transactionId, paymentIdNum);

    if (!checkTransactionIdAvailabilityResult) {
      logMessage('warn', `SKU availability check failed: ${checkTransactionIdAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkTransactionIdAvailabilityMessage }, { status: 400 });
    }

    const paymentPayload = {
      transactionId,
      cycle: extractString('cycle') || '',
      amount: extractNumber('amount') || 0,
      status: extractString('status') || '',
      date: extractDateTime('date') || undefined,
      updatedBy: adminId,
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'Payment payload:', paymentPayload);

    const paymentCreateResult = await updatePayment(adminId, String(adminRole), paymentIdNum, paymentPayload);

    if (paymentCreateResult?.status) {
      logMessage('info', 'Payment updated successfully:', paymentCreateResult.payment);
      return NextResponse.json({ status: true, payment: paymentCreateResult.payment }, { status: 200 });
    }

    logMessage('error', 'Payment update failed', paymentCreateResult?.message);
    return NextResponse.json(
      { status: false, error: paymentCreateResult?.message || 'Payment creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ Payment Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract paymentId directly from the URL path
    const paymentId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Payment ID:', paymentId);

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

export async function DELETE(req: NextRequest) {
  try {
    // Extract paymentId directly from the URL path
    const paymentId = req.nextUrl.pathname.split('/').pop();

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

    const result = await softDeletePayment(Number(adminId), String(adminRole), paymentIdNum);  // Assuming softDeletePayment marks the payment as deleted
    logMessage('info', `Soft delete request for payment: ${paymentIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Payment soft deleted successfully: ${paymentIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Payment soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Payment not found or could not be deleted: ${paymentIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Payment not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during payment deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};