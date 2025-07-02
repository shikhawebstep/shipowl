import { NextRequest, NextResponse } from 'next/server';
import { fetchLogInfo, logMessage } from "@/utils/commonUtils";
import { getAllBankAccountChangeRequests } from '@/app/models/supplier/bankAccount';
import { isUserExist } from '@/utils/auth/authUtils';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
  role: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: SupplierStaff;
}

export async function GET(req: NextRequest) {
    try {
        logMessage('debug', 'GET request received for bank account change requests');

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
        const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
        if (!userCheck.status) {
            logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
            return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

        if (isStaff) {
            const options = {
                panel: 'Admin',
                module: 'Supplier',
                action: 'Bank Account Change Request View Listing',
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

        const fetchLogInfoResult = await fetchLogInfo('bankAccountChangeRequest', 'view', req);
        logMessage('debug', 'fetchLogInfo result:', fetchLogInfoResult);

        const requestResult = await getAllBankAccountChangeRequests();

        if (requestResult?.status) {
            return NextResponse.json(
                { status: true, requests: requestResult.requests },
                { status: 200 }
            );
        }

        logMessage('warn', 'No bank account change requests found');
        return NextResponse.json(
            { status: false, error: "No bank account change requests found" },
            { status: 404 }
        );
    } catch (error) {
        logMessage('error', 'Error fetching brands:', error);
        return NextResponse.json(
            { status: false, error: "Failed to fetch brands" },
            { status: 500 }
        );
    }
}
