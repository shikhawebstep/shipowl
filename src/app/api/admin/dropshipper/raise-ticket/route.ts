import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getRaiseTicketsList } from '@/app/models/admin/dropshipper/raiseTicket';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface AdminStaff {
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
  admin?: AdminStaff;
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for Raise Ticket list');

    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid" },
        { status: 400 }
      );
    }

    let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier'].includes(String(adminRole));
    if (isStaff) {
      mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const permissionCheck = await checkStaffPermissionStatus({
        panel: 'Admin',
        module: 'raise-ticket',
        action: 'Read',
      }, adminId);

      if (!permissionCheck.status) {
        return NextResponse.json(
          { status: false, message: permissionCheck.message || "Permission denied" },
          { status: 403 }
        );
      }
    }

    // Optional: handle pagination
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    // Optional: handle filtering (you can expand this)
    const search = searchParams.get('search') || '';

    // Assuming this function is implemented in your models
    const result = await getRaiseTicketsList({
      search,
      page,
      limit
    });

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message || "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Raise Tickets fetched successfully",
      data: result.data
    });

  } catch (error) {
    logMessage('error', 'Raise Ticket List Error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal Server Error', error },
      { status: 500 }
    );
  }
}