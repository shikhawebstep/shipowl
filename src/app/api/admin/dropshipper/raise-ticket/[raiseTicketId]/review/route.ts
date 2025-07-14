import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getRaiseTicketById, adminReviewRaiseTicket } from '@/app/models/admin/dropshipper/raiseTicket';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
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

export async function POST(req: NextRequest) {
  try {
    // ✅ Extract raiseTicketId from URL
    const pathParts = req.nextUrl.pathname.split('/');
    const raiseTicketIdRaw = pathParts[pathParts.length - 2];

    const raiseTicketId = Number(raiseTicketIdRaw);
    if (isNaN(raiseTicketId)) {
      logMessage('warn', 'Invalid raiseTicketId in URL', { raiseTicketIdRaw });
      return NextResponse.json({ status: false, error: 'Invalid raise ticket ID' }, { status: 400 });
    }

    logMessage('debug', 'Raise Ticket ID extracted:', { raiseTicketId });

    // ✅ Parse and normalize status
    const body = await req.json();
    const statusRaw = body?.status?.toString().toLowerCase();
    const status = ['true', '1', 'active', 'accept', 'accepted', 'approve', 'approved'].includes(statusRaw);

    // ✅ Extract and validate headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role") || '';

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Missing or invalid admin ID header', { adminIdHeader });
      return NextResponse.json({ status: false, error: "Admin ID is missing or invalid" }, { status: 400 });
    }

    // ✅ Validate admin user existence
    const userCheck: UserCheckResult = await isUserExist(adminId, adminRole);
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    // ✅ Check staff permissions (if role is not super admin/dropshipper/supplier)
    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(adminRole.toLowerCase());
    if (isStaff) {
      const permissionOptions = {
        panel: 'Admin',
        module: 'Dropshipper',
        action: 'Bank Account Change Request Review',
      };

      const permissionCheck = await checkStaffPermissionStatus(permissionOptions, adminId);
      logMessage('info', 'Staff permission check result:', permissionCheck);

      if (!permissionCheck.status) {
        return NextResponse.json(
          {
            status: false,
            message: permissionCheck.message || "Permission denied to perform this action."
          },
          { status: 403 }
        );
      }
    }

    // ✅ Fetch raise ticket details
    const raiseTicketResult = await getRaiseTicketById({ id: raiseTicketId });

    if (!raiseTicketResult.status || !raiseTicketResult.raiseTicket) {
      logMessage('warn', 'Raise ticket not found', { raiseTicketId });
      return NextResponse.json({ status: false, error: 'Raise ticket not found' }, { status: 404 });
    }

    const raiseTicket = raiseTicketResult.raiseTicket;

    if (raiseTicket.status !== null) {
      const message = raiseTicket.status
        ? 'Raise ticket already accepted'
        : 'Raise ticket already rejected';

      return NextResponse.json(
        { status: false, error: message },
        { status: 400 }
      );
    }

    const adminReviewRaiseTicketPayload = {
      status,
      responder: {
        connect: {
          id: adminId,
        }
      },
      responseByRole: adminRole,
      responseAt: new Date(),
    };

    // ✅ Fetch raise ticket details
    const adminReviewRaiseTicketResult = await adminReviewRaiseTicket(raiseTicketId, adminReviewRaiseTicketPayload);

    if (!adminReviewRaiseTicketResult.status || !adminReviewRaiseTicketResult.raiseTicket) {
      logMessage('warn', 'Raise ticket not found', { raiseTicketId });
      return NextResponse.json({ status: false, error: 'Raise ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      message: `Raise ticket ${status ? 'approved' : 'rejected'} successfully.`,
      data: raiseTicket
    });

  } catch (error) {
    logMessage('error', '❌ Error in Bank Account Change Review API:', error);
    return NextResponse.json({ status: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
