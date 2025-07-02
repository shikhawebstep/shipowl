import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierById, restoreSupplier } from '@/app/models/supplier/supplier';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
  role: string;
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
    const supplierId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Supplier Request:', { supplierId });

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
        action: 'restore',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    logMessage('debug', 'Supplier fetch result:', supplierResult);
    if (!supplierResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    // Restore the supplier (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreSupplier(adminId, String(adminRole), supplierIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Supplier restored successfully:', restoreResult.restoredSupplier);
      return NextResponse.json({ status: true, supplier: restoreResult.restoredSupplier }, { status: 200 });
    }

    logMessage('error', 'Supplier restore failed');
    return NextResponse.json({ status: false, error: 'Supplier restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Supplier restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
