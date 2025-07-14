import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getRoleById, deleteRole } from '@/app/models/role';
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

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const roleId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Role Request:', { roleId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    //  let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Role',
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
    logMessage('info', `Permanent delete request for role: ${roleIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Role permanently deleted successfully: ${roleIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Role permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Role not found or could not be deleted: ${roleIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Role not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during role deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 8' }, { status: 500 });
  }
}

