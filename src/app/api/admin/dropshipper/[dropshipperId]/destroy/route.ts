import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById, deleteDropshipper } from '@/app/models/dropshipper/dropshipper';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const dropshipperId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Dropshipper',
        action: 'Permanent Delete',
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
      logMessage('info', `Dropshipper permanently deleted successfully: ${dropshipperIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Dropshipper permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Dropshipper not found or could not be deleted: ${dropshipperIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Dropshipper not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during dropshipper deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

