import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierStaffPermissionsByStatus } from '@/app/models/supplier/permission';


export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching suppliers');

    // Retrieve x-supplier-id and x-supplier-role from request headers
    const supplierIdHeader = req.headers.get("x-admin-id");
    const supplierRole = req.headers.get("x-admin-role");

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

    // Fetch all suppliers
    const suppliersResult = await getSupplierStaffPermissionsByStatus("notDeleted");

    if (suppliersResult?.status) {
      return NextResponse.json(
        { status: true, permissions: suppliersResult.permissions },
        { status: 200 }
      );
    }

    logMessage('warn', 'No permissions found');
    return NextResponse.json(
      { status: false, error: "No permissions found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching suppliers:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}