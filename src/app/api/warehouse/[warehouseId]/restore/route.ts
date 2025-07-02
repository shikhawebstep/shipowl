import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getWarehouseById, restoreWarehouse } from '@/app/models/warehouse';

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
    const warehouseId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Warehouse Request:', { warehouseId });

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

    const warehouseIdNum = Number(warehouseId);
    if (isNaN(warehouseIdNum)) {
      logMessage('warn', 'Invalid warehouse ID', { warehouseId });
      return NextResponse.json({ error: 'Invalid warehouse ID' }, { status: 400 });
    }

    const warehouseResult = await getWarehouseById(warehouseIdNum);
    logMessage('debug', 'Warehouse fetch result:', warehouseResult);
    if (!warehouseResult?.status) {
      logMessage('warn', 'Warehouse not found', { warehouseIdNum });
      return NextResponse.json({ status: false, message: 'Warehouse not found' }, { status: 404 });
    }

    // Restore the warehouse (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreWarehouse(adminId, String(adminRole), warehouseIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Warehouse restored successfully:', restoreResult.warehouse);
      return NextResponse.json({ status: true, warehouse: restoreResult.warehouse }, { status: 200 });
    }

    logMessage('error', 'Warehouse restore failed');
    return NextResponse.json({ status: false, error: 'Warehouse restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Warehouse restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
