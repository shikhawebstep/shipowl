import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createGoodPincode, getGoodPincodesByStatus, getGoodPincodeByPincode } from '@/app/models/goodPincode';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getPincodeDetails } from '@/utils/location/pincodeUtils';

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

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for goodPincode creation');

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

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
        action: 'Create',
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

    const requiredFields = ['pincode'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: { status: 'boolean' },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractString = (key: string) => (formData.get(key) as string) || null;

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active'].includes(statusRaw as string | number | boolean);

    const pincode = extractString('pincode');

    const getGoodPincodeByPincodeResult = await getGoodPincodeByPincode(pincode || '');
    logMessage(`log`, `getGoodPincodeByPincodeResult: `, getGoodPincodeByPincodeResult);
    if (getGoodPincodeByPincodeResult?.status) {
      logMessage('warn', 'GoodPincode already exists:', getGoodPincodeByPincodeResult?.message || 'Unknown error');
      return NextResponse.json(
        { status: false, error: getGoodPincodeByPincodeResult?.message || 'GoodPincode already exists' },
        { status: 400 }
      );
    }

    const {
      status: pincodeDetailStatus,
      postOffices,
      message: pincodeDetailMessage
    } = await getPincodeDetails(String(pincode));

    if (!pincodeDetailStatus || !postOffices || postOffices.length === 0) {
      logMessage('warn', 'Invalid or unrecognized pincode:', pincodeDetailMessage || 'No post offices found');
      return NextResponse.json(
        {
          status: false,
          message: `Invalid or unrecognized pincode (${pincode}). ${pincodeDetailMessage || ''}`,
        },
        { status: 400 }
      );
    }

    const goodPincodePayload = {
      pincode: pincode || '',
      status,
      createdBy: adminId,
      createdByRole: adminRole || '',
    };

    logMessage('info', 'GoodPincode payload created:', goodPincodePayload);

    const goodPincodeCreateResult = await createGoodPincode(adminId, String(adminRole), goodPincodePayload);

    if (goodPincodeCreateResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Good Pincode',
          action: 'Create',
          data: goodPincodeCreateResult,
          response: { status: true, goodPincode: goodPincodeCreateResult.goodPincode },
          status: true
        }, req);

      return NextResponse.json({ status: true, goodPincode: goodPincodeCreateResult.goodPincode }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Create',
        data: goodPincodeCreateResult,
        response: { status: false, error: goodPincodeCreateResult?.message || 'GoodPincode creation failed' },
        status: false
      }, req);

    logMessage('error', 'GoodPincode creation failed:', goodPincodeCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: goodPincodeCreateResult?.message || 'GoodPincode creation failed' },
      { status: 500 }
    );
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Create',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'GoodPincode Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {

    // Retrieve admin details from request headers
    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Log admin info
    logMessage('info', 'Admin details received', { adminIdHeader, adminRole });

    // Validate adminId
    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid admin ID received', { adminIdHeader });
      return NextResponse.json(
        { status: false, error: 'Invalid or missing admin ID' },
        { status: 400 }
      );
    }

    // Check if the admin exists
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
        action: 'View Listing',
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

    // Fetch goodPincodes based on filters
    const goodPincodesResult = await getGoodPincodesByStatus('notDeleted');

    // Handle response based on goodPincodes result
    if (goodPincodesResult?.status) {
      return NextResponse.json(
        { status: true, goodPincodes: goodPincodesResult.goodPincodes },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No goodPincodes found' },
      { status: 404 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Error while fetching goodPincodes', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch goodPincodes due to an internal error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};