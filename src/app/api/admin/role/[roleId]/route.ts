import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getRoleById, updateRole, softDeleteRole, restoreRole } from '@/app/models/role';
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

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function GET(req: NextRequest) {
  try {
    // Extract roleId directly from the URL path
    const roleId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Role ID:', roleId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    //  let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      //  mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Role',
        action: 'View',
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
    if (roleResult?.status) {
      logMessage('info', 'Role found:', roleResult.role);
      return NextResponse.json({ status: true, role: roleResult.role }, { status: 200 });
    }

    logMessage('info', 'Role found:', roleResult.role);
    return NextResponse.json({ status: false, message: 'Role not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single role:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Role',
        action: 'Update',
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

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name'],
      patternValidations: {
        status: 'boolean',
      },
    });

    logMessage('debug', 'Form data received:', formData);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    // Extract fields
    const name = formData.get('name') as string;
    const permissionsRaw = (formData.get('permissions') as string) || '';
    const description = (formData.get('description') as string) || '';
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const rolePayload = {
      name,
      description,
      status
    };

    logMessage('info', 'Role payload:', rolePayload);

    const roleCreateResult = await updateRole(adminId, String(adminRole), roleIdNum, rolePayload);

    if (!roleCreateResult?.status) {
      logMessage('error', 'Role update failed', roleCreateResult?.message);
      return NextResponse.json(
        { status: false, error: roleCreateResult?.message || 'Role creation failed' },
        { status: 500 }
      );
    }

    // Process permissions
    const permissionsArray = permissionsRaw.split(',').map(p => p.trim()).filter(p => p);
    console.log('Split Permissions:', permissionsArray);
    permissionsArray.forEach((permissionId, index) => {
      console.log(`Permission #${index + 1}:`, permissionId);
    });

    logMessage('info', 'Role updated successfully:', roleCreateResult.role);
    return NextResponse.json({ status: true, role: roleCreateResult.role }, { status: 200 });
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', '❌ Role Updation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error 6' },
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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

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
