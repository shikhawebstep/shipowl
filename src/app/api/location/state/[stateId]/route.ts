import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getStateById, updateState, softDeleteState, restoreState } from '@/app/models/location/state';
import { getCountryById } from '@/app/models/location/country';
import { getCountriesByStatus } from '@/app/models/location/country';
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

export async function GET(req: NextRequest) {
  try {
    // Extract stateId directly from the URL path
    const stateId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested State ID:', stateId);

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'State',
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

    const stateIdNum = Number(stateId);
    if (isNaN(stateIdNum)) {
      logMessage('warn', 'Invalid state ID', { stateId });
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const stateResult = await getStateById(stateIdNum);
    if (stateResult?.status) {
      logMessage('info', 'State found:', stateResult.state);

      // Fetch all countries
      const countriesResult = await getCountriesByStatus("notDeleted");

      if (!countriesResult?.status) {
        logMessage('warn', 'No countries found');
        return NextResponse.json(
          { status: false, message: 'No countries found' },
          { status: 404 }
        );
      }

      logMessage('info', 'Countries fetched successfully:', countriesResult.countries);
      return NextResponse.json(
        { status: true, state: stateResult.state, countries: countriesResult.countries },
        { status: 200 }
      );
    }

    logMessage('info', 'State found:', stateResult.state);
    return NextResponse.json({ status: false, message: 'State not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single state:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract stateId directly from the URL path
    const stateId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested State ID:', stateId);

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'State',
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

    const stateIdNum = Number(stateId);
    if (isNaN(stateIdNum)) {
      logMessage('warn', 'Invalid state ID', { stateId });
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const stateResult = await getStateById(stateIdNum);
    logMessage('debug', 'State fetch result:', stateResult);
    if (!stateResult?.status) {
      logMessage('warn', 'State not found', { stateIdNum });
      return NextResponse.json({ status: false, message: 'State not found' }, { status: 404 });
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
    const iso2 = (formData.get('iso2') as string) || '';
    const type = (formData.get('type') as string) || '';
    const countryId = Number(formData.get('country'));

    const countryIdNum = Number(countryId);

    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID', { countryId });
      return NextResponse.json({ error: 'Invalid country or state ID' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    logMessage('debug', 'Country fetch result:', countryResult);
    if (!countryResult?.status) {
      logMessage('warn', 'Country not found', { countryIdNum });
      return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
    }

    // Prepare the payload for state creation
    const statePayload = {
      name,
      iso2,
      type,
      country: {
        connect: {
          id: countryId,
        },
      },
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'State payload:', statePayload);

    const stateCreateResult = await updateState(adminId, String(adminRole), stateIdNum, statePayload);

    if (stateCreateResult?.status) {
      logMessage('info', 'State updated successfully:', stateCreateResult.state);
      return NextResponse.json({ status: true, message: "State updated successfully", state: stateCreateResult.state }, { status: 200 });
    }

    logMessage('error', 'State update failed', stateCreateResult?.message);
    return NextResponse.json(
      { status: false, error: stateCreateResult?.message || 'State creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ State Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract stateId directly from the URL path
    const stateId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested State ID:', stateId);

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'State',
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

    const stateIdNum = Number(stateId);
    if (isNaN(stateIdNum)) {
      logMessage('warn', 'Invalid state ID', { stateId });
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const stateResult = await getStateById(stateIdNum);
    logMessage('debug', 'State fetch result:', stateResult);
    if (!stateResult?.status) {
      logMessage('warn', 'State not found', { stateIdNum });
      return NextResponse.json({ status: false, message: 'State not found' }, { status: 404 });
    }

    // Restore the state (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreState(adminId, String(adminRole), stateIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'State restored successfully:', restoreResult.state);
      return NextResponse.json({ status: true, state: restoreResult.state }, { status: 200 });
    }

    logMessage('error', 'State restore failed');
    return NextResponse.json({ status: false, error: 'State restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ State restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract stateId directly from the URL path
    const stateId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete State Request:', { stateId });

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'State',
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

    // Validate state ID
    const stateIdNum = Number(stateId);
    if (isNaN(stateIdNum)) {
      logMessage('warn', 'Invalid state ID format', { stateId });
      return NextResponse.json({ error: 'State ID is invalid' }, { status: 400 });
    }

    const stateResult = await getStateById(stateIdNum);
    if (!stateResult?.status) {
      logMessage('warn', 'State not found', { stateIdNum });
      return NextResponse.json({ status: false, message: 'State not found' }, { status: 404 });
    }

    const result = await softDeleteState(Number(adminId), String(adminRole), stateIdNum);  // Assuming softDeleteState marks the state as deleted
    logMessage('info', `Soft delete request for state: ${stateIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `State soft deleted successfully: ${stateIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `State soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `State not found or could not be deleted: ${stateIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'State not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during state deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};