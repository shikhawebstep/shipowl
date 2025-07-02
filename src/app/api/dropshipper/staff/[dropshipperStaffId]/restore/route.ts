import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperStaffById, restoreDropshipperStaff } from '@/app/models/dropshipper/staff';

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const dropshipperStaffId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperStaffId });

    // Get headers
    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperIdHeaderNum = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperIdHeaderNum)) {
      logMessage('warn', 'Invalid or missing dropshipper ID header', { dropshipperIdHeaderNum, dropshipperRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if dropshipper exists
    const userCheck = await isUserExist(dropshipperIdHeaderNum, String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperIdHeaderNum, dropshipperRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (!dropshipperStaffResult?.status) {
      logMessage('warn', `Dropshipper Staff not found: ${dropshipperStaffResult.message}`, { dropshipperStaffId });
      return NextResponse.json({ error: `Dropshipper Staff not found: ${dropshipperStaffResult.message}` }, { status: 404 });
    }

    // Restore the dropshipper (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreDropshipperStaff(dropshipperIdHeaderNum, String(dropshipperRole), Number(dropshipperStaffId));

    if (restoreResult?.status) {
      logMessage('info', 'Dropshipper restored successfully:', restoreResult.restoredDropshipperStaff);
      return NextResponse.json({ status: true, dropshipper: restoreResult.restoredDropshipperStaff, message: 'Dropshipper Staff restored successfully' }, { status: 200 });
    }

    logMessage('error', 'Dropshipper restore failed');
    return NextResponse.json({ status: false, error: 'Dropshipper restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Dropshipper restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
