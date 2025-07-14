import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getOrderById, updateShippingApiResultOfOrder } from '@/app/models/order/order';
import { placeOrderShipping } from '@/utils/order/placeOrderShipping';
import { getHighRtoByPincode } from '@/app/models/highRto';
import { getBadPincodeByPincode } from '@/app/models/badPincode';

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

interface ShippingApiResult {
  responsemsg: string;
  data?: unknown;
}

function isShippingApiResult(obj: unknown): obj is ShippingApiResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'responsemsg' in obj &&
    typeof (obj as Record<string, unknown>).responsemsg === 'string'
  );
}

export async function POST(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const orderIdId = parts[parts.length - 2];
    logMessage('debug', 'Requested OrderId ID:', orderIdId);

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

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const orderIdIdNum = Number(orderIdId);
    if (isNaN(orderIdIdNum)) {
      logMessage('warn', 'Invalid orderId ID', { orderIdId });
      return NextResponse.json({ error: 'Invalid orderId ID' }, { status: 400 });
    }

    const orderIdResult = await getOrderById(orderIdIdNum);
    logMessage('debug', 'OrderId fetch result:', orderIdResult);
    if (!orderIdResult?.status) {
      logMessage('warn', 'OrderId not found', { orderIdIdNum });
      return NextResponse.json({ status: false, message: 'OrderId not found' }, { status: 404 });
    }

    const getBadPincodeByPincodeResult = await getBadPincodeByPincode(orderIdResult?.order?.shippingZip || '');
    logMessage('debug', 'Bad Pincode by Pincode result:', getBadPincodeByPincodeResult);
    if (getBadPincodeByPincodeResult?.status) {
      logMessage('warn', 'Bad Pincode found:', getBadPincodeByPincodeResult);
      return NextResponse.json({
        status: false,
        message: 'Bad Pincode found',
        isBadPincode: true,
      }, { status: 400 });
    }

    const getHighRtoByPincodeResult = await getHighRtoByPincode(orderIdResult?.order?.shippingZip || '');
    logMessage('debug', 'High RTO by Pincode result:', getHighRtoByPincodeResult);
    if (getHighRtoByPincodeResult?.status) {
      logMessage('warn', 'High RTO Pincode found:', getHighRtoByPincodeResult);
      return NextResponse.json({
        status: false,
        message: 'High RTO Pincode found',
        isHighRto: true,
      }, { status: 400 });
    }

    const placeOrderShippingResult = await placeOrderShipping(orderIdIdNum);

    const orderPayload = {
      updatedBy: adminId,
      updatedByRole: adminRole || '',
      shippingApiJson: placeOrderShippingResult.result,
    };

    logMessage('info', 'Order payload created:', orderPayload);

    const updateShippingApiResultOfOrderResult = await updateShippingApiResultOfOrder(adminId, String(adminRole), orderIdIdNum, orderPayload);

    if (!updateShippingApiResultOfOrderResult || !updateShippingApiResultOfOrderResult.status || !updateShippingApiResultOfOrderResult.order) {
      logMessage('warn', 'Failed to update order shipping API result:', updateShippingApiResultOfOrderResult);
      return NextResponse.json({
        status: false,
        message: 'Failed to update order shipping API result',
        result: updateShippingApiResultOfOrderResult,
      }, { status: 500 });
    }

    const result = placeOrderShippingResult.result;

    let message = 'Shipping started.';
    let data = null;

    if (isShippingApiResult(result)) {
      message = result.responsemsg;
      data = result.data ?? null;
    }

    return NextResponse.json({
      status: true,
      message,
      result: data,
      isHighRto: false,
      isBadPincode: false,
    }, { status: 200 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ OrderId Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}
