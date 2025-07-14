import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getCountryById, updateCountry, softDeleteCountry, restoreCountry } from '@/app/models/location/country';
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

export async function GET(req: NextRequest) {
  try {
    // Extract countryId directly from the URL path
    const countryId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Country ID:', countryId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
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
        action: 'View',
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

    const countryIdNum = Number(countryId);
    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID', { countryId });
      return NextResponse.json({ error: 'Invalid country ID' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    if (countryResult?.status) {
      logMessage('info', 'Country found:', countryResult.country);
      return NextResponse.json({ status: true, country: countryResult.country }, { status: 200 });
    }

    logMessage('info', 'Country found:', countryResult.country);
    return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single country:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract countryId directly from the URL path
    const countryId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Country ID:', countryId);

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
        module: 'Country',
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

    const countryIdNum = Number(countryId);
    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID', { countryId });
      return NextResponse.json({ error: 'Invalid country ID' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    logMessage('debug', 'Country fetch result:', countryResult);
    if (!countryResult?.status) {
      logMessage('warn', 'Country not found', { countryIdNum });
      return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
    }

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name'],
      patternValidations: {},
    });

    logMessage('debug', 'Form validation result:', validation);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    // Extract fields
    const name = formData.get('name') as string;
    const iso3 = (formData.get('iso3') as string) || '';
    const iso2 = (formData.get('iso2') as string) || '';
    const phonecode = (formData.get('phonecode') as string) || '';
    const currency = (formData.get('currency') as string) || '';
    const currencyName = (formData.get('currencyName') as string) || '';
    const currencySymbol = (formData.get('currencySymbol') as string) || '';
    const nationality = (formData.get('nationality') as string) || '';

    // Prepare the payload for country creation
    const countryPayload = {
      name,
      iso3,
      iso2,
      phonecode,
      currency,
      currencyName,
      currencySymbol,
      nationality,
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Country payload:', countryPayload);

    const countryCreateResult = await updateCountry(adminId, String(adminRole), countryIdNum, countryPayload);

    if (countryCreateResult?.status) {
      logMessage('info', 'Country updated successfully:', countryCreateResult.country);
      return NextResponse.json({ status: true, message: "Country updated successfully", country: countryCreateResult.country }, { status: 200 });
    }

    logMessage('error', 'Country update failed', countryCreateResult?.message);
    return NextResponse.json(
      { status: false, error: countryCreateResult?.message || 'Country creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ Country Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract countryId directly from the URL path
    const countryId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Country ID:', countryId);

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
        module: 'Country',
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

    const countryIdNum = Number(countryId);
    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID', { countryId });
      return NextResponse.json({ error: 'Invalid country ID' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    logMessage('debug', 'Country fetch result:', countryResult);
    if (!countryResult?.status) {
      logMessage('warn', 'Country not found', { countryIdNum });
      return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
    }

    // Restore the country (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreCountry(adminId, String(adminRole), countryIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Country restored successfully:', restoreResult.country);
      return NextResponse.json({ status: true, country: restoreResult.country }, { status: 200 });
    }

    logMessage('error', 'Country restore failed');
    return NextResponse.json({ status: false, error: 'Country restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Country restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract countryId directly from the URL path
    const countryId = req.nextUrl.pathname.split('/').pop();

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
        action: 'Soft Delete',
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

    const result = await softDeleteCountry(Number(adminId), String(adminRole), countryIdNum);  // Assuming softDeleteCountry marks the country as deleted
    logMessage('info', `Soft delete request for country: ${countryIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Country soft deleted successfully: ${countryIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Country soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Country not found or could not be deleted: ${countryIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Country not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during country deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};