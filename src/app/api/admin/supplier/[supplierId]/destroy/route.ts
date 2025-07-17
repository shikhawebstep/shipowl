import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierById, deleteSupplier } from '@/app/models/supplier/supplier';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Supplier Request:', { supplierId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
        action: 'Permanent Delete',
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
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Supplier',
          action: 'Permanent Delete',
          data: result,
          response: { status: true, message: `Supplier permanently deleted successfully` },
          status: true
        }, req);

      logMessage('info', `Supplier permanently deleted successfully: ${supplierIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Supplier permanently deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Supplier',
        action: 'Permanent Delete',
        data: result,
        response: { status: false, message: 'Supplier not found or deletion failed' },
        status: false
      }, req);

    logMessage('info', `Supplier not found or could not be deleted: ${supplierIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Supplier not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Supplier',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Error during supplier deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

