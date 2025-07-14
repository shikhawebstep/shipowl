import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createHighRto, getHighRtosByStatus, getHighRtoByPincode } from '@/app/models/highRto';
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
    logMessage('debug', 'POST request received for highRto creation');

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'High RTO',
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

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const pincode = extractString('pincode');

    const getHighRtoByPincodeResult = await getHighRtoByPincode(pincode || '');

    if (getHighRtoByPincodeResult?.status) {
      logMessage('warn', 'HighRto already exists:', getHighRtoByPincodeResult?.message || 'Unknown error');
      return NextResponse.json(
        { status: false, error: getHighRtoByPincodeResult?.message || 'HighRto already exists' },
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
      createdBy: adminId,
      createdByRole: adminRole || '',
    };

    logMessage('info', 'HighRto payload created:', highRtoPayload);

    const highRtoCreateResult = await createHighRto(adminId, String(adminRole), highRtoPayload);

    if (highRtoCreateResult?.status) {
      return NextResponse.json({ status: true, highRto: highRtoCreateResult.highRto }, { status: 200 });
    }

    logMessage('error', 'HighRto creation failed:', highRtoCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: highRtoCreateResult?.message || 'HighRto creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'HighRto Creation Error:', error);
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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;
      
      const options = {
        panel: 'Admin',
        module: 'High RTO',
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

    // Fetch highRtos based on filters
    const highRtosResult = await getHighRtosByStatus('notDeleted');

    // Handle response based on highRtos result
    if (highRtosResult?.status) {
      return NextResponse.json(
        { status: true, highRtos: highRtosResult.highRtos },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No highRtos found' },
      { status: 404 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Error while fetching highRtos', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch highRtos due to an internal error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};