import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById, restoreDropshipper } from '@/app/models/dropshipper/dropshipper';
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
  role?: string;
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
    const dropshipperId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperId });

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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Dropshipper',
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

    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    logMessage('debug', 'Dropshipper fetch result:', dropshipperResult);
    if (!dropshipperResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperIdNum });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    // Restore the dropshipper (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreDropshipper(adminId, String(adminRole), dropshipperIdNum);

    if (restoreResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Dropshipper',
          action: 'Restore',
          data: restoreResult,
          response: { status: true, dropshipper: restoreResult.restoredDropshipper },
          status: true
        }, req);
      logMessage('info', 'Dropshipper restored successfully:', restoreResult.restoredDropshipper);
      return NextResponse.json({ status: true, dropshipper: restoreResult.restoredDropshipper }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Dropshipper',
        action: 'Restore',
        data: restoreResult,
        response: { status: false, error: 'Dropshipper restore failed' },
        status: false
      }, req);

    logMessage('error', 'Dropshipper restore failed');
    return NextResponse.json({ status: false, error: 'Dropshipper restore failed' }, { status: 500 });

  } catch (error) {

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Dropshipper',
        action: 'Restore',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ Dropshipper restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
