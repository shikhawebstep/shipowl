import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperOrders } from '@/app/models/dropshipper/order';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainDropshipper {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface DropshipperStaff {
    id: number;
    name: string;
    email: string;
    password: string;
    role?: string;
    dropshipper?: MainDropshipper;
}

interface UserCheckResult {
    status: boolean;
    message?: string;
    dropshipper?: DropshipperStaff;
}

export async function GET(req: NextRequest) {
    try {
        const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
        const dropshipperRole = req.headers.get('x-dropshipper-role');

        logMessage('info', 'Dropshipper details received', { dropshipperIdHeader, dropshipperRole });

        const dropshipperId = Number(dropshipperIdHeader);
        if (!dropshipperIdHeader || isNaN(dropshipperId)) {
            logMessage('warn', 'Invalid dropshipper ID received', { dropshipperIdHeader });
            return NextResponse.json(
                { status: false, error: 'Invalid or missing dropshipper ID' },
                { status: 400 }
            );
        }

        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));

        if (!userCheck.status) {
            return NextResponse.json(
                { status: false, error: `User Not Found: ${userCheck.message}` },
                { status: 404 }
            );
        }

        const isStaff = !['dropshipper', 'supplier'].includes(String(dropshipperRole).toLowerCase());

        if (isStaff) {
            const options = {
                panel: 'Dropshipper',
                module: 'Raise Ticket',
                action: 'Create',
            };

            const staffPermissionsResult = await checkStaffPermissionStatus(options, dropshipperId);
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

        const ordersResult = await getDropshipperOrders(dropshipperId);

        if (!ordersResult?.status || !ordersResult.orders || ordersResult.orders.length === 0) {
            return NextResponse.json({ status: false, error: 'No orders found' }, { status: 404 });
        }

        return NextResponse.json({
            status: true,
            orders: ordersResult.orders
        });

    } catch (error) {
        logMessage('error', 'Error while fetching orders', { error });
        return NextResponse.json(
            { status: false, error: 'Failed to fetch orders due to an internal error' },
            { status: 500 }
        );
    }
}
