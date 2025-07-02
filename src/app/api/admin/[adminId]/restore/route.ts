import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getAdminById, restoreAdmin } from '@/app/models/admin/admin';

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const adminId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Admin Request:', { adminId });

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminIdHeaderNum = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminIdHeaderNum)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeaderNum, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck = await isUserExist(adminIdHeaderNum, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminIdHeaderNum, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const adminIdNum = Number(adminId);
    if (isNaN(adminIdNum)) {
      logMessage('warn', 'Invalid admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
    }

    const adminResult = await getAdminById(adminIdNum);
    logMessage('debug', 'Admin fetch result:', adminResult);
    if (!adminResult?.status) {
      logMessage('warn', 'Admin not found', { adminIdNum });
      return NextResponse.json({ status: false, message: 'Admin not found' }, { status: 404 });
    }

    // Restore the admin (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreAdmin(adminIdNum, String(adminRole), adminIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Admin restored successfully:', restoreResult.restoredAdmin);
      return NextResponse.json({ status: true, admin: restoreResult.restoredAdmin }, { status: 200 });
    }

    logMessage('error', 'Admin restore failed');
    return NextResponse.json({ status: false, error: 'Admin restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Admin restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
