import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getRoleById, updateStaffPermissions, softDeleteRole, restoreRole, getRolePermissionsByRoleId } from '@/app/models/role';
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

export async function GET(req: NextRequest) {
  try {
    const urlSegments = req.nextUrl.pathname.split('/');
    const roleIdStr = urlSegments[urlSegments.length - 2];
    const roleId = Number(roleIdStr);

    logMessage('debug', '[GET Role] Requested Role ID:', { roleIdStr, parsed: roleId });

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    // Validate admin ID
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', '[GET Role] Invalid or missing admin ID', { adminIdHeader });
      return NextResponse.json({ status: false, error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    // Check if user exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', '[GET Role] User not found', { adminId, adminRole });
      return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));
    if (isStaff) {
      const permissionOptions = {
        panel: 'Admin',
        module: 'Role Permissions',
        action: 'View List',
      };

      const staffPermission = await checkStaffPermissionStatus(permissionOptions, adminId);
      logMessage('info', '[GET Role] Staff permission check result:', staffPermission);

      if (!staffPermission.status) {
        return NextResponse.json({
          status: false,
          message: staffPermission.message || "You do not have permission to perform this action."
        }, { status: 403 });
      }
    }

    // Validate role ID
    if (isNaN(roleId)) {
      logMessage('warn', '[GET Role] Invalid role ID', { roleIdStr });
      return NextResponse.json({ status: false, error: 'Invalid role ID' }, { status: 400 });
    }

    // Get role data
    const roleResult = await getRoleById(roleId);
    logMessage('debug', '[GET Role] Role lookup result:', roleResult);

    if (!roleResult?.status || !roleResult.role) {
      return NextResponse.json({ status: false, message: 'Role not found' }, { status: 404 });
    }

    // Get role permissions
    const permissionsResult = await getRolePermissionsByRoleId(roleId);
    logMessage('debug', '[GET Role] Permissions lookup result:', permissionsResult);

    if (!permissionsResult?.status || !permissionsResult.permissions) {
      return NextResponse.json({ status: false, message: 'Permissions not found for this role' }, { status: 404 });
    }

    logMessage('info', '[GET Role] Successfully fetched role and permissions.', {
      role: roleResult.role.name,
      totalPermissions: permissionsResult.permissions.length,
    });

    return NextResponse.json({
      status: true,
      message: 'Role and permissions fetched successfully.',
      role: roleResult.role,
      permissions: permissionsResult.permissions,
    }, { status: 200 });

  } catch (error) {
    logMessage('error', '❌ [GET Role] Unexpected error occurred:', error);
    return NextResponse.json({ status: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const urlSegments = req.nextUrl.pathname.split('/');
    const roleIdStr = urlSegments[urlSegments.length - 2];
    const roleId = Number(roleIdStr);

    const adminId = Number(req.headers.get("x-admin-id"));
    const adminRole = req.headers.get("x-admin-role");

    if (!adminId || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminId, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    const userCheck = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));
    if (isStaff) {
      const options = { panel: 'Admin', module: 'Role', action: 'Update' };
      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);

      if (!staffPermissionsResult.status) {
        return NextResponse.json({
          status: false,
          message: staffPermissionsResult.message || "You do not have permission to perform this action."
        }, { status: 403 });
      }
    }

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const roleResult = await getRoleById(roleId);
    if (!roleResult?.status || !roleResult.role) {
      return NextResponse.json({ status: false, message: 'Role not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const validation = validateFormData(formData, { requiredFields: ['permissions'] });

    if (!validation.isValid) {
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const permissionsRaw = (formData.get('permissions') as string) || '';
    const permissionsArray = permissionsRaw.split(',').map(p => p.trim()).filter(Boolean).map(Number);

    logMessage('info', `Assigning ${permissionsArray.length} permissions to role ID ${roleId}`);

    const updateResult = await updateStaffPermissions(
      adminId,
      String(adminRole),
      {
        roleId,
        permissionIds: permissionsArray
      },
      'admin'
    );

    if (!updateResult.status) {
      return NextResponse.json({
        status: false,
        message: updateResult.message,
        error: updateResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      message: updateResult.message,
      assigned: updateResult.assigned,
      removed: updateResult.removed,
      skipped: updateResult.skipped,
      invalid: updateResult.invalid
    }, { status: 200 });

  } catch (error) {
    logMessage('error', '❌ Role Permission Update Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract roleId directly from the URL path
    const roleId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Role ID:', roleId);

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
        module: 'Role',
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
    const restoreResult = await restoreRole(adminId, String(adminRole), roleIdNum);

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

export async function DELETE(req: NextRequest) {
  try {
    // Extract roleId directly from the URL path
    const roleId = req.nextUrl.pathname.split('/').pop();

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
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Role',
        action: 'Soft Delete',
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

    const result = await softDeleteRole(Number(adminId), String(adminRole), roleIdNum);  // Assuming softDeleteRole marks the role as deleted
    logMessage('info', `Soft delete request for role: ${roleIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Role soft deleted successfully: ${roleIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Role soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Role not found or could not be deleted: ${roleIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Role not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during role deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 7' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
