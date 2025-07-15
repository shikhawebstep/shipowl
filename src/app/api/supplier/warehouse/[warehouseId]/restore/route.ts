import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getWarehouseById, restoreWarehouse } from '@/app/models/supplier/warehouse';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainSupplier {
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
  supplier?: MainSupplier;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  supplier?: SupplierStaff;
}
export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const warehouseId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Warehouse Request:', { warehouseId });

    // Get headers
    const supplierIdHeader = req.headers.get("x-supplier-id");
    const supplierRole = req.headers.get("x-supplier-role");

    const supplierId = Number(supplierIdHeader);
    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', 'Invalid or missing supplier ID header', { supplierIdHeader, supplierRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if the supplier user exists
    let mainSupplierId = supplierId;
    const userCheck: UserCheckResult = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['supplier', 'dropshipper', 'supplier'].includes(String(supplierRole));

    if (isStaff) {
      mainSupplierId = userCheck.supplier?.supplier?.id ?? supplierId;

      const options = {
        panel: 'Supplier',
        module: 'Warehouse',
        action: 'Restore',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, supplierId);
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
    const restoreResult = await restoreWarehouse(supplierId, String(supplierRole), warehouseIdNum);

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
