import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getBrandById, removeBrandImageByIndex } from '@/app/models/admin/brand';
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
    const brandId = Number(parts[parts.length - 3]);
    const imageIndex = Number(parts[parts.length - 1]);

    logMessage('debug', `Attempting to delete image (${imageIndex}) from brand (${brandId})`);

    // Validate admin headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Missing or invalid admin ID header', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Authenticate admin user
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
        action: 'Update',
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

    // Validate brand existence
    const brandResult = await getBrandById(brandId);
    if (!brandResult?.status) {
      logMessage('warn', 'Brand not found', { brandId });
      return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
    }

    // Perform image removal
    const result = await removeBrandImageByIndex(brandId, imageIndex);

    if (result.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Brand',
          action: 'Update',
          data: result,
          response: {
            status: true,
            message: 'Image removed successfully',
            data: result.brand,
          },
          status: true
        }, req);

      logMessage('info', `Image index ${imageIndex} removed from brand ${brandId} by admin ${adminId}`);
      return NextResponse.json({
        status: true,
        message: 'Image removed successfully',
        data: result.brand,
      }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Brand',
        action: 'Update',
        data: result,
        response: {
          status: false,
          message: result.message || 'Image removal failed',
        },
        status: false
      }, req);

    logMessage('warn', `Image removal failed: ${result.message}`, { brandId, imageIndex });
    return NextResponse.json({
      status: false,
      message: result.message || 'Image removal failed',
    }, { status: 400 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Brand',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: {
          status: false,
          error: 'Internal server error',
        },
        status: false
      }, req);

    logMessage('error', 'Unexpected error during image deletion', { error });
    return NextResponse.json({
      status: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
