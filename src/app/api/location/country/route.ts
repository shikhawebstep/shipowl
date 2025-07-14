import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createCountry, getCountriesByStatus } from '@/app/models/location/country';
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
    logMessage('debug', 'POST request received for country creation');

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
        module: 'Country',
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
      createdAt: new Date(),
      createdBy: adminId,
      createdByRole: adminRole,
    };

    logMessage('info', 'Country payload created:', countryPayload);

    const countryCreateResult = await createCountry(adminId, String(adminRole), countryPayload);

    if (countryCreateResult?.status) {
      logMessage('info', 'Country created successfully:', countryCreateResult.country);
      return NextResponse.json({ status: true, message: "Country created successfully", country: countryCreateResult.country }, { status: 200 });
    }

    logMessage('error', 'Country creation failed:', countryCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: countryCreateResult?.message || 'Country creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Country Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET() {
  try {
    logMessage('debug', 'GET request received for fetching countries');

    // Fetch all countries
    const countriesResult = await getCountriesByStatus("notDeleted");

    if (countriesResult?.status) {
      return NextResponse.json(
        { status: true, countries: countriesResult.countries },
        { status: 200 }
      );
    }

    logMessage('warn', 'No countries found');
    return NextResponse.json(
      { status: false, error: "No countries found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching countries:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};