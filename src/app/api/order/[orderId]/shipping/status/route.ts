import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getOrderShippingStatus } from '@/utils/order/getOrderShippingStatus';

export async function GET(req: NextRequest) {
    try {
        const parts = req.nextUrl.pathname.split('/');
        const orderIdSegment = parts[parts.length - 3]; // Expected to be the orderId
        const orderId = Number(orderIdSegment);

        logMessage('debug', 'Order shipping status request received', { orderId });

        const adminId = req.headers.get('x-admin-id');
        const adminRole = req.headers.get('x-admin-role');

        // Validate admin ID
        if (!adminId || isNaN(Number(adminId))) {
            logMessage('warn', 'Invalid or missing admin ID', { adminId });
            return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
        }

        // Validate user existence
        const userCheck = await isUserExist(Number(adminId), String(adminRole));
        if (!userCheck.status) {
            logMessage('warn', `Unauthorized access attempt`, { adminId, adminRole });
            return NextResponse.json({ error: `User not found or unauthorized: ${userCheck.message}` }, { status: 404 });
        }

        // Validate order ID
        if (isNaN(orderId)) {
            logMessage('warn', 'Invalid order ID', { orderIdSegment });
            return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
        }

        // Fetch shipping status
        const shippingResponse = await getOrderShippingStatus(orderId);

        // Extract and return actual response JSON
        const shippingResult = await shippingResponse.json();

        logMessage(`debug`, `shippingResult:`, shippingResult);
        if (!shippingResult?.status) {
            logMessage('warn', 'Order shipping status not found', { orderId });
            return NextResponse.json({ status: false, message: 'Order shipping status not found' }, { status: 404 });
        }

        logMessage('info', 'Order shipping status retrieved successfully', { orderId, shippingResult });

        return NextResponse.json({
            status: true,
            message: 'Order shipping status found',
            data: shippingResult
        }, { status: 200 });

    } catch (error) {
        logMessage('error', 'Error fetching order shipping status', { error });
        return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
    }
}
