import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductRequestById, restoreProductRequest } from '@/app/models/admin/product/productRequest';

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
    const productRequestId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete ProductRequest Request:', { productRequestId });

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

    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequest ID', { productRequestId });
      return NextResponse.json({ error: 'Invalid productRequest ID' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(productRequestIdNum);
    logMessage('debug', 'ProductRequest fetch result:', productRequestResult);
    if (!productRequestResult?.status) {
      logMessage('warn', 'ProductRequest not found', { productRequestIdNum });
      return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
    }

    // Restore the productRequest (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreProductRequest(adminId, String(adminRole), productRequestIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'ProductRequest restored successfully:', restoreResult.restoredProductRequest);
      return NextResponse.json({ status: true, productRequest: restoreResult.restoredProductRequest }, { status: 200 });
    }

    logMessage('error', 'ProductRequest restore failed');
    return NextResponse.json({ status: false, error: 'ProductRequest restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ ProductRequest restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
