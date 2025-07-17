import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCountryById, deleteCountry } from '@/app/models/location/country';
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
    const countryId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Country Request:', { countryId });

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
        module: 'Country',
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
    // Validate country ID
    const countryIdNum = Number(countryId);
    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID format', { countryId });
      return NextResponse.json({ error: 'Country ID is invalid' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    if (!countryResult?.status) {
      logMessage('warn', 'Country not found', { countryIdNum });
      return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteCountry(countryIdNum);  // Assuming deleteCountry is for permanent deletion
    logMessage('info', `Permanent delete request for country: ${countryIdNum}`, { adminId });


    if (result?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Country (Location)',
          action: 'Permanent Delete',
          data: result,
          response: { status: true, message: `Country permanently deleted successfully` },
          status: true
        }, req);

      logMessage('info', `Country permanently deleted successfully: ${countryIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Country permanently deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Country (Location)',
        action: 'Permanent Delete',
        data: result,
        response: { status: false, message: 'Country not found or deletion failed' },
        status: false
      }, req);

    logMessage('info', `Country not found or could not be deleted: ${countryIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Country not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Country (Location)',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Error during country deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

