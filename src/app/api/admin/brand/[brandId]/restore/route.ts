import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getBrandById, restoreBrand } from '@/app/models/admin/brand';
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
    const brandId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Brand Request:', { brandId });

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
    //  let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      //  mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      const options = {
        panel: 'Admin',
        module: 'Brand',
        action: 'restore',
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

    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID', { brandId });
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    logMessage('debug', 'Brand fetch result:', brandResult);
    if (!brandResult?.status) {
      logMessage('warn', 'Brand not found', { brandIdNum });
      return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
    }

    // Restore the brand (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreBrand(adminId, String(adminRole), brandIdNum);

    if (restoreResult?.status) {

      await ActivityLog(
        {
          module: 'Brand',
          action: 'Update',
          data: restoreResult,
          response: { status: true, brand: restoreResult.restoredBrand },
          status: true
        }, req);

      logMessage('info', 'Brand restored successfully:', restoreResult.restoredBrand);
      return NextResponse.json({ status: true, brand: restoreResult.restoredBrand }, { status: 200 });
    }

    await ActivityLog(
      {
        module: 'Brand',
        action: 'Update',
        data: restoreResult,
        response: { status: false, error: 'Brand restore failed' },
        status: false
      }, req);

    logMessage('error', 'Brand restore failed');
    return NextResponse.json({ status: false, error: 'Brand restore failed' }, { status: 500 });

  } catch (error) {
    await ActivityLog(
      {
        module: 'Brand',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ Brand restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
