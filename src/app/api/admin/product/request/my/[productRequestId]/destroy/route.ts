import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductRequestById, deleteProductRequest } from '@/app/models/admin/product/myProductRequest';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const productRequestId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete ProductRequest Request:', { productRequestId });

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

    // Validate productRequest ID
    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequest ID format', { productRequestId });
      return NextResponse.json({ error: 'ProductRequest ID is invalid' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(Number(adminId), String(adminRole), productRequestIdNum);
    if (!productRequestResult?.status) {
      logMessage('warn', 'ProductRequest not found', { productRequestIdNum });
      return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteProductRequest(Number(adminId), String(adminRole), productRequestIdNum);  // Assuming deleteProductRequest is for permanent deletion
    logMessage('info', `Permanent delete request for productRequest: ${productRequestIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `ProductRequest permanently deleted successfully: ${productRequestIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `ProductRequest permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `ProductRequest not found or could not be deleted: ${productRequestIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'ProductRequest not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during productRequest deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

