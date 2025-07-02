import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from "@/utils/commonUtils";
import { getOrderShippingStatus } from '@/utils/order/getOrderShippingStatus';
import {
    refreshPendingOrdersShippingStatus,
    refreshShippingApiResultOfOrder,
    updateAWBNuberOfOrder,
    updateRTODeliveredStatusOfOrder,
    updateDeliveredStatusOfOrder,
    createRTOInventory
} from '@/app/models/order/order';

export async function GET(req: NextRequest) {
    try {
        logMessage('debug', '🚚 Order shipping status request received', req);

        const { orders } = await refreshPendingOrdersShippingStatus() || {};

        if (!orders?.length) {
            logMessage('warn', '❗ No orders found to refresh shipping status');
            return NextResponse.json({ status: false, message: 'No orders to refresh', results: [] }, { status: 404 });
        }

        const results = [];

        for (const order of orders) {
            const orderId = order.id;

            if (isNaN(orderId)) {
                logMessage('warn', '❗ Invalid order ID', { orderId });
                results.push({ orderId, status: false, message: 'Invalid order ID' });
                continue;
            }

            try {
                const shippingResponse = await getOrderShippingStatus(orderId);
                const shippingResult = await shippingResponse.json();
                logMessage('debug', '📦 shippingResult', { orderId, shippingResult });

                if (!shippingResult?.status) {
                    results.push({ orderId, status: false, message: 'Shipping status not found' });
                    continue;
                }

                const shippingData = shippingResult.trackingData?.data || [];

                const [awbUpdate, apiUpdate] = await Promise.all([
                    updateAWBNuberOfOrder(orderId, shippingResult.awb_number),
                    refreshShippingApiResultOfOrder(orderId, shippingResult),
                ]);

                if (!awbUpdate?.status) {
                    logMessage('warn', '⚠️ Failed to update AWB Number', { orderId });
                    results.push({ orderId, status: false, message: 'AWB update failed' });
                }

                if (!apiUpdate?.status || !apiUpdate.order) {
                    logMessage('warn', '⚠️ Failed to refresh shipping API result', { orderId });
                    results.push({ orderId, status: false, message: 'Shipping API result update failed' });
                }

                const isRTODelivered = shippingData.some((item: { status_title: string }) =>
                    ['rto', 'delivered'].some(keyword => item.status_title.toLowerCase().includes(keyword))
                );

                const isDelivered = shippingData.some((item: { status_title: string }) =>
                    ['delivered'].some(keyword => item.status_title.toLowerCase().includes(keyword))
                );

                if (isRTODelivered) {
                    const updateStatus = await updateRTODeliveredStatusOfOrder(orderId, true);
                    if (!updateStatus?.status) {
                        logMessage('warn', '⚠️ Failed to update delivered/RTO status', { orderId });
                        results.push({ orderId, status: false, message: 'Failed to update RTO/Delivered status' });
                    }
                }

                if (!isRTODelivered && isDelivered) {
                    const updateStatus = await updateDeliveredStatusOfOrder(orderId, true);
                    if (!updateStatus?.status) {
                        logMessage('warn', '⚠️ Failed to update delivered/RTO status', { orderId });
                        results.push({ orderId, status: false, message: 'Failed to update RTO/Delivered status' });
                    }
                }

                const selfShipItems = order.items.filter(
                    item => item?.dropshipperVariant?.supplierProductVariant?.variant?.model === 'selfship'
                );

                if (selfShipItems.length) {
                    logMessage('debug', '📦 SelfShip Items Found', { orderId, count: selfShipItems.length });

                    for (const item of selfShipItems) {
                        const dropshipperId = item.dropshipperProduct?.dropshipperId;
                        const dropshipperProductId = item.dropshipperProductId;
                        const dropshipperProductVariantId = item.dropshipperProductVariantId;

                        if (
                            dropshipperId == null ||
                            dropshipperProductId == null ||
                            dropshipperProductVariantId == null
                        ) {
                            logMessage('warn', '❗ Missing required IDs for RTO inventory', {
                                orderId,
                                orderItemId: item.id,
                                dropshipperId,
                                dropshipperProductId,
                                dropshipperProductVariantId
                            });

                            results.push({
                                orderId,
                                orderItemId: item.id,
                                status: false,
                                message: 'Missing required data to create RTO inventory'
                            });
                            continue;
                        }

                        const payload = {
                            order: { connect: { id: item.orderId } },
                            orderItem: { connect: { id: item.id } },
                            dropshipper: { connect: { id: dropshipperId } },
                            dropshipperProduct: { connect: { id: dropshipperProductId } },
                            dropshipperProductVariant: { connect: { id: dropshipperProductVariantId } },
                            quantity: item.quantity,
                            price: item.price
                        };

                        try {
                            const inventoryRes = await createRTOInventory(payload);
                            if (!inventoryRes?.status) {
                                throw new Error('Create inventory failed');
                            }
                        } catch (error) {
                            logMessage('error', '❌ Inventory creation failed', {
                                orderId,
                                orderItemId: item.id,
                                error
                            });
                            results.push({
                                orderId,
                                orderItemId: item.id,
                                status: false,
                                message: 'Failed to create dropshipper inventory'
                            });
                        }
                    }
                }

                results.push({
                    orderId,
                    status: true,
                    message: 'Shipping status processed successfully',
                    data: shippingResult,
                });
            } catch (error) {
                logMessage('error', '🚨 Error processing shipping status', { orderId, error });
                results.push({
                    orderId,
                    status: false,
                    message: 'Shipping status error',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return NextResponse.json({ status: true, message: 'Processed all orders', results }, { status: 200 });

    } catch (error) {
        logMessage('error', '🚨 Internal server error', { error });
        return NextResponse.json({
            status: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
