import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getRolesByStatus } from '@/app/models/role';
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

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching roles');

    // Retrieve x-dropshipper-id and x-dropshipper-role from request headers
    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', `Invalid dropshipperIdHeader: ${dropshipperIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if dropshipper exists
    // let mainDropshipperId = dropshipperId;
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
        action: 'Trash Listing',
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

    // Fetch all roles
    const rolesResult = await getRolesByStatus("deleted");

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

