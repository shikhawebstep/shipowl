import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { checkCodeAvailability, createCourierCompany, getCourierCompaniesByStatus } from '@/app/models/courierCompany';

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
    logMessage('debug', 'POST request received for courierCompany creation');

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const requiredFields = ['name', 'email'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: { status: 'boolean' },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || null;
    const extractString = (key: string) => (formData.get(key) as string) || null;

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const code = extractString('code') || '';
    const { status: checkCodeAvailabilityResult, message: checkCodeAvailabilityMessage } = await checkCodeAvailability(code);

    if (!checkCodeAvailabilityResult) {
      logMessage('warn', `SKU availability check failed: ${checkCodeAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkCodeAvailabilityMessage }, { status: 400 });
    }

    const courierCompanyPayload = {
      name: extractString('name') || '',
      code,
      website: extractString('website') || '',
      email: extractString('email') || '',
      phoneNumber: extractString('phoneNumber') || '',
      flatShippingRate: extractNumber('flatShippingRate') || null,
      rtoCharges: extractNumber('rtoCharges') || null,
      status,
      createdBy: adminId,
      createdByRole: adminRole || '',
    };

    logMessage('info', 'CourierCompany payload created:', courierCompanyPayload);

    const courierCompanyCreateResult = await createCourierCompany(adminId, String(adminRole), courierCompanyPayload);

    if (courierCompanyCreateResult?.status) {
      return NextResponse.json({ status: true, courierCompany: courierCompanyCreateResult.courierCompany }, { status: 200 });
    }

    logMessage('error', 'CourierCompany creation failed:', courierCompanyCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: courierCompanyCreateResult?.message || 'CourierCompany creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'CourierCompany Creation Error:', error);
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
    const userExistence = await isUserExist(adminId, String(adminRole));
    if (!userExistence.status) {
      logMessage('warn', 'Admin user not found', { adminId, adminRole });
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    // Fetch courierCompanies based on filters
    const courierCompaniesResult = await getCourierCompaniesByStatus('notDeleted');

    // Handle response based on courierCompanies result
    if (courierCompaniesResult?.status) {
      return NextResponse.json(
        { status: true, courierCompanies: courierCompaniesResult.courierCompanies },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No courierCompanies found' },
      { status: 404 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Error while fetching courierCompanies', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch courierCompanies due to an internal error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};