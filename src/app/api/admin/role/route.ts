import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bwipjs from 'bwip-js';
import fs from 'fs/promises';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { createRole, getRolesByStatus, updateStaffPermissions } from '@/app/models/role';
import { fetchLogInfo } from '@/utils/commonUtils';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface AdminStaff {
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
  admin?: AdminStaff;
}

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', '📥 POST request received for role creation');

    // Extract headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `❗ Invalid or missing admin ID: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, message: "Admin ID is missing or invalid." },
        { status: 400 }
      );
    }

    // Verify admin existence
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, message: `User not found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    // Staff role permission check
    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));
    if (isStaff) {
      const options = { panel: 'Admin', module: 'Role', action: 'Create' };
      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);

      logMessage('info', '🔐 Staff permission check result:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to create roles."
          },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    // Validate required inputs
    const validation = validateFormData(formData, {
      requiredFields: ['name'],
      patternValidations: {
        status: 'boolean',
      },
    });

    if (!validation.isValid) {
      logMessage('warn', '⚠️ Form validation failed', validation.error);
      return NextResponse.json(
        {
          status: false,
          message: validation.message || "Invalid input data.",
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Prepare role data
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', 'active', 'yes'].includes(statusRaw ?? '');

    const rolePayload = { name, description, status };
    logMessage('info', '📝 Role payload prepared:', rolePayload);

    // Create role
    const roleCreateResult = await createRole(adminId, String(adminRole), rolePayload);

    if (!roleCreateResult?.status || !roleCreateResult?.role?.id) {
      logMessage('error', '❌ Role creation failed:', roleCreateResult?.message || 'Unknown error');
      return NextResponse.json(
        {
          status: false,
          message: roleCreateResult?.message || "Failed to create role. Please try again.",
        },
        { status: 500 }
      );
    }

    // Assign permissions (if any)
    const permissionsRaw = (formData.get('permissions') as string) || '';
    const permissionIds = permissionsRaw
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(Number);

    logMessage('info', `🔗 Assigning ${permissionIds.length} permissions to role ID ${roleCreateResult.role.id}`);

    const updateResult = await updateStaffPermissions(
      adminId,
      String(adminRole),
      {
        roleId: roleCreateResult.role.id,
        permissionIds
      },
      'admin'
    );

    if (!updateResult.status) {
      return NextResponse.json({
        status: false,
        message: updateResult.message || "Failed to assign permissions.",
        error: updateResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      message: "Role created and permissions assigned successfully.",
      role: roleCreateResult.role,
      permissions: {
        assigned: updateResult.assigned,
        removed: updateResult.removed,
        skipped: updateResult.skipped,
        invalid: updateResult.invalid, // Optional: for debugging
      }
    }, { status: 200 });

  } catch (error) {
    logMessage('error', '❌ Role Creation Exception:', error);
    return NextResponse.json(
      { status: false, message: 'Something went wrong while creating the role.', error },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching roles');

    // Extract headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `❗ Invalid or missing admin ID: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, message: "Admin ID is missing or invalid." },
        { status: 400 }
      );
    }

    // Verify admin existence
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, message: `User not found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    // Staff role permission check
    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));
    if (isStaff) {
      const options = { panel: 'Admin', module: 'Role', action: 'View Listing' };
      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);

      logMessage('info', '🔐 Staff permission check result:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to create roles."
          },
          { status: 403 }
        );
      }
    }

    // Fetch all roles
    const rolesResult = await getRolesByStatus("notDeleted");

    if (rolesResult?.status) {
      return NextResponse.json(
        { status: true, roles: rolesResult.roles },
        { status: 200 }
      );
    }

    logMessage('warn', 'No roles found');
    return NextResponse.json(
      { status: false, error: "No roles found" },
      { status: 404 }
    );

  } catch (error) {
    logMessage('error', 'Error fetching roles:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
