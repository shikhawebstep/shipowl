import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCourierCompanyById, deleteCourierCompany } from '@/app/models/courierCompany';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const courierCompanyId = parts[parts.length - 2]; // Get the second-to-last segment

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

    // Permanent delete operation
    const result = await deleteCourierCompany(courierCompanyIdNum);  // Assuming deleteCourierCompany is for permanent deletion
    logMessage('info', `Permanent delete request for courierCompany: ${courierCompanyIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `CourierCompany permanently deleted successfully: ${courierCompanyIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `CourierCompany permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `CourierCompany not found or could not be deleted: ${courierCompanyIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'CourierCompany not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during courierCompany deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

