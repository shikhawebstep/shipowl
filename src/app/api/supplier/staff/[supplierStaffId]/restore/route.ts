import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierStaffById, restoreSupplierStaff } from '@/app/models/supplier/staff';

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierStaffId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Supplier Request:', { supplierStaffId });

    // Get headers
    const supplierIdHeader = req.headers.get("x-supplier-id");
    const supplierRole = req.headers.get("x-supplier-role");

    const supplierIdHeaderNum = Number(supplierIdHeader);
    if (!supplierIdHeader || isNaN(supplierIdHeaderNum)) {
      logMessage('warn', 'Invalid or missing supplier ID header', { supplierIdHeaderNum, supplierRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const userCheck = await isUserExist(supplierIdHeaderNum, String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { supplierIdHeaderNum, supplierRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (!supplierStaffResult?.status) {
      logMessage('warn', `Supplier Staff not found: ${supplierStaffResult.message}`, { supplierStaffId });
      return NextResponse.json({ error: `Supplier Staff not found: ${supplierStaffResult.message}` }, { status: 404 });
    }

    // Restore the supplier (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreSupplierStaff(supplierIdHeaderNum, String(supplierRole), Number(supplierStaffId));

    if (restoreResult?.status) {
      logMessage('info', 'Supplier restored successfully:', restoreResult.restoredSupplierStaff);
      return NextResponse.json({ status: true, supplier: restoreResult.restoredSupplierStaff, message: 'Supplier Staff restored successfully' }, { status: 200 });
    }

    logMessage('error', 'Supplier restore failed');
    return NextResponse.json({ status: false, error: 'Supplier restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Supplier restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
