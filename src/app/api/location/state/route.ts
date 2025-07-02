import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createState, getStatesByStatus } from '@/app/models/location/state';
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

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for state creation');

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
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
      createdAt: new Date(),
      createdBy: adminId,
      createdByRole: adminRole,
    };

    logMessage('info', 'State payload created:', statePayload);

    const stateCreateResult = await createState(adminId, String(adminRole), statePayload);

    if (stateCreateResult?.status) {
      logMessage('info', 'State created successfully:', stateCreateResult.state);
      return NextResponse.json({ status: true, message: "State created successfully", state: stateCreateResult.state }, { status: 200 });
    }

    logMessage('error', 'State creation failed:', stateCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: stateCreateResult?.message || 'State creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'State Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET() {
  try {
    logMessage('debug', 'GET request received for fetching states');

    // Fetch all countries
    const countriesResult = await getCountriesByStatus("notDeleted");

    if (!countriesResult?.status) {
      logMessage('warn', 'No countries found');
      return NextResponse.json(
        { status: false, error: "No countries found" },
        { status: 404 }
      );
    }

    // Fetch all states
    const statesResult = await getStatesByStatus("notDeleted");
    logMessage('info', 'States fetched successfully:', statesResult);
    if (statesResult?.status) {
      return NextResponse.json(
        { status: true, states: statesResult.states, countries: countriesResult.countries },
        { status: 200 }
      );
    }

    logMessage('warn', 'No states found');
    return NextResponse.json(
      { status: false, error: "No states found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching states:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch states" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};