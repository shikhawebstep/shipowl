import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperStaffById, deleteDropshipperStaff } from '@/app/models/dropshipper/staff';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const dropshipperStaffId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperStaffId });

    // Extract dropshipper ID and role from headers
    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    // Validate dropshipper ID
    if (!dropshipperIdHeader || isNaN(Number(dropshipperIdHeader))) {
      logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperIdHeader });
      return NextResponse.json({ error: 'Dropshipper ID is missing or invalid' }, { status: 400 });
    }

    // Check if the dropshipper user exists
    const userCheck = await isUserExist(Number(dropshipperIdHeader), String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `Dropshipper not found: ${userCheck.message}`, { dropshipperIdHeader, dropshipperRole });
      return NextResponse.json({ error: `Dropshipper not found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (!dropshipperStaffResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperStaffId });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteDropshipperStaff(Number(dropshipperStaffId));  // Assuming deleteDropshipper is for permanent deletion
    logMessage('info', `Permanent delete request for dropshipper: ${dropshipperStaffId}`, { dropshipperIdHeader });


    if (result?.status) {
      logMessage('info', `Dropshipper permanently deleted successfully: ${dropshipperStaffId}`, { dropshipperIdHeader });
      return NextResponse.json({ status: true, message: `Dropshipper permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Dropshipper not found or could not be deleted: ${dropshipperStaffId}`, { dropshipperIdHeader });
    return NextResponse.json({ status: false, message: 'Dropshipper not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during dropshipper deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

