import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getBadPincodeById, updateBadPincode, softDeleteBadPincode, restoreBadPincode } from '@/app/models/badPincode';
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
    // Extract badPincodeId directly from the URL path
    const badPincodeId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested BadPincode ID:', badPincodeId);

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
        module: 'Bad Pincode',
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


    const badPincodeIdNum = Number(badPincodeId);
    if (isNaN(badPincodeIdNum)) {
      logMessage('warn', 'Invalid badPincode ID', { badPincodeId });
      return NextResponse.json({ error: 'Invalid badPincode ID' }, { status: 400 });
    }

    const badPincodeResult = await getBadPincodeById(badPincodeIdNum);
    if (badPincodeResult?.status) {
      logMessage('info', 'BadPincode found:', badPincodeResult.badPincode);
      return NextResponse.json({ status: true, badPincode: badPincodeResult.badPincode }, { status: 200 });
    }

    logMessage('info', 'BadPincode found:', badPincodeResult.badPincode);
    return NextResponse.json({ status: false, message: 'BadPincode not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single badPincode:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract badPincodeId directly from the URL path
    const badPincodeId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested BadPincode ID:', badPincodeId);

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
        module: 'Bad Pincode',
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

    const badPincodeIdNum = Number(badPincodeId);
    if (isNaN(badPincodeIdNum)) {
      logMessage('warn', 'Invalid badPincode ID', { badPincodeId });
      return NextResponse.json({ error: 'Invalid badPincode ID' }, { status: 400 });
    }

    const badPincodeResult = await getBadPincodeById(badPincodeIdNum);
    logMessage('debug', 'BadPincode fetch result:', badPincodeResult);
    if (!badPincodeResult?.status) {
      logMessage('warn', 'BadPincode not found', { badPincodeIdNum });
      return NextResponse.json({ status: false, message: 'BadPincode not found' }, { status: 404 });
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

    const badPincodePayload = {
      pincode: extractString('pincode') || '',
      status,
      updatedBy: adminId,
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'BadPincode payload:', badPincodePayload);

    const badPincodeCreateResult = await updateBadPincode(adminId, String(adminRole), badPincodeIdNum, badPincodePayload);

    if (badPincodeCreateResult?.status) {
      logMessage('info', 'BadPincode updated successfully:', badPincodeCreateResult.badPincode);
      return NextResponse.json({ status: true, badPincode: badPincodeCreateResult.badPincode }, { status: 200 });
    }

    logMessage('error', 'BadPincode update failed', badPincodeCreateResult?.message);
    return NextResponse.json(
      { status: false, error: badPincodeCreateResult?.message || 'BadPincode creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ BadPincode Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract badPincodeId directly from the URL path
    const badPincodeId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested BadPincode ID:', badPincodeId);

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
        module: 'Bad Pincode',
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

    const badPincodeIdNum = Number(badPincodeId);
    if (isNaN(badPincodeIdNum)) {
      logMessage('warn', 'Invalid badPincode ID', { badPincodeId });
      return NextResponse.json({ error: 'Invalid badPincode ID' }, { status: 400 });
    }

    const badPincodeResult = await getBadPincodeById(badPincodeIdNum);
    logMessage('debug', 'BadPincode fetch result:', badPincodeResult);
    if (!badPincodeResult?.status) {
      logMessage('warn', 'BadPincode not found', { badPincodeIdNum });
      return NextResponse.json({ status: false, message: 'BadPincode not found' }, { status: 404 });
    }

    // Restore the badPincode (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreBadPincode(adminId, String(adminRole), badPincodeIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'BadPincode restored successfully:', restoreResult.restoredBadPincode);
      return NextResponse.json({ status: true, badPincode: restoreResult.restoredBadPincode }, { status: 200 });
    }

    logMessage('error', 'BadPincode restore failed');
    return NextResponse.json({ status: false, error: 'BadPincode restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ BadPincode restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract badPincodeId directly from the URL path
    const badPincodeId = req.nextUrl.pathname.split('/').pop();

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
        module: 'Product',
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

    const result = await softDeleteBadPincode(Number(adminId), String(adminRole), badPincodeIdNum);  // Assuming softDeleteBadPincode marks the badPincode as deleted
    logMessage('info', `Soft delete request for badPincode: ${badPincodeIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `BadPincode soft deleted successfully: ${badPincodeIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `BadPincode soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `BadPincode not found or could not be deleted: ${badPincodeIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'BadPincode not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during badPincode deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};