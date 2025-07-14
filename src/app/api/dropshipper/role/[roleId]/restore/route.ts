import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getRoleById, restoreRole } from '@/app/models/role';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainDropshipper {
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
  dropshipper?: MainDropshipper;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  dropshipper?: SupplierStaff;
}

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const roleId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Role Request:', { roleId });

    // Get headers
    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', 'Invalid or missing dropshipper ID header', { dropshipperIdHeader, dropshipperRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if dropshipper exists
    //  let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['dropshipper', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaff) {
      //  mainDropshipperId = userCheck.dropshipper?.dropshipper?.id ?? dropshipperId;
      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'restore',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, dropshipperId);
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

    const roleIdNum = Number(roleId);
    if (isNaN(roleIdNum)) {
      logMessage('warn', 'Invalid role ID', { roleId });
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const roleResult = await getRoleById(roleIdNum);
    logMessage('debug', 'Role fetch result:', roleResult);
    if (!roleResult?.status) {
      logMessage('warn', 'Role not found', { roleIdNum });
      return NextResponse.json({ status: false, message: 'Role not found' }, { status: 404 });
    }

    // Restore the role (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreRole(dropshipperId, String(dropshipperRole), roleIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Role restored successfully:', restoreResult.restoredRole);
      return NextResponse.json({ status: true, role: restoreResult.restoredRole }, { status: 200 });
    }

    logMessage('error', 'Role restore failed');
    return NextResponse.json({ status: false, error: 'Role restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Role restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
