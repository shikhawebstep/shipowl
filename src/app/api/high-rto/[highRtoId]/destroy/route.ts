import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getHighRtoById, deleteHighRto } from '@/app/models/highRto';
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
  role: string;
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
    const highRtoId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete HighRto Request:', { highRtoId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      
      const options = {
        panel: 'Admin',
        module: 'High RTO',
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

    // Validate highRto ID
    const highRtoIdNum = Number(highRtoId);
    if (isNaN(highRtoIdNum)) {
      logMessage('warn', 'Invalid highRto ID format', { highRtoId });
      return NextResponse.json({ error: 'HighRto ID is invalid' }, { status: 400 });
    }

    const highRtoResult = await getHighRtoById(highRtoIdNum);
    if (!highRtoResult?.status) {
      logMessage('warn', 'HighRto not found', { highRtoIdNum });
      return NextResponse.json({ status: false, message: 'HighRto not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteHighRto(highRtoIdNum);  // Assuming deleteHighRto is for permanent deletion
    logMessage('info', `Permanent delete request for highRto: ${highRtoIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `HighRto permanently deleted successfully: ${highRtoIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `HighRto permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `HighRto not found or could not be deleted: ${highRtoIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'HighRto not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during highRto deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

