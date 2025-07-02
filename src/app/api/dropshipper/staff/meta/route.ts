import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getStaffPermissions } from '@/app/models/staffPermission';

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching dropshippers');

    // Retrieve x-dropshipper-id and x-dropshipper-role from request headers
    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    logMessage('info', 'Dropshipper ID and Role:', { dropshipperIdHeader, dropshipperRole });
    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', `Invalid dropshipperIdHeader: ${dropshipperIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if dropshipper exists
    const result = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!result.status) {
      logMessage('warn', `User not found: ${result.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${result.message}` },
        { status: 404 }
      );
    }

    const options = {
      panel: 'Dropshipper',
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
    logMessage('error', 'Error fetching dropshippers:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch dropshippers" },
      { status: 500 }
    );
  }
}