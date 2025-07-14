import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getStaffPermissions } from '@/app/models/staffPermission';

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
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const options = {
      panel: 'Admin',
    };

    const staffPermissionsResult = await getStaffPermissions(options);
    logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

    if (!staffPermissionsResult.status) {
      logMessage('warn', 'No active staff permissions found');
      return NextResponse.json(
        { status: false, message: staffPermissionsResult.message, error: "No active staff permissions found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, staffPermissions: staffPermissionsResult.staffPermissions },
      { status: 200 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching admins:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}