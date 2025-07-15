import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getWarehouseById, deleteWarehouse } from '@/app/models/supplier/warehouse';
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

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const warehouseId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Warehouse Request:', { warehouseId });

    // Extract supplier ID and role from headers
    const supplierId = Number(req.headers.get('x-supplier-id'));
    const supplierRole = req.headers.get('x-supplier-role');

    // Validate supplier ID
    if (!supplierId || isNaN(supplierId)) {
      logMessage('warn', 'Invalid or missing supplier ID', { supplierId });
      return NextResponse.json({ error: 'Supplier ID is missing or invalid' }, { status: 400 });
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
        action: 'Permanent Delete',
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

    // Validate warehouse ID
    const warehouseIdNum = Number(warehouseId);
    if (isNaN(warehouseIdNum)) {
      logMessage('warn', 'Invalid warehouse ID format', { warehouseId });
      return NextResponse.json({ error: 'Warehouse ID is invalid' }, { status: 400 });
    }

    const warehouseResult = await getWarehouseById(warehouseIdNum);
    if (!warehouseResult?.status) {
      logMessage('warn', 'Warehouse not found', { warehouseIdNum });
      return NextResponse.json({ status: false, message: 'Warehouse not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteWarehouse(warehouseIdNum);  // Assuming deleteWarehouse is for permanent deletion
    logMessage('info', `Permanent delete request for warehouse: ${warehouseIdNum}`, { supplierId });


    if (result?.status) {
      logMessage('info', `Warehouse permanently deleted successfully: ${warehouseIdNum}`, { supplierId });
      return NextResponse.json({ status: true, message: `Warehouse permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Warehouse not found or could not be deleted: ${warehouseIdNum}`, { supplierId });
    return NextResponse.json({ status: false, message: 'Warehouse not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during warehouse deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

