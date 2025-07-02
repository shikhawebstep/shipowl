import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getAdminStaffById, restoreAdminStaff } from '@/app/models/admin/staff';
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
    const adminStaffId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Admin Request:', { adminStaffId });

    // Get headers
    const adminId = Number(req.headers.get("x-admin-id"));
    const adminRole = req.headers.get("x-admin-role");

    if (!adminId || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminId, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      const options = {
        panel: 'Admin',
        module: 'Sub User',
        action: 'Restore',
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

    const adminStaffResult = await getAdminStaffById(Number(adminStaffId));
    if (!adminStaffResult?.status) {
      logMessage('warn', `Admin Staff not found: ${adminStaffResult.message}`, { adminStaffId });
      return NextResponse.json({ error: `Admin Staff not found: ${adminStaffResult.message}` }, { status: 404 });
    }

    // Restore the admin (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreAdminStaff(adminId, String(adminRole), Number(adminStaffId));

    if (restoreResult?.status) {
      logMessage('info', 'Admin restored successfully:', restoreResult.restoredAdminStaff);
      return NextResponse.json({ status: true, admin: restoreResult.restoredAdminStaff, message: 'Admin Staff restored successfully' }, { status: 200 });
    }

    logMessage('error', 'Admin restore failed');
    return NextResponse.json({ status: false, error: 'Admin restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Admin restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
