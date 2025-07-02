import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierById, deleteSupplier } from '@/app/models/supplier/supplier';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Supplier Request:', { supplierId });

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

    // Validate supplier ID
    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID format', { supplierId });
      return NextResponse.json({ error: 'Supplier ID is invalid' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    if (!supplierResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteSupplier(supplierIdNum);  // Assuming deleteSupplier is for permanent deletion
    logMessage('info', `Permanent delete request for supplier: ${supplierIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Supplier permanently deleted successfully: ${supplierIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Supplier permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Supplier not found or could not be deleted: ${supplierIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Supplier not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during supplier deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

