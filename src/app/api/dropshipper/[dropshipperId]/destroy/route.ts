import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById, deleteDropshipper } from '@/app/models/dropshipper/dropshipper';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const dropshipperId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperId });

    // Extract admin ID and role from headers
    const adminId = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate dropshipper ID
    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID format', { dropshipperId });
      return NextResponse.json({ error: 'Dropshipper ID is invalid' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    if (!dropshipperResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperIdNum });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteDropshipper(dropshipperIdNum);  // Assuming deleteDropshipper is for permanent deletion
    logMessage('info', `Permanent delete request for dropshipper: ${dropshipperIdNum}`, { adminId });

    if (result?.status) {
      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Profile',
          action: 'Delete',
          data: result,
          response: { status: true, message: `Dropshipper permanently deleted successfully` },
          status: true
        }, req);

      logMessage('info', `Dropshipper permanently deleted successfully: ${dropshipperIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Dropshipper permanently deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Profile',
        action: 'Delete',
        data: result,
        response: { status: false, message: 'Dropshipper not found or deletion failed' },
        status: false
      }, req);

    logMessage('info', `Dropshipper not found or could not be deleted: ${dropshipperIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Dropshipper not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Profile',
        action: 'Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Error during dropshipper deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

