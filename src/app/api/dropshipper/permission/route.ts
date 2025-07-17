import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperStaffPermissionsByStatus } from '@/app/models/dropshipper/permission';

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching dropshippers');

    // Retrieve x-dropshipper-id and x-dropshipper-role from request headers
    const dropshipperIdHeader = req.headers.get("x-admin-id");
    const dropshipperRole = req.headers.get("x-admin-role");

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

    // Fetch all dropshippers
    const dropshippersResult = await getDropshipperStaffPermissionsByStatus("notDeleted");

    if (dropshippersResult?.status) {
      return NextResponse.json(
        { status: true, permissions: dropshippersResult.permissions },
        { status: 200 }
      );
    }

    logMessage('warn', 'No permissions found');
    return NextResponse.json(
      { status: false, error: "No permissions found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching dropshippers:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch dropshippers" },
      { status: 500 }
    );
  }
}