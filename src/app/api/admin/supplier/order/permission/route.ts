import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierOrderPermissions, updateSupplierOrderPermission } from '@/app/models/admin/supplier/order/permission';
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
    logMessage('debug', 'GET request received for fetching permissions');

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

    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Supplier Order Permission',
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

    const suppliersResult = await getSupplierOrderPermissions();
    if (suppliersResult?.status) {
      return NextResponse.json(
        { status: true, permissions: suppliersResult.permissions },
        { status: 200 }
      );
    }

    logMessage('warn', 'No permissions found');
    return NextResponse.json(
      { status: false, error: "No permissions found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching permissions:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for fetching suppliers');

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

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Supplier Order Permission',
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

    // Parse JSON body to get permissions array
    const formData = await req.formData();
    const rawPermissions = formData.get('permissions');

    if (typeof rawPermissions !== 'string') {
      return NextResponse.json(
        { status: false, error: "Permissions must be a JSON string" },
        { status: 400 }
      );
    }

    // Now parse the JSON string safely
    let permissionsObj: Record<string, boolean> = {};

    try {
      permissionsObj = JSON.parse(rawPermissions);
    } catch (error) {
      return NextResponse.json(
        { status: false, message: error },
        { status: 400 }
      );
    }

    // permissionsObj should now be an object like { "0": true, "1": false, ... }
    const cleanedPermissions = Object.entries(permissionsObj)
      .map(([key, value]) => ({
        permissionIndex: key,
        status:
          value === true ||
          (typeof value === 'string' && value === 'true') ||
          (typeof value === 'number' && value === 1)

      }))
      .filter(perm => perm.permissionIndex && typeof perm.status === 'boolean');

    logMessage('info', 'Cleaned Permissions:', cleanedPermissions);

    const permissionPayload = {
      adminId,
      adminRole,
      permissions: cleanedPermissions
    };

    logMessage('info', 'Brand payload created:', permissionPayload);

    const updateSupplierOrderPermissionResult = await updateSupplierOrderPermission(adminId, String(adminRole), permissionPayload);

    if (updateSupplierOrderPermissionResult?.status) {
      return NextResponse.json({ status: true }, { status: 200 });
    }

    // Continue your logic with cleanedPermissions...

    return NextResponse.json({ status: true, data: cleanedPermissions });

  } catch (error) {
    logMessage('error', 'Error processing request:', error);
    return NextResponse.json(
      { status: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
