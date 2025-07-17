import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { getCourierCompanyById, checkCodeAvailabilityForUpdate, updateCourierCompany, softDeleteCourierCompany, restoreCourierCompany } from '@/app/models/courierCompany';

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
    // Extract courierCompanyId directly from the URL path
    const courierCompanyId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested CourierCompany ID:', courierCompanyId);

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

    const courierCompanyIdNum = Number(courierCompanyId);
    if (isNaN(courierCompanyIdNum)) {
      logMessage('warn', 'Invalid courierCompany ID', { courierCompanyId });
      return NextResponse.json({ error: 'Invalid courierCompany ID' }, { status: 400 });
    }

    const courierCompanyResult = await getCourierCompanyById(courierCompanyIdNum);
    if (courierCompanyResult?.status) {
      logMessage('info', 'CourierCompany found:', courierCompanyResult.courierCompany);
      return NextResponse.json({ status: true, courierCompany: courierCompanyResult.courierCompany }, { status: 200 });
    }

    logMessage('info', 'CourierCompany found:', courierCompanyResult.courierCompany);
    return NextResponse.json({ status: false, message: 'CourierCompany not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single courierCompany:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract courierCompanyId directly from the URL path
    const courierCompanyId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested CourierCompany ID:', courierCompanyId);

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
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const courierCompanyIdNum = Number(courierCompanyId);
    if (isNaN(courierCompanyIdNum)) {
      logMessage('warn', 'Invalid courierCompany ID', { courierCompanyId });
      return NextResponse.json({ error: 'Invalid courierCompany ID' }, { status: 400 });
    }

    const courierCompanyResult = await getCourierCompanyById(courierCompanyIdNum);
    logMessage('debug', 'CourierCompany fetch result:', courierCompanyResult);
    if (!courierCompanyResult?.status) {
      logMessage('warn', 'CourierCompany not found', { courierCompanyIdNum });
      return NextResponse.json({ status: false, message: 'CourierCompany not found' }, { status: 404 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || null;
    const extractString = (key: string) => (formData.get(key) as string) || null;

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name', 'email'],
      patternValidations: {
        status: 'boolean',
      },
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

    const code = extractString('code') || '';
    const { status: checkCodeAvailabilityResult, message: checkCodeAvailabilityMessage } = await checkCodeAvailabilityForUpdate(code, courierCompanyIdNum);

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
      updatedBy: adminId,
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'CourierCompany payload:', courierCompanyPayload);

    const courierCompanyCreateResult = await updateCourierCompany(adminId, String(adminRole), courierCompanyIdNum, courierCompanyPayload);

    if (courierCompanyCreateResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Courier Company',
          action: 'Update',
          data: courierCompanyCreateResult,
          response: { status: true, courierCompany: courierCompanyCreateResult.courierCompany },
          status: true
        }, req);

      logMessage('info', 'CourierCompany updated successfully:', courierCompanyCreateResult.courierCompany);
      return NextResponse.json({ status: true, courierCompany: courierCompanyCreateResult.courierCompany }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Update',
        data: courierCompanyCreateResult,
        response: { status: false, error: courierCompanyCreateResult?.message || 'CourierCompany creation failed' },
        status: false
      }, req);

    logMessage('error', 'CourierCompany update failed', courierCompanyCreateResult?.message);
    return NextResponse.json(
      { status: false, error: courierCompanyCreateResult?.message || 'CourierCompany creation failed' },
      { status: 500 }
    );
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ CourierCompany Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract courierCompanyId directly from the URL path
    const courierCompanyId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested CourierCompany ID:', courierCompanyId);

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
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const courierCompanyIdNum = Number(courierCompanyId);
    if (isNaN(courierCompanyIdNum)) {
      logMessage('warn', 'Invalid courierCompany ID', { courierCompanyId });
      return NextResponse.json({ error: 'Invalid courierCompany ID' }, { status: 400 });
    }

    const courierCompanyResult = await getCourierCompanyById(courierCompanyIdNum);
    logMessage('debug', 'CourierCompany fetch result:', courierCompanyResult);
    if (!courierCompanyResult?.status) {
      logMessage('warn', 'CourierCompany not found', { courierCompanyIdNum });
      return NextResponse.json({ status: false, message: 'CourierCompany not found' }, { status: 404 });
    }

    // Restore the courierCompany (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreCourierCompany(adminId, String(adminRole), courierCompanyIdNum);

    if (restoreResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Courier Company',
          action: 'Restore',
          data: restoreResult,
          response: { status: true, courierCompany: restoreResult.restoredCourierCompany },
          status: true
        }, req);

      logMessage('info', 'CourierCompany restored successfully:', restoreResult.restoredCourierCompany);
      return NextResponse.json({ status: true, courierCompany: restoreResult.restoredCourierCompany }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Restore',
        data: restoreResult,
        response: { status: false, error: 'CourierCompany restore failed' },
        status: false
      }, req);

    logMessage('error', 'CourierCompany restore failed');
    return NextResponse.json({ status: false, error: 'CourierCompany restore failed' }, { status: 500 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Restore',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ CourierCompany restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract courierCompanyId directly from the URL path
    const courierCompanyId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete CourierCompany Request:', { courierCompanyId });

    // Extract admin ID and role from headers
    const adminId = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate courierCompany ID
    const courierCompanyIdNum = Number(courierCompanyId);
    if (isNaN(courierCompanyIdNum)) {
      logMessage('warn', 'Invalid courierCompany ID format', { courierCompanyId });
      return NextResponse.json({ error: 'CourierCompany ID is invalid' }, { status: 400 });
    }

    const courierCompanyResult = await getCourierCompanyById(courierCompanyIdNum);
    if (!courierCompanyResult?.status) {
      logMessage('warn', 'CourierCompany not found', { courierCompanyIdNum });
      return NextResponse.json({ status: false, message: 'CourierCompany not found' }, { status: 404 });
    }

    const result = await softDeleteCourierCompany(Number(adminId), String(adminRole), courierCompanyIdNum);  // Assuming softDeleteCourierCompany marks the courierCompany as deleted
    logMessage('info', `Soft delete request for courierCompany: ${courierCompanyIdNum}`, { adminId });

    if (result?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Courier Company',
          action: 'Soft Delete',
          data: result,
          response: { status: true, message: `CourierCompany soft deleted successfully` },
          status: false
        }, req);

      logMessage('info', `CourierCompany soft deleted successfully: ${courierCompanyIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `CourierCompany soft deleted successfully` }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Soft Delete',
        data: result,
        response: { status: false, message: 'CourierCompany not found or deletion failed' },
        status: false
      }, req);

    logMessage('info', `CourierCompany not found or could not be deleted: ${courierCompanyIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'CourierCompany not found or deletion failed' }, { status: 404 });
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Soft Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Error during courierCompany deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};