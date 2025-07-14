import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { checkTransactionIdAvailability, createPayment, getPaymentsByStatus } from '@/app/models/payment';

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

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for payment creation');

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const requiredFields = ['transactionId'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: {
        transactionId: 'string',
      },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
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

    const transactionId = extractString('transactionId') || '';
    const { status: checkTransactionIdAvailabilityResult, message: checkTransactionIdAvailabilityMessage } = await checkTransactionIdAvailability(transactionId);

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
      createdBy: adminId,
      createdByRole: adminRole || '',
    };

    logMessage('info', 'Payment payload created:', paymentPayload);

    const paymentCreateResult = await createPayment(adminId, String(adminRole), paymentPayload);

    if (paymentCreateResult?.status) {
      return NextResponse.json({ status: true, payment: paymentCreateResult.payment }, { status: 200 });
    }

    logMessage('error', 'Payment creation failed:', paymentCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: paymentCreateResult?.message || 'Payment creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Payment Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {

    // Retrieve admin details from request headers
    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Log admin info
    logMessage('info', 'Admin details received', { adminIdHeader, adminRole });

    // Validate adminId
    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid admin ID received', { adminIdHeader });
      return NextResponse.json(
        { status: false, error: 'Invalid or missing admin ID' },
        { status: 400 }
      );
    }

    // Check if the admin exists
    const userExistence = await isUserExist(adminId, String(adminRole));
    if (!userExistence.status) {
      logMessage('warn', 'Admin user not found', { adminId, adminRole });
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    // Fetch payments based on filters
    const paymentsResult = await getPaymentsByStatus('notDeleted');

    // Handle response based on payments result
    if (paymentsResult?.status) {
      return NextResponse.json(
        { status: true, payments: paymentsResult.payments },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No payments found' },
      { status: 404 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Error while fetching payments', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch payments due to an internal error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};