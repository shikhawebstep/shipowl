import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCategoryById, deleteCategory } from '@/app/models/admin/category';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const categoryId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Category Request:', { categoryId });

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Category',
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

    // Validate category ID
    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID format', { categoryId });
      return NextResponse.json({ error: 'Category ID is invalid' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryIdNum });
      return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteCategory(categoryIdNum);  // Assuming deleteCategory is for permanent deletion
    logMessage('info', `Permanent delete request for category: ${categoryIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Category permanently deleted successfully: ${categoryIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Category permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Category not found or could not be deleted: ${categoryIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Category not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during category deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 12' }, { status: 500 });
  }
}

