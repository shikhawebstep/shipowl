import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getOrderById, updateShippingApiResultOfOrder } from '@/app/models/order/order';
import { placeOrderShipping } from '@/utils/order/placeOrderShipping';
import { getHighRtoByPincode } from '@/app/models/highRto';

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
    // Extract orderIdId directly from the URL path
    const parts = req.nextUrl.pathname.split('/');
    const orderIdId = parts[parts.length - 3]; // Get the second-to-last segment
    logMessage('debug', 'Requested OrderId ID:', orderIdId);

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

    const getHighRtoByPincodeResult = await getHighRtoByPincode(orderIdResult?.order?.shippingZip || '');
    logMessage('debug', 'High RTO by Pincode result:', getHighRtoByPincodeResult);
    if (getHighRtoByPincodeResult?.status) {
      // Process shipping if no bad pincode or high RTO
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

      return NextResponse.json({
        status: true,
        message: 'Shipping started.',
        result: placeOrderShippingResult,
        isHighRto: false,  // This tells frontend that the order is not in a high RTO zone
        isBadPincode: false,  // This tells frontend that the order does not have a bad pincode
      }, { status: 200 });  // 200 OK for successful operation
    }

    // return http response if high RTO not found but hit query to confirm high RTO

    logMessage('warn', 'High RTO Pincode not found:', getHighRtoByPincodeResult);
    return NextResponse.json({
      status: false,
      message: getHighRtoByPincodeResult?.message || 'High RTO Pincode not found',
      isHighRto: true,  // Flag indicating high RTO for this pincode
    }, { status: 400 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ OrderId Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}