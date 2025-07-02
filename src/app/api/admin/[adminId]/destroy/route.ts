import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getAdminById, deleteAdmin } from '@/app/models/admin/admin';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const adminId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Admin Request:', { adminId });

    // Extract admin ID and role from headers
    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminIdHeader || isNaN(Number(adminIdHeader))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminIdHeader });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminIdHeader), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminIdHeader, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate admin ID
    const adminIdNum = Number(adminId);
    if (isNaN(adminIdNum)) {
      logMessage('warn', 'Invalid admin ID format', { adminId });
      return NextResponse.json({ error: 'Admin ID is invalid' }, { status: 400 });
    }

    const adminResult = await getAdminById(adminIdNum);
    if (!adminResult?.status) {
      logMessage('warn', 'Admin not found', { adminIdNum });
      return NextResponse.json({ status: false, message: 'Admin not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteAdmin(adminIdNum);  // Assuming deleteAdmin is for permanent deletion
    logMessage('info', `Permanent delete request for admin: ${adminIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Admin permanently deleted successfully: ${adminIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Admin permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Admin not found or could not be deleted: ${adminIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Admin not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during admin deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 4' }, { status: 500 });
  }
}

