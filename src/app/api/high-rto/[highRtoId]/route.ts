import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getHighRtoById, updateHighRto, softDeleteHighRto, restoreHighRto, getHighRtoByPincodeForUpdate } from '@/app/models/highRto';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
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
    // Extract highRtoId directly from the URL path
    const highRtoId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested HighRto ID:', highRtoId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

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

    const highRtoIdNum = Number(highRtoId);
    if (isNaN(highRtoIdNum)) {
      logMessage('warn', 'Invalid highRto ID', { highRtoId });
      return NextResponse.json({ error: 'Invalid highRto ID' }, { status: 400 });
    }

    const highRtoResult = await getHighRtoById(highRtoIdNum);
    if (highRtoResult?.status) {
      logMessage('info', 'HighRto found:', highRtoResult.highRto);
      return NextResponse.json({ status: true, highRto: highRtoResult.highRto }, { status: 200 });
    }

    logMessage('info', 'HighRto found:', highRtoResult.highRto);
    return NextResponse.json({ status: false, message: 'HighRto not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single highRto:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract highRtoId directly from the URL path
    const highRtoId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested HighRto ID:', highRtoId);

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
        module: 'High RTO',
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

    const highRtoIdNum = Number(highRtoId);
    if (isNaN(highRtoIdNum)) {
      logMessage('warn', 'Invalid highRto ID', { highRtoId });
      return NextResponse.json({ error: 'Invalid highRto ID' }, { status: 400 });
    }

    const highRtoResult = await getHighRtoById(highRtoIdNum);
    logMessage('debug', 'HighRto fetch result:', highRtoResult);
    if (!highRtoResult?.status) {
      logMessage('warn', 'HighRto not found', { highRtoIdNum });
      return NextResponse.json({ status: false, message: 'HighRto not found' }, { status: 404 });
    }

    const extractString = (key: string) => (formData.get(key) as string) || null;

    // Validate input
    const requiredFields = ['pincode'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: { status: 'boolean' },
    });

    logMessage('debug', 'Form data received:', formData);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const countryId = Number(formData.get('country'));
    const stateId = Number(formData.get('state'));
    const cityId = Number(formData.get('city'));

    const countryIdNum = Number(countryId);
    const stateIdNum = Number(stateId);
    const cityIdNum = Number(cityId);

    logMessage('debug', 'Extracted fields:', {
      cityIdNum,
      stateIdNum,
      countryIdNum
    });

    const isLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(cityIdNum, stateIdNum, countryIdNum);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectResult);
    if (!isLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    // Extract fields
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const pincode = extractString('pincode');

    const getHighRtoByPincodeForUpdateResult = await getHighRtoByPincodeForUpdate(pincode || '', highRtoIdNum);

    if (!getHighRtoByPincodeForUpdateResult?.status) {
      logMessage('warn', 'GoodPincode already exists:', getHighRtoByPincodeForUpdateResult?.message || 'Unknown error');
      return NextResponse.json(
        { status: false, error: getHighRtoByPincodeForUpdateResult?.message || 'GoodPincode already exists' },
        { status: 400 }
      );
    }

    const highRtoPayload = {
      pincode: pincode || '',
      city: {
        connect: {
          id: cityIdNum,
        },
      },
      state: {
        connect: {
          id: stateIdNum,
        },
      },
      country: {
        connect: {
          id: countryIdNum,
        },
      },
      status,
      updatedBy: adminId,
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'HighRto payload:', highRtoPayload);

    const highRtoCreateResult = await updateHighRto(adminId, String(adminRole), highRtoIdNum, highRtoPayload);

    if (highRtoCreateResult?.status) {
      logMessage('info', 'HighRto updated successfully:', highRtoCreateResult.highRto);
      return NextResponse.json({ status: true, highRto: highRtoCreateResult.highRto }, { status: 200 });
    }

    logMessage('error', 'HighRto update failed', highRtoCreateResult?.message);
    return NextResponse.json(
      { status: false, error: highRtoCreateResult?.message || 'HighRto creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ HighRto Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract highRtoId directly from the URL path
    const highRtoId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested HighRto ID:', highRtoId);

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
        module: 'High RTO',
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

    const highRtoIdNum = Number(highRtoId);
    if (isNaN(highRtoIdNum)) {
      logMessage('warn', 'Invalid highRto ID', { highRtoId });
      return NextResponse.json({ error: 'Invalid highRto ID' }, { status: 400 });
    }

    const highRtoResult = await getHighRtoById(highRtoIdNum);
    logMessage('debug', 'HighRto fetch result:', highRtoResult);
    if (!highRtoResult?.status) {
      logMessage('warn', 'HighRto not found', { highRtoIdNum });
      return NextResponse.json({ status: false, message: 'HighRto not found' }, { status: 404 });
    }

    // Restore the highRto (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreHighRto(adminId, String(adminRole), highRtoIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'HighRto restored successfully:', restoreResult.restoredHighRto);
      return NextResponse.json({ status: true, highRto: restoreResult.restoredHighRto }, { status: 200 });
    }

    logMessage('error', 'HighRto restore failed');
    return NextResponse.json({ status: false, error: 'HighRto restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ HighRto restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract highRtoId directly from the URL path
    const highRtoId = req.nextUrl.pathname.split('/').pop();

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

    const result = await softDeleteHighRto(Number(adminId), String(adminRole), highRtoIdNum);  // Assuming softDeleteHighRto marks the highRto as deleted
    logMessage('info', `Soft delete request for highRto: ${highRtoIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `HighRto soft deleted successfully: ${highRtoIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `HighRto soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `HighRto not found or could not be deleted: ${highRtoIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'HighRto not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during highRto deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};