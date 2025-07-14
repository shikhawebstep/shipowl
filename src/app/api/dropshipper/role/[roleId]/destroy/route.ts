import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getRoleById, deleteRole } from '@/app/models/role';
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

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const roleId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Role Request:', { roleId });

    // Extract dropshipper ID and role from headers
    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    // Validate dropshipper ID
    if (!dropshipperId || isNaN(Number(dropshipperId))) {
      logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Dropshipper ID is missing or invalid' }, { status: 400 });
    }

    // Check if the dropshipper user exists
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
      // mainDropshipperId = userCheck.dropshipper?.dropshipper?.id ?? dropshipperId;

      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Permanent Delete',
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

    // Validate role ID
    const roleIdNum = Number(roleId);
    if (isNaN(roleIdNum)) {
      logMessage('warn', 'Invalid role ID format', { roleId });
      return NextResponse.json({ error: 'Role ID is invalid' }, { status: 400 });
    }

    const roleResult = await getRoleById(roleIdNum);
    if (!roleResult?.status) {
      logMessage('warn', 'Role not found', { roleIdNum });
      return NextResponse.json({ status: false, message: 'Role not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteRole(roleIdNum);  // Assuming deleteRole is for permanent deletion
    logMessage('info', `Permanent delete request for role: ${roleIdNum}`, { dropshipperId });


    if (result?.status) {
      logMessage('info', `Role permanently deleted successfully: ${roleIdNum}`, { dropshipperId });
      return NextResponse.json({ status: true, message: `Role permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Role not found or could not be deleted: ${roleIdNum}`, { dropshipperId });
    return NextResponse.json({ status: false, message: 'Role not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during role deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 8' }, { status: 500 });
  }
}

