import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCategoryById, restoreCategory } from '@/app/models/admin/category';
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
    const categoryId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Category Request:', { categoryId });

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
        module: 'Category',
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

    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID', { categoryId });
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    logMessage('debug', 'Category fetch result:', categoryResult);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryIdNum });
      return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
    }

    // Restore the category (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreCategory(adminId, String(adminRole), categoryIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Category restored successfully:', restoreResult.restoredCategory);
      return NextResponse.json({ status: true, category: restoreResult.restoredCategory }, { status: 200 });
    }

    logMessage('error', 'Category restore failed');
    return NextResponse.json({ status: false, error: 'Category restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Category restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
