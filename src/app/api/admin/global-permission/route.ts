import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getAllGlobalPermissions, updateGlobalPermissions } from '@/app/models/admin/globalPermission';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainAdmin {
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
  role: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: DropshipperStaff;
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching admins');

    // Retrieve x-admin-id and x-admin-role from request headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    logMessage('info', 'Admin ID and Role:', { adminIdHeader, adminRole });
    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
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

    const isStaffUser = !['admin', 'dropshipper', 'dropshipper'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      
      const options = {
        panel: 'Admin',
        module: 'Global Permission',
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

    // Fetch all admins
    const adminsResult = await getAllGlobalPermissions();

    if (adminsResult?.status) {
      return NextResponse.json(
        { status: true, permissions: adminsResult.permissions },
        { status: 200 }
      );
    }

    logMessage('warn', 'No permissions found');
    return NextResponse.json(
      { status: false, error: "No permissions found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching admins:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    logMessage('debug', 'PUT request received for updating admin permissions (FormData)');

    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    logMessage('info', 'Admin ID and Role:', { adminIdHeader, adminRole });

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Validate admin user
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'dropshipper'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      
      const options = {
        panel: 'Admin',
        module: 'Global Permission',
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

    // Parse FormData from request
    const formData = await req.formData();
    const permissionsRaw = formData.get('permissions');

    let permissions: { permissionId: number; status: boolean }[] = [];

    if (typeof permissionsRaw === 'string') {
      try {
        permissions = JSON.parse(permissionsRaw);
      } catch (e) {
        console.error('Failed to parse permissions JSON:', e);
      }
    } else {
      console.warn('permissions field not found or is not a string');
    }

    if (permissions.length === 0) {
      logMessage('warn', 'No permissions found in form data');
      return NextResponse.json(
        { status: false, error: 'No permissions provided' },
        { status: 400 }
      );
    }

    const adminPermissionPayload = {
      adminId,
      permissions,
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    }

    // Update permissions
    const updateResult = await updateGlobalPermissions(adminId, String(adminRole), adminPermissionPayload);

    if (updateResult?.status) {
      return NextResponse.json(
        { status: true, message: 'Permissions updated successfully' },
        { status: 200 }
      );
    }

    logMessage('warn', 'Permission update failed');
    return NextResponse.json(
      { status: false, error: 'Failed to update permissions' },
      { status: 500 }
    );

  } catch (error) {
    logMessage('error', 'Error updating admin permissions:', error);
    return NextResponse.json(
      { status: false, error: 'Internal server error while updating permissions' },
      { status: 500 }
    );
  }
}