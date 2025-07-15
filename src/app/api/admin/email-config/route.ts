import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getAllEmailConfig } from '@/app/models/admin/emailConfig';
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

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching mails');

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
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
        module: 'Mail',
        action: 'View Listing',
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
    
    // Fetch all mails
    const mailsResult = await getAllEmailConfig();

    if (mailsResult?.status) {
      return NextResponse.json(
        { status: true, mails: mailsResult.mails },
        { status: 200 }
      );
    }

    logMessage('warn', 'No mails found');
    return NextResponse.json(
      { status: false, error: "No mails found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching mails:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch mails" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
