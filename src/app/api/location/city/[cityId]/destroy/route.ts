import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCityById, deleteCity } from '@/app/models/location/city';
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
    const cityId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete City Request:', { cityId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
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
        module: 'City',
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

    // Validate city ID
    const cityIdNum = Number(cityId);
    if (isNaN(cityIdNum)) {
      logMessage('warn', 'Invalid city ID format', { cityId });
      return NextResponse.json({ error: 'City ID is invalid' }, { status: 400 });
    }

    const cityResult = await getCityById(cityIdNum);
    if (!cityResult?.status) {
      logMessage('warn', 'City not found', { cityIdNum });
      return NextResponse.json({ status: false, message: 'City not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteCity(cityIdNum);  // Assuming deleteCity is for permanent deletion
    logMessage('info', `Permanent delete request for city: ${cityIdNum}`, { adminId });


    if (result?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'City (Location)',
          action: 'Permanent Delete',
          data: result,
          response: { status: true, message: `City permanently deleted successfully` },
          status: true
        }, req);

      logMessage('info', `City permanently deleted successfully: ${cityIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `City permanently deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'City (Location)',
        action: 'Permanent Delete',
        data: result,
        response: { status: false, message: 'City not found or deletion failed' },
        status: false
      }, req);

    logMessage('info', `City not found or could not be deleted: ${cityIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'City not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'City (Location)',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Error during city deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

