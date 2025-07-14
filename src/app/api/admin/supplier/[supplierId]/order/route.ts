import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getOrdersByStatusForSupplierReporting } from '@/app/models/order/order';
import { getAppConfig } from '@/app/models/app/appConfig';
import { getSupplierById } from '@/app/models/supplier/supplier';
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
        const adminIdHeader = req.headers.get('x-admin-id');
        const adminRole = req.headers.get('x-admin-role');

        logMessage('info', 'Admin headers received', { adminIdHeader, adminRole });

        const adminId = Number(adminIdHeader);
        if (!adminIdHeader || isNaN(adminId)) {
            logMessage('warn', 'Invalid admin ID', { adminIdHeader });
            return NextResponse.json({ status: false, error: 'Invalid or missing admin ID' }, { status: 400 });
        }

        const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
        if (!userCheck.status) {
            logMessage('warn', 'User not found', { adminId, adminRole });
            return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

        if (isStaff) {
            const options = {
                panel: 'Admin',
                module: 'Supplier',
                action: 'Orders',
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

        const parts = req.nextUrl.pathname.split('/');
        const supplierId = Number(parts[parts.length - 2]); // Get the second-to-last segment

        const supplierResult = await getSupplierById(supplierId);
        if (!supplierResult?.status) {
            logMessage('warn', 'Supplier not found', { supplierId });
            return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
        }

        const searchParams = req.nextUrl.searchParams;
        const fromRaw = searchParams.get('from');
        const toRaw = searchParams.get('to');

        const parseDate = (value: string | null, outputFormat: string): string | null => {
            if (!value) return null;

            console.log(`outputFormat - `, outputFormat);

            const patterns = [
                { regex: /^(\d{2})-(\d{2})-(\d{4})$/, order: ['year', 'month', 'day'] },  // DD-MM-YYYY
                { regex: /^(\d{4})-(\d{2})-(\d{2})$/, order: ['year', 'month', 'day'] },  // YYYY-MM-DD
                { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, order: ['year', 'month', 'day'] }, // DD/MM/YYYY
                { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, order: ['year', 'month', 'day'] }, // YYYY/MM/DD
            ];

            for (const { regex } of patterns) {
                const match = value.match(regex);
                if (match) {
                    const [, a, b, c] = match;
                    const [year, month, day] = regex === patterns[0].regex || regex === patterns[2].regex
                        ? [c, b, a] : [a, b, c];
                    const parsed = new Date(`${year}-${month}-${day}`);
                    if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString().split('T')[0]; // YYYY-MM-DD
                    }
                }
            }

            logMessage('warn', 'Failed to parse date', { value });
            return null;
        };

        const fromDate = parseDate(fromRaw, 'YYYY-MM-DD') || '';
        const toDate = parseDate(toRaw, 'YYYY-MM-DD') || '';

        const ordersResult = await getOrdersByStatusForSupplierReporting('deliveredOrRto', supplierId, fromDate, toDate);
        const orders = ordersResult.orders;

        console.log(`ordersResult - `, ordersResult);
        if (!ordersResult?.status || !orders?.length) {
            return NextResponse.json({ status: false, error: 'No orders found' }, { status: 404 });
        }

        const configResult = await getAppConfig();
        const appConfig = configResult.appConfig;

        if (!configResult.status || !appConfig) {
            return NextResponse.json({ status: false, error: 'No app config found' }, { status: 404 });
        }

        const reportAnalytics = {
            shipowl: {
                orderCount: 0,
                totalProductCost: 0,
                deliveredOrder: 0,
                rtoOrder: 0
            },
            selfship: {
                prepaid: {
                    orderCount: 0,
                    totalProductCost: 0,
                    deliveredOrder: 0,
                    rtoOrder: 0
                },
                postpaid: {
                    orderCount: 0,
                    totalProductCost: 0,
                    deliveredOrder: 0,
                    rtoOrder: 0
                },
            },
        };

        for (const order of orders) {
            const orderItems = order.items || [];
            const isPostpaid = order.isPostpaid;
            const orderType: 'prepaid' | 'postpaid' = isPostpaid ? 'postpaid' : 'prepaid';

            let shipOwlInOrder = false;

            for (const item of orderItems) {
                const quantity = Number(item.quantity) || 0;
                const variant = item.dropshipperVariant?.supplierProductVariant;

                if (!variant) continue;

                const model = variant.variant?.model?.toLowerCase() || '';

                if (model === 'shipowl') {
                    shipOwlInOrder = true;
                    if (order.delivered) {
                        reportAnalytics.shipowl.deliveredOrder++;
                        reportAnalytics.shipowl.totalProductCost += quantity * (variant.price || 0);
                    } else if (order.rtoDelivered) {
                        reportAnalytics.shipowl.rtoOrder++;
                    }
                } else if (model === 'selfship') {
                    const section = reportAnalytics.selfship[orderType];
                    section.deliveredOrder++;
                    section.totalProductCost += quantity * (variant.price || 0);
                }
            }

            if (shipOwlInOrder) {
                reportAnalytics.shipowl.orderCount++;
            }
        }

        console.log(`rtoDeliveredDate - `, orders[0].rtoDeliveredDate);
        return NextResponse.json({ status: true, reportAnalytics, orders }, { status: 200 });

    } catch (error) {
        logMessage('error', 'Internal error occurred', { error });
        return NextResponse.json({ status: false, error: 'Failed to fetch orders due to an internal error' }, { status: 500 });
    }
}
