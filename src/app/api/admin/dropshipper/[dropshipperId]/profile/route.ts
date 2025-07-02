import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById } from '@/app/models/dropshipper/dropshipper';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

export async function GET(req: NextRequest) {
    try {
        const parts = req.nextUrl.pathname.split('/');
        const dropshipperId = Number(parts[parts.length - 2]); // Get the second-to-last segment

        const adminId = Number(req.headers.get('x-dropshipper-id'));
        const adminRole = req.headers.get('x-dropshipper-role');

        if (!adminId || isNaN(Number(adminId))) {
            logMessage('warn', 'Invalid or missing dropshipper ID', { adminId });
            return NextResponse.json({ error: 'Invalid or missing dropshipper ID' }, { status: 400 });
        }

        logMessage('debug', `Requested Dropshipper ID: ${adminId}, Role: ${adminRole}`);

        const userCheck = await isUserExist(Number(adminId), String(adminRole));
        if (!userCheck.status) {
            logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

        if (isStaff) {
            const options = {
                panel: 'Admin',
                module: 'Dropshipper',
                action: 'View',
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

        const dropshipperIdNum = Number(dropshipperId);
        if (isNaN(dropshipperIdNum)) {
            logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
            return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
        }

        const dropshipperResult = await getDropshipperById(dropshipperIdNum);
        if (dropshipperResult?.status) {
            logMessage('info', 'Dropshipper found:', dropshipperResult.dropshipper);
            return NextResponse.json({ status: true, dropshipper: dropshipperResult.dropshipper }, { status: 200 });
        }

        return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    } catch (error) {
        logMessage('error', '❌ Error fetching single dropshipper:', error);
        return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
    }
}