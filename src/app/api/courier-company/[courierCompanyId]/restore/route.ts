import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCourierCompanyById, restoreCourierCompany } from '@/app/models/courierCompany';

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

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const courierCompanyId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete CourierCompany Request:', { courierCompanyId });

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
          action: 'Permanent Delete',
          data: restoreResult,
          response: { status: true, courierCompany: restoreResult.restoredCourierCompany },
          status: false
        }, req);

      logMessage('info', 'CourierCompany restored successfully:', restoreResult.restoredCourierCompany);
      return NextResponse.json({ status: true, courierCompany: restoreResult.restoredCourierCompany }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Courier Company',
        action: 'Permanent Delete',
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
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', '❌ CourierCompany restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
