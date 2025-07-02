import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getStaffPermissions } from '@/app/models/staffPermission';

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching suppliers');

    // Retrieve x-supplier-id and x-supplier-role from request headers
    const supplierIdHeader = req.headers.get("x-supplier-id");
    const supplierRole = req.headers.get("x-supplier-role");

    logMessage('info', 'Supplier ID and Role:', { supplierIdHeader, supplierRole });
    const supplierId = Number(supplierIdHeader);
    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierIdHeader: ${supplierIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const result = await isUserExist(supplierId, String(supplierRole));
    if (!result.status) {
      logMessage('warn', `User not found: ${result.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${result.message}` },
        { status: 404 }
      );
    }

    const options = {
      panel: 'Supplier',
    };

    const staffPermissionsResult = await getStaffPermissions(options);
    logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

    if (!staffPermissionsResult.status) {
      logMessage('warn', 'No active staff permissions found');
      return NextResponse.json(
        { status: false, message: staffPermissionsResult.message, error: "No active staff permissions found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, staffPermissions: staffPermissionsResult.staffPermissions },
      { status: 200 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching suppliers:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}