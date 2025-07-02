import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getGoodPincodeById, updateGoodPincode, softDeleteGoodPincode, restoreGoodPincode, getGoodPincodeByPincodeForUpdate } from '@/app/models/goodPincode';
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
    // Extract goodPincodeId directly from the URL path
    const goodPincodeId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested GoodPincode ID:', goodPincodeId);

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
        module: 'Good Pincode',
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

    const goodPincodeIdNum = Number(goodPincodeId);
    if (isNaN(goodPincodeIdNum)) {
      logMessage('warn', 'Invalid goodPincode ID', { goodPincodeId });
      return NextResponse.json({ error: 'Invalid goodPincode ID' }, { status: 400 });
    }

    const goodPincodeResult = await getGoodPincodeById(goodPincodeIdNum);
    if (goodPincodeResult?.status) {
      logMessage('info', 'GoodPincode found:', goodPincodeResult.goodPincode);
      return NextResponse.json({ status: true, goodPincode: goodPincodeResult.goodPincode }, { status: 200 });
    }

    logMessage('info', 'GoodPincode found:', goodPincodeResult.goodPincode);
    return NextResponse.json({ status: false, message: 'GoodPincode not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single goodPincode:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract goodPincodeId directly from the URL path
    const goodPincodeId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested GoodPincode ID:', goodPincodeId);

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
        module: 'Good Pincode',
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

    // Extract fields
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const pincode = extractString('pincode');

    const getGoodPincodeByPincodeForUpdateResult = await getGoodPincodeByPincodeForUpdate(pincode || '', goodPincodeIdNum);

    if (!getGoodPincodeByPincodeForUpdateResult?.status) {
      logMessage('warn', 'GoodPincode already exists:', getGoodPincodeByPincodeForUpdateResult?.message || 'Unknown error');
      return NextResponse.json(
        { status: false, error: getGoodPincodeByPincodeForUpdateResult?.message || 'GoodPincode already exists' },
        { status: 400 }
      );
    }

    const goodPincodePayload = {
      pincode: pincode || '',
      status,
      updatedBy: adminId,
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'GoodPincode payload:', goodPincodePayload);

    const goodPincodeCreateResult = await updateGoodPincode(adminId, String(adminRole), goodPincodeIdNum, goodPincodePayload);

    if (goodPincodeCreateResult?.status) {
      logMessage('info', 'GoodPincode updated successfully:', goodPincodeCreateResult.goodPincode);
      return NextResponse.json({ status: true, goodPincode: goodPincodeCreateResult.goodPincode }, { status: 200 });
    }

    logMessage('error', 'GoodPincode update failed', goodPincodeCreateResult?.message);
    return NextResponse.json(
      { status: false, error: goodPincodeCreateResult?.message || 'GoodPincode creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ GoodPincode Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract goodPincodeId directly from the URL path
    const goodPincodeId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested GoodPincode ID:', goodPincodeId);

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
      logMessage('info', 'GoodPincode restored successfully:', restoreResult.restoredGoodPincode);
      return NextResponse.json({ status: true, goodPincode: restoreResult.restoredGoodPincode }, { status: 200 });
    }

    logMessage('error', 'GoodPincode restore failed');
    return NextResponse.json({ status: false, error: 'GoodPincode restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ GoodPincode restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract goodPincodeId directly from the URL path
    const goodPincodeId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete GoodPincode Request:', { goodPincodeId });

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
        module: 'Good Pincode',
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

    // Validate goodPincode ID
    const goodPincodeIdNum = Number(goodPincodeId);
    if (isNaN(goodPincodeIdNum)) {
      logMessage('warn', 'Invalid goodPincode ID format', { goodPincodeId });
      return NextResponse.json({ error: 'GoodPincode ID is invalid' }, { status: 400 });
    }

    const goodPincodeResult = await getGoodPincodeById(goodPincodeIdNum);
    if (!goodPincodeResult?.status) {
      logMessage('warn', 'GoodPincode not found', { goodPincodeIdNum });
      return NextResponse.json({ status: false, message: 'GoodPincode not found' }, { status: 404 });
    }

    const result = await softDeleteGoodPincode(Number(adminId), String(adminRole), goodPincodeIdNum);  // Assuming softDeleteGoodPincode marks the goodPincode as deleted
    logMessage('info', `Soft delete request for goodPincode: ${goodPincodeIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `GoodPincode soft deleted successfully: ${goodPincodeIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `GoodPincode soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `GoodPincode not found or could not be deleted: ${goodPincodeIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'GoodPincode not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during goodPincode deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};