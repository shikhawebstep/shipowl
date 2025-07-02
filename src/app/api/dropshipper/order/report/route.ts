import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getOrdersByStatusForDropshipperReporting } from '@/app/models/order/order';
import { getAppConfig } from '@/app/models/app/appConfig';

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

        const userExistence = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userExistence.status) {
            logMessage('warn', 'Dropshipper user not found', { dropshipperId, dropshipperRole });
            return NextResponse.json(
                { status: false, error: `User Not Found: ${userExistence.message}` },
                { status: 404 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const fromRaw = searchParams.get('from');
        const toRaw = searchParams.get('to');

        const extractDate = (value: string | null, outputFormat: string): string | null => {
            if (!value) return null;

            const regexPatterns = [
                { format: 'DD-MM-YYYY', regex: /^(\d{2})-(\d{2})-(\d{4})$/ },
                { format: 'YYYY-MM-DD', regex: /^(\d{4})-(\d{2})-(\d{2})$/ },
                { format: 'DD/MM/YYYY', regex: /^(\d{2})\/(\d{2})\/(\d{4})$/ },
                { format: 'YYYY/MM/DD', regex: /^(\d{4})\/(\d{2})\/(\d{2})$/ }
            ];

            let parsedDate: Date | null = null;

            for (const { format, regex } of regexPatterns) {
                const match = value.match(regex);
                if (match) {
                    let day, month, year;
                    if (format.startsWith('DD')) {
                        [, day, month, year] = match;
                    } else {
                        [, year, month, day] = match;
                    }
                    parsedDate = new Date(`${year}-${month}-${day}`);
                    logMessage('info', `✅ Parsed date from "${value}" using format "${format}"`);
                    break;
                }
            }

            if (!parsedDate) {
                logMessage('warn', `Failed to parse date for "${value}"`);
                return null;
            }

            const formatDate = (date: Date, format: string): string => {
                const options: Intl.DateTimeFormatOptions = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                };

                const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
                return format === 'YYYY-MM-DD'
                    ? formattedDate.split('/').reverse().join('-')
                    : formattedDate.replace(/\//g, '-');
            };

            return formatDate(parsedDate, outputFormat);
        };

        const fromDate = extractDate(fromRaw, 'YYYY-MM-DD') || '';
        const toDate = extractDate(toRaw, 'YYYY-MM-DD') || '';

        console.log(`fromDate - `, fromDate);
        console.log(`toDate - `, toDate);

        const ordersResult = await getOrdersByStatusForDropshipperReporting('All', dropshipperId, fromDate, toDate);
        const orders = ordersResult.orders;

        if (!ordersResult?.status || !orders) {
            return NextResponse.json({ status: false, error: 'No orders found' }, { status: 404 });
        }

        const appConfigResult = await getAppConfig();
        const appConfig = appConfigResult.appConfig;

        if (!appConfigResult.status || !appConfig) {
            return NextResponse.json({ status: false, error: 'No app config found' }, { status: 404 });
        }

        const shippingCost = appConfig.shippingCost;

        const reportAnalytics = {
            shipowl: {
                orderCount: 0,
                totalProductCost: 0,
                totalCODCollected: 0,
                totalShippingCost: 0,
                totalDeduction: 0,
                remittanceToDropshipper: 0,
                deliveredOrder: 0,
                rtoOrder: 0
            },
            selfship: {
                prepaid: {
                    orderCount: 0,
                    totalProductCost: 0,
                    totalCODCollected: 0,
                    totalShippingCost: 0,
                    totalDeduction: 0,
                    remittanceToDropshipper: 0,
                    deliveredOrder: 0,
                    rtoOrder: 0
                },
                postpaid: {
                    orderCount: 0,
                    totalProductCost: 0,
                    totalCODCollected: 0,
                    totalShippingCost: 0,
                    totalDeduction: 0,
                    remittanceToDropshipper: 0,
                    deliveredOrder: 0,
                    rtoOrder: 0
                },
            },
        };

        orders.forEach(order => {
            const orderItems = order.items;
            if (!orderItems || !Array.isArray(orderItems)) return;

            // TODO: Replace with real logic to determine if order is prepaid or postpaid
            const orderType: 'prepaid' | 'postpaid' = order.isPostpaid ? 'postpaid' : 'prepaid';

            let hasShipOwlProduct = false;

            orderItems.forEach(item => {
                const orderItemQty = Number(item.quantity) || 0;
                const dropshipperVariant = item.dropshipperVariant;

                if (!dropshipperVariant?.supplierProductVariant) return;

                const supplierVariant = dropshipperVariant.supplierProductVariant;
                const productVariant = supplierVariant.variant;
                const productModel = productVariant?.model || '';

                const totalShippingCost = (Number(shippingCost) || 0);

                const model = productModel.toLowerCase();

                if (model === 'shipowl') {
                    hasShipOwlProduct = true;

                    if (order.delivered) {
                        reportAnalytics.shipowl.deliveredOrder += 1;
                        reportAnalytics.shipowl.totalCODCollected += orderItemQty * Number(dropshipperVariant.price || 0);
                        reportAnalytics.shipowl.totalProductCost += orderItemQty * Number(supplierVariant.price || 0);
                    } else if (order.rtoDelivered) {
                        reportAnalytics.shipowl.rtoOrder += 1;
                    }

                    reportAnalytics.shipowl.totalShippingCost += totalShippingCost;
                    reportAnalytics.shipowl.totalDeduction += (orderItemQty * Number(supplierVariant.price || 0)) + totalShippingCost;
                    reportAnalytics.shipowl.remittanceToDropshipper +=
                        (orderItemQty * Number(dropshipperVariant.price || 0)) -
                        ((orderItemQty * Number(supplierVariant.price || 0)) + totalShippingCost);

                } else if (model === 'selfship') {
                    const section = reportAnalytics.selfship[orderType];

                    if (order.delivered) {
                        section.deliveredOrder += 1;
                        section.totalCODCollected += orderItemQty * Number(dropshipperVariant.price || 0);
                    } else if (order.rtoDelivered) {
                        section.rtoOrder += 1;
                    }

                    section.totalShippingCost += totalShippingCost;
                    section.totalProductCost += orderItemQty * Number(supplierVariant.price || 0);
                    section.totalDeduction += (orderItemQty * Number(supplierVariant.price || 0)) + totalShippingCost;
                    section.remittanceToDropshipper +=
                        (orderItemQty * Number(dropshipperVariant.price || 0)) -
                        (orderType === 'postpaid'
                            ? ((orderItemQty * Number(supplierVariant.price || 0)) + totalShippingCost)
                            : totalShippingCost);
                }

            });

            if (hasShipOwlProduct) {
                reportAnalytics.shipowl.orderCount += 1;
            }
        });

        console.log('ShipOwl Analytics:', reportAnalytics.shipowl);

        return NextResponse.json(
            { status: true, reportAnalytics, orders },
            { status: 200 }
        );

    } catch (error) {
        logMessage('error', 'Error while fetching orders', { error });
        return NextResponse.json(
            { status: false, error: 'Failed to fetch orders due to an internal error' },
            { status: 500 }
        );
    }
}
