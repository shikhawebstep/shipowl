import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getGoodPincodeById, restoreGoodPincode } from '@/app/models/goodPincode';
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

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const goodPincodeId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete GoodPincode Request:', { goodPincodeId });

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Restore',
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

    const goodPincodeIdNum = Number(goodPincodeId);
    if (isNaN(goodPincodeIdNum)) {
      logMessage('warn', 'Invalid goodPincode ID', { goodPincodeId });
      return NextResponse.json({ error: 'Invalid goodPincode ID' }, { status: 400 });
    }

    const goodPincodeResult = await getGoodPincodeById(goodPincodeIdNum);
    logMessage('debug', 'GoodPincode fetch result:', goodPincodeResult);
    if (!goodPincodeResult?.status) {
      logMessage('warn', 'GoodPincode not found', { goodPincodeIdNum });
      return NextResponse.json({ status: false, message: 'GoodPincode not found' }, { status: 404 });
    }

    // Restore the goodPincode (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreGoodPincode(adminId, String(adminRole), goodPincodeIdNum);

    if (restoreResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Good Pincode',
          action: 'Restore',
          data: restoreResult,
          response: { status: true, goodPincode: restoreResult.restoredGoodPincode },
          status: true
        }, req);

      logMessage('info', 'GoodPincode restored successfully:', restoreResult.restoredGoodPincode);
      return NextResponse.json({ status: true, goodPincode: restoreResult.restoredGoodPincode }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Restore',
        data: restoreResult,
        response: { status: false, error: 'GoodPincode restore failed' } ,
        status: false
      }, req);

    logMessage('error', 'GoodPincode restore failed');
    return NextResponse.json({ status: false, error: 'GoodPincode restore failed' }, { status: 500 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Restore',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ GoodPincode restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
