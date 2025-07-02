import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getBadPincodeById, deleteBadPincode } from '@/app/models/badPincode';
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
    const badPincodeId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete BadPincode Request:', { badPincodeId });

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
        module: 'Bad Pincode',
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

    // Validate badPincode ID
    const badPincodeIdNum = Number(badPincodeId);
    if (isNaN(badPincodeIdNum)) {
      logMessage('warn', 'Invalid badPincode ID format', { badPincodeId });
      return NextResponse.json({ error: 'BadPincode ID is invalid' }, { status: 400 });
    }

    const badPincodeResult = await getBadPincodeById(badPincodeIdNum);
    if (!badPincodeResult?.status) {
      logMessage('warn', 'BadPincode not found', { badPincodeIdNum });
      return NextResponse.json({ status: false, message: 'BadPincode not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteBadPincode(badPincodeIdNum);  // Assuming deleteBadPincode is for permanent deletion
    logMessage('info', `Permanent delete request for badPincode: ${badPincodeIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `BadPincode permanently deleted successfully: ${badPincodeIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `BadPincode permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `BadPincode not found or could not be deleted: ${badPincodeIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'BadPincode not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during badPincode deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

