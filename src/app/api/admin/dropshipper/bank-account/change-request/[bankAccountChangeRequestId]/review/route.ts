import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getBankAccountChangeRequestById, reviewBankAccountChangeRequest } from '@/app/models/dropshipper/bankAccount';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface DropshipperStaff {
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
  admin?: DropshipperStaff;
}

export async function POST(req: NextRequest) {
  try {
    // Extract bankAccountChangeRequestId from URL path
    const parts = req.nextUrl.pathname.split('/');
    const bankAccountChangeRequestId = parts[parts.length - 2]; // e.g., /api/admin/dropshipper/bank-account/change-request/123/review

    logMessage('debug', 'Bank Account Change Request ID extracted:', { bankAccountChangeRequestId });

    const { status } = await req.json();

    const statusRaw = status?.toString().toLowerCase();
    const finalStatus = ['true', '1', true, 1, 'active', 'accept', 'accepted', 'approve', 'approved'].includes(statusRaw);

    // Headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Validate admin
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      //  mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Dropshipper',
        action: 'Bank Account Change Request Review',
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

    const bankAccountChangeRequestIdNum = Number(bankAccountChangeRequestId);
    if (isNaN(bankAccountChangeRequestIdNum)) {
      logMessage('warn', 'Invalid bank account change request ID', { bankAccountChangeRequestId });
      return NextResponse.json({ status: false, error: 'Invalid request ID' }, { status: 400 });
    }

    // Fetch request by ID
    const requestResult = await getBankAccountChangeRequestById(bankAccountChangeRequestIdNum);
    logMessage('debug', 'Bank account change request fetch result:', requestResult);

    if (!requestResult?.status) {
      logMessage('warn', 'Bank account change request not found', { bankAccountChangeRequestIdNum });
      return NextResponse.json({ status: false, message: 'Request not found' }, { status: 404 });
    }

    // Perform review action (approve/reject)
    const reviewResult = await reviewBankAccountChangeRequest(adminId, String(adminRole), finalStatus, bankAccountChangeRequestIdNum);

    if (reviewResult?.status) {
      logMessage('info', 'Bank account change request review processed successfully:', reviewResult.message);
      return NextResponse.json({ status: true, message: reviewResult.message }, { status: 200 });
    }

    logMessage('error', 'Bank account change request review failed');
    return NextResponse.json({ status: false, error: 'Review operation failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Review API error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
