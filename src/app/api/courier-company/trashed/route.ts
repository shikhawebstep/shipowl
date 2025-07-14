import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getCourierCompaniesByStatus } from '@/app/models/courierCompany';

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
    logMessage('debug', 'GET request received for fetching courierCompanies');

    // Retrieve x-admin-id and x-admin-role from request headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    // Fetch all courierCompanies
    const courierCompaniesResult = await getCourierCompaniesByStatus("deleted");

    if (courierCompaniesResult?.status) {
      return NextResponse.json(
        { status: true, courierCompanies: courierCompaniesResult.courierCompanies },
        { status: 200 }
      );
    }

    logMessage('warn', 'No courierCompanies found');
    return NextResponse.json(
      { status: false, error: "No courierCompanies found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching courierCompanies:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch courierCompanies" },
      { status: 500 }
    );
  }
}

