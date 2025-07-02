import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getWarehouseById, deleteWarehouse } from '@/app/models/warehouse';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const warehouseId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Warehouse Request:', { warehouseId });

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
    logMessage('info', `Permanent delete request for warehouse: ${warehouseIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Warehouse permanently deleted successfully: ${warehouseIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Warehouse permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Warehouse not found or could not be deleted: ${warehouseIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Warehouse not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during warehouse deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

