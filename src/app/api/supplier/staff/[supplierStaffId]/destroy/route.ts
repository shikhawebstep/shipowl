import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierStaffById, deleteSupplierStaff } from '@/app/models/supplier/staff';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierStaffId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Supplier Request:', { supplierStaffId });

    // Extract supplier ID and role from headers
    const supplierIdHeader = req.headers.get('x-supplier-id');
    const supplierRole = req.headers.get('x-supplier-role');

    // Validate supplier ID
    if (!supplierIdHeader || isNaN(Number(supplierIdHeader))) {
      logMessage('warn', 'Invalid or missing supplier ID', { supplierIdHeader });
      return NextResponse.json({ error: 'Supplier ID is missing or invalid' }, { status: 400 });
    }

    // Check if the supplier user exists
    const userCheck = await isUserExist(Number(supplierIdHeader), String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `Supplier not found: ${userCheck.message}`, { supplierIdHeader, supplierRole });
      return NextResponse.json({ error: `Supplier not found: ${userCheck.message}` }, { status: 404 });
    }

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (!supplierStaffResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierStaffId });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteSupplierStaff(Number(supplierStaffId));  // Assuming deleteSupplier is for permanent deletion
    logMessage('info', `Permanent delete request for supplier: ${supplierStaffId}`, { supplierIdHeader });


    if (result?.status) {
      logMessage('info', `Supplier permanently deleted successfully: ${supplierStaffId}`, { supplierIdHeader });
      return NextResponse.json({ status: true, message: `Supplier permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Supplier not found or could not be deleted: ${supplierStaffId}`, { supplierIdHeader });
    return NextResponse.json({ status: false, message: 'Supplier not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during supplier deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

