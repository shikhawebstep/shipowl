import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getRoleById, updateRole, softDeleteRole, restoreRole } from '@/app/models/role';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainDropshipper {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface DropshipperStaff {
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
  dropshipper?: DropshipperStaff;
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

    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    if (!dropshipperId || isNaN(Number(dropshipperId))) {
      logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid or missing dropshipper ID' }, { status: 400 });
    }

    //  let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaff) {
      //  mainDropshipperId = userCheck.dropshipper?.dropshipper?.id ?? dropshipperId;

      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'View',
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
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaff) {
      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Update',
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

    const roleCreateResult = await updateRole(dropshipperId, String(dropshipperRole), roleIdNum, rolePayload);

    if (!roleCreateResult?.status) {
      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Role',
          action: 'Update',
          data: roleCreateResult,
          response: { status: false, error: roleCreateResult?.message || 'Role creation failed' },
          status: false
        }, req);
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

    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Update',
        data: roleCreateResult,
        response: { status: true, role: roleCreateResult.role },
        status: true
      }, req);
    logMessage('info', 'Role updated successfully:', roleCreateResult.role);
    return NextResponse.json({ status: true, role: roleCreateResult.role }, { status: 200 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);
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
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaff) {
      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Restore',
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
      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Role',
          action: 'Restore',
          data: restoreResult,
          response: { status: true, role: restoreResult.restoredRole },
          status: true
        }, req);
      logMessage('info', 'Role restored successfully:', restoreResult.restoredRole);
      return NextResponse.json({ status: true, role: restoreResult.restoredRole }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Restore',
        data: restoreResult,
        response: { status: false, error: 'Role restore failed' },
        status: false
      }, req);
    logMessage('error', 'Role restore failed');
    return NextResponse.json({ status: false, error: 'Role restore failed' }, { status: 500 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Restore',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);
    logMessage('error', '❌ Role restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract roleId directly from the URL path
    const roleId = req.nextUrl.pathname.split('/').pop();

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
    const userCheck = await isUserExist(Number(dropshipperId), String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `Dropshipper not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `Dropshipper not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaff) {
      const options = {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Soft Delete',
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

    const result = await softDeleteRole(Number(dropshipperId), String(dropshipperRole), roleIdNum);  // Assuming softDeleteRole marks the role as deleted
    logMessage('info', `Soft delete request for role: ${roleIdNum}`, { dropshipperId });

    if (result?.status) {
      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Role',
          action: 'Soft Delete',
          data: result,
          response: { status: true, message: `Role soft deleted successfully` },
          status: false
        }, req);
      logMessage('info', `Role soft deleted successfully: ${roleIdNum}`, { dropshipperId });
      return NextResponse.json({ status: true, message: `Role soft deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Soft Delete',
        data: result,
        response: { status: false, message: 'Role not found or deletion failed' },
        status: false
      }, req);
    logMessage('info', `Role not found or could not be deleted: ${roleIdNum}`, { dropshipperId });
    return NextResponse.json({ status: false, message: 'Role not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Role',
        action: 'Soft Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);
    logMessage('error', 'Error during role deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 7' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
