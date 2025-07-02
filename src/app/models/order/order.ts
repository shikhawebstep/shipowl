import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface Order {
    id?: string;
    status: string;
    orderNote?: string;
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    currency: string;
    shippingName: string;
    shippingPhone: string;
    shippingEmail: string;
    shippingAddress: string;
    shippingZip: string;
    shippingCountry: {
        connect: { id: number }; // or whatever your relation is
    };
    shippingState: {
        connect: { id: number }; // or whatever your relation is
    };
    shippingCity: {
        connect: { id: number }; // or whatever your relation is
    };
    billingName: string;
    billingPhone: string;
    billingEmail: string;
    billingAddress: string;
    billingZip: string;
    billingCountry: {
        connect: { id: number }; // or whatever your relation is
    };
    billingState: {
        connect: { id: number }; // or whatever your relation is
    };
    billingCity: {
        connect: { id: number }; // or whatever your relation is
    };
    payment: {
        connect: { id: number }; // or whatever your relation is
    };
    shippingApiJson?: string;
    createdBy?: number;
    createdAt?: Date;
    createdByRole?: string;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

type ShippingUpdatePayload = {
    updatedBy: number;
    updatedByRole: string;
    shippingApiJson: string | undefined;
};

interface RTOInventory {
    order: {
        connect: { id: number };
    };
    orderItem: {
        connect: { id: number };
    };
    dropshipper: {
        connect: { id: number };
    };
    dropshipperProduct: {
        connect: { id: number };
    };
    dropshipperProductVariant: {
        connect: { id: number };
    };
    quantity: number;
    price: number;
}

const serializeBigInt = <T>(obj: T): T => {
    if (typeof obj === "bigint") {
        return obj.toString() as unknown as T;
    }

    if (obj instanceof Date) {
        // Return Date object unchanged, no conversion
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt) as unknown as T;
    }

    if (obj && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        ) as T;
    }

    return obj;
};

export async function generateOrderNumber(base: string = '') {
    const cleanBase = base
        ? base.toUpperCase().replace(/[^A-Z0-9]/g, '')
        : Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

    let orderNumber = cleanBase;
    let isTaken = true;
    let suffix = 0;

    while (isTaken) {
        const existingOrder = await prisma.order.findUnique({
            where: { orderNumber },
        });

        if (existingOrder) {
            suffix++;
            orderNumber = `${cleanBase}-${suffix}`;
        } else {
            isTaken = false;
        }
    }

    return orderNumber;
}

export async function checkPaymentIdAvailability(paymentId: number) {
    try {
        // Check if the payment exists
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!existingPayment) {
            return {
                status: false,
                message: `Payment ID "${paymentId}" does not exist.`,
            };
        }

        // Check if the payment ID is already linked to an order
        const usedInOrder = await prisma.order.findFirst({
            where: { paymentId: paymentId },
        });

        if (usedInOrder) {
            return {
                status: false,
                message: `Payment ID "${paymentId}" is already assigned to an order.`,
            };
        }

        return {
            status: true,
            message: `Payment ID "${paymentId}" is available.`,
        };
    } catch (error) {
        console.error("Error checking Payment ID:", error);
        return {
            status: false,
            message: "Error while checking Payment ID availability.",
        };
    }
}


export async function createOrder(order: Order) {

    try {
        // Generate a unique orderNumber for the order
        const orderNumber = await generateOrderNumber();

        const {
            status,
            orderNote,
            subtotal,
            tax,
            discount,
            totalAmount,
            currency,
            shippingName,
            shippingPhone,
            shippingEmail,
            shippingAddress,
            shippingZip,
            shippingCountry,
            shippingState,
            shippingCity,
            billingName,
            billingPhone,
            billingEmail,
            billingAddress,
            billingZip,
            billingCountry,
            billingState,
            billingCity,
            payment,
        } = order;

        const newOrder = await prisma.order.create({
            data: {
                orderNumber,
                status,
                orderNote,
                subtotal,
                tax,
                discount,
                totalAmount,
                currency,
                shippingName,
                shippingPhone,
                shippingEmail,
                shippingAddress,
                shippingZip,
                shippingCountry,
                shippingState,
                shippingCity,
                billingName,
                billingPhone,
                billingEmail,
                billingAddress,
                billingZip,
                billingCountry,
                billingState,
                billingCity,
                payment,
                createdAt: new Date(),
            },
        });

        return { status: true, order: serializeBigInt(newOrder) };
    } catch (error) {
        console.error(`Error creating order:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateOrder = async (
    adminId: number,
    adminRole: string,
    orderId: number,
    data: Order
) => {
    try {
        const {
            status,
            orderNote,
            subtotal,
            tax,
            discount,
            totalAmount,
            currency,
            shippingName,
            shippingPhone,
            shippingEmail,
            shippingAddress,
            shippingZip,
            shippingCountry,
            shippingState,
            shippingCity,
            billingName,
            billingPhone,
            billingEmail,
            billingAddress,
            billingZip,
            billingCountry,
            billingState,
            billingCity,
            payment,
            updatedBy,
            updatedByRole,
        } = data;

        const order = await prisma.order.update({
            where: { id: orderId }, // Assuming 'id' is the correct primary key field
            data: {
                status,
                orderNote,
                subtotal,
                tax,
                discount,
                totalAmount,
                currency,
                shippingName,
                shippingPhone,
                shippingEmail,
                shippingAddress,
                shippingZip,
                shippingCountry,
                shippingState,
                shippingCity,
                billingName,
                billingPhone,
                billingEmail,
                billingAddress,
                billingZip,
                billingCountry,
                billingState,
                billingCity,
                payment,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

export const updateBarcodeOfOrder = async (
    orderId: number,
    barcodeImage: string
) => {
    try {
        const order = await prisma.order.update({
            where: { id: orderId }, // Assuming 'id' is the correct primary key field
            data: {
                barcodeImage,
                updatedAt: new Date()
            },
        });

        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ updateBarcodeOfOrder Error:", error);
        return { status: false, message: "Error updating order barcode" };
    }
};

export const updateShippingApiResultOfOrder = async (
    adminId: number,
    adminRole: string,
    orderId: number,
    data: ShippingUpdatePayload
) => {
    try {
        const {
            updatedBy,
            updatedByRole,
            shippingApiJson,
        } = data;

        const shippingApiObj = typeof shippingApiJson === 'string' ? JSON.parse(shippingApiJson) : shippingApiJson;
        const awbNumber = shippingApiObj?.data?.awb_number || null;

        const order = await prisma.order.update({
            where: { id: orderId }, // Assuming 'id' is the correct primary key field
            data: {
                awbNumber: awbNumber,
                shippingApiResult: shippingApiJson,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

export const refreshShippingApiResultOfOrder = async (
    orderId: number,
    data: string
) => {
    try {
        const order = await prisma.order.update({
            where: { id: orderId }, // Assuming 'id' is the correct primary key field
            data: {
                shippingApiResult: data,
            },
        });

        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

export const updateRTODeliveredStatusOfOrder = async (
    orderId: number,
    status: boolean
) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return { status: false, message: "Order not found" };
        }

        if (order.rtoDelivered && order.rtoDeliveredDate) {
            return { status: false, message: "rtoDeliveredDate already set" };
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                rtoDelivered: status,
                rtoDeliveredDate: new Date(),
            },
        });

        return { status: true, order: serializeBigInt(updatedOrder) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

export const updateDeliveredStatusOfOrder = async (
    orderId: number,
    status: boolean
) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return { status: false, message: "Order not found" };
        }

        if (order.delivered && order.deliveredDate) {
            return { status: false, message: "deliveredDate already set" };
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                delivered: status,
                deliveredDate: new Date(),
            },
        });

        return { status: true, order: serializeBigInt(updatedOrder) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

export const updateAWBNuberOfOrder = async (
    orderId: number,
    awbNumber: string
) => {
    try {
        const order = await prisma.order.update({
            where: { id: orderId }, // Assuming 'id' is the correct primary key field
            data: {
                awbNumber,
            },
        });

        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ updateOrder Error:", error);
        return { status: false, message: "Error updating order" };
    }
};

// 🔵 GET BY ID
export const getOrderById = async (id: number) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) return { status: false, message: "Order not found" };
        return { status: true, order: serializeBigInt(order) };
    } catch (error) {
        console.error("❌ getOrderById Error:", error);
        return { status: false, message: "Error fetching order" };
    }
};

// 🟣 GET ALL
export const getAllOrders = async () => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, orders: serializeBigInt(orders) };
    } catch (error) {
        console.error("❌ getAllOrders Error:", error);
        return { status: false, message: "Error fetching orders" };
    }
};

export const getOrdersByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition = {};

        switch (status) {
            case "active":
                whereCondition = { status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const orders = await prisma.order.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            include: {
                items: {
                    include: {
                        dropshipperProduct: true,
                        dropshipperVariant: {
                            include: {
                                supplierProductVariant: {
                                    include: {
                                        variant: true
                                    }
                                }
                            }
                        }
                    },
                },
                shippingCountry: true,
                shippingState: true,
                shippingCity: true,
                billingCountry: true,
                billingState: true,
                billingCity: true,
                payment: true,
            },
        });

        return { status: true, orders: serializeBigInt(orders) };
    } catch (error) {
        console.error(`Error fetching orders by status (${status}):`, error);
        return { status: false, message: "Error fetching orders" };
    }
};

export const getOrdersByStatusForDropshipperReporting = async (
    status: "active" | "inactive" | "deleted" | "notDeleted" | "deliveredOrRto" | "delivered" | "RTO" | "All",
    dropshipperId: number,
    fromDate: string,
    toDate: string
) => {
    try {
        const baseWhere: Record<string, unknown> = {};

        // Base status logic
        switch (status) {
            case "active":
                baseWhere.status = true;
                baseWhere.deletedAt = null;
                break;
            case "inactive":
                baseWhere.status = false;
                baseWhere.deletedAt = null;
                break;
            case "deleted":
                baseWhere.deletedAt = { not: null };
                break;
            case "notDeleted":
                baseWhere.deletedAt = null;
                break;
            case "delivered":
                baseWhere.deletedAt = null;
                baseWhere.delivered = true;
                break;
            case "RTO":
                baseWhere.deletedAt = null;
                baseWhere.rtoDelivered = true;
                break;
            case "deliveredOrRto":
                baseWhere.deletedAt = null;
                baseWhere.OR = [{ delivered: true }, { rtoDelivered: true }];
                break;
        }

        // Date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const isValidRange = !isNaN(from.getTime()) && !isNaN(to.getTime());

        const andConditions: Record<string, unknown>[] = [];

        if (isValidRange) {
            andConditions.push({
                createdAt: { gte: from, lte: to }
            });
            /*
                if (status === "delivered") {
                    andConditions.push({
                        deliveredDate: { gte: from, lte: to }
                    });
                } else if (status === "RTO") {
                    andConditions.push({
                        rtoDeliveredDate: { gte: from, lte: to }
                    });
                } else if (status === "deliveredOrRto") {
                    andConditions.push({
                        OR: [
                            { deliveredDate: { gte: from, lte: to } },
                            { rtoDeliveredDate: { gte: from, lte: to } }
                        ]
                    });
                } else if (status === "All") {
                    andConditions.push({
                        createdAt: { gte: from, lte: to }
                    });
                }
            */
        }

        andConditions.push({
            items: {
                some: {
                    dropshipperProduct: {
                        dropshipperId
                    },
                },
            },
        });

        if (andConditions.length > 0) {
            Object.assign(baseWhere, {
                AND: andConditions,
            });
        }

        const orders = await prisma.order.findMany({
            where: baseWhere,
            orderBy: { id: "desc" },
            include: {
                items: {
                    include: {
                        dropshipperProduct: true,
                        dropshipperVariant: {
                            include: {
                                supplierProductVariant: {
                                    include: {
                                        variant: true,
                                        product: true,
                                    },
                                },
                            },
                        },
                    },
                },
                shippingCountry: true,
                shippingState: true,
                shippingCity: true,
                billingCountry: true,
                billingState: true,
                billingCity: true,
                payment: true,
            },
        });

        return { status: true, orders: serializeBigInt(orders) };
    } catch (error) {
        console.error(`❌ Error fetching orders by status (${status}):`, error);
        return { status: false, message: "Error fetching orders" };
    }
};

export const getOrdersByStatusForSupplierReporting = async (
    status: "active" | "inactive" | "deleted" | "notDeleted" | "deliveredOrRto" | "delivered" | "RTO",
    supplierId: number,
    fromDate: string,
    toDate: string
) => {
    try {
        const baseWhere: Record<string, unknown> = {};

        // Base status logic
        switch (status) {
            case "active":
                baseWhere.status = true;
                baseWhere.deletedAt = null;
                break;
            case "inactive":
                baseWhere.status = false;
                baseWhere.deletedAt = null;
                break;
            case "deleted":
                baseWhere.deletedAt = { not: null };
                break;
            case "notDeleted":
                baseWhere.deletedAt = null;
                break;
            case "delivered":
                baseWhere.deletedAt = null;
                baseWhere.delivered = true;
                break;
            case "RTO":
                baseWhere.deletedAt = null;
                baseWhere.rtoDelivered = true;
                break;
            case "deliveredOrRto":
                baseWhere.deletedAt = null;
                baseWhere.OR = [{ delivered: true }, { rtoDelivered: true }];
                break;
        }

        // Date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const isValidRange = !isNaN(from.getTime()) && !isNaN(to.getTime());

        const andConditions: Record<string, unknown>[] = [];

        if (isValidRange) {
            if (status === "delivered") {
                andConditions.push({
                    deliveredDate: { gte: from, lte: to }
                });
            } else if (status === "RTO") {
                andConditions.push({
                    rtoDeliveredDate: { gte: from, lte: to }
                });
            } else if (status === "deliveredOrRto") {
                andConditions.push({
                    OR: [
                        { deliveredDate: { gte: from, lte: to } },
                        { rtoDeliveredDate: { gte: from, lte: to } }
                    ]
                });
            }
        }

        // Supplier condition
        andConditions.push({
            items: {
                some: {
                    dropshipperProduct: {
                        supplierId: supplierId
                    }
                }
            }
        });

        if (andConditions.length > 0) {
            baseWhere.AND = andConditions;
        }

        const orders = await prisma.order.findMany({
            where: baseWhere,
            orderBy: { id: "desc" },
            include: {
                items: {
                    include: {
                        dropshipperProduct: true,
                        dropshipperVariant: {
                            include: {
                                supplierProductVariant: {
                                    include: {
                                        variant: true,
                                        product: true,
                                    }
                                }
                            }
                        }
                    }
                },
                shippingCountry: true,
                shippingState: true,
                shippingCity: true,
                billingCountry: true,
                billingState: true,
                billingCity: true,
                payment: true
            }
        });

        console.log(`orders - `, orders);

        return { status: true, orders: serializeBigInt(orders) };
    } catch (error) {
        console.error(`❌ Error fetching orders by status (${status}):`, error);
        return { status: false, message: "Error fetching orders" };
    }
};

export const getOrdersByTypeForSupplierReporting = async (
    type: "warehouseCollected" | "rtoCount" | "needToRaise",
    supplierId: number,
    fromDate: string,
    toDate: string
) => {
    try {
        const baseWhere: Record<string, unknown> = {};

        // Status/type-based conditions
        switch (type) {
            case "warehouseCollected":
                baseWhere.rtoDelivered = true;
                baseWhere.rtoDeliveredDate = { not: null };
                baseWhere.collectedAtWarehouse = { not: null };
                break;
            case "rtoCount":
                baseWhere.rtoDelivered = true;
                baseWhere.rtoDeliveredDate = { not: null };
                break;
            case "needToRaise":
                baseWhere.collectedAtWarehouse = null;
                baseWhere.rtoDelivered = true;
                baseWhere.rtoDeliveredDate = { not: null };
                break;
        }

        // Prepare date range condition
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const isValidRange = !isNaN(from.getTime()) && !isNaN(to.getTime());

        const andConditions: Record<string, unknown>[] = [];

        if (isValidRange) {
            if (type === "warehouseCollected") {
                andConditions.push({
                    collectedAtWarehouse: { gte: from, lte: to }
                });
            } else if (type === "rtoCount") {
                andConditions.push({
                    rtoDeliveredDate: { gte: from, lte: to }
                });
            }
            // `needToRaise` has no date filter as per current logic
        }

        // Add supplier-specific condition
        andConditions.push({
            items: {
                some: {
                    dropshipperProduct: {
                        supplierId: supplierId
                    }
                }
            }
        });

        // Merge AND conditions if any exist
        if (andConditions.length > 0) {
            baseWhere.AND = andConditions;
        }

        // Query orders
        const orders = await prisma.order.findMany({
            where: baseWhere,
            orderBy: { id: "desc" },
            include: {
                items: {
                    include: {
                        dropshipperProduct: true,
                        dropshipperVariant: {
                            include: {
                                supplierProductVariant: {
                                    include: {
                                        variant: true,
                                        product: true,
                                    }
                                }
                            }
                        }
                    }
                },
                shippingCountry: true,
                shippingState: true,
                shippingCity: true,
                billingCountry: true,
                billingState: true,
                billingCity: true,
                payment: true
            }
        });

        console.log(`📦 Orders fetched for ${type}:`, orders.length);
        return { status: true, orders: serializeBigInt(orders) };
    } catch (error) {
        console.error(`❌ Error fetching orders for ${type}:`, error);
        return { status: false, message: "Error fetching orders" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteOrder = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "Order soft deleted successfully", updatedOrder: serializeBigInt(updatedOrder) };
    } catch (error) {
        console.error("❌ softDeleteOrder Error:", error);
        return { status: false, message: "Error soft deleting order" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted order by setting deletedAt to null)
export const restoreOrder = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredOrder = await prisma.order.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the order
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "Order restored successfully", restoredOrder: serializeBigInt(restoredOrder) };
    } catch (error) {
        console.error("❌ restoreOrder Error:", error);
        return { status: false, message: "Error restoring order" };
    }
};

// 🔴 DELETE
export const deleteOrder = async (id: number) => {
    try {
        await prisma.order.delete({ where: { id } });
        return { status: true, message: "Order deleted successfully" };
    } catch (error) {
        console.error("❌ deleteOrder Error:", error);
        return { status: false, message: "Error deleting order" };
    }
};

export async function refreshPendingOrdersShippingStatus() {
    try {
        // Calculate the cutoff date/time (1 hour ago)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Fetch orders with delivered = false and lastRefreshAt <= oneHourAgo or null
        const ordersToRefresh = await prisma.order.findMany({
            where: {
                delivered: false,
                OR: [
                    { lastRefreshAt: null },
                    { lastRefreshAt: { lt: oneHourAgo } }
                ],
            },
            orderBy: {
                lastRefreshAt: 'asc',
            },
            take: 100,
            // select: {
            //     id: true,
            //     orderNumber: true,
            //     lastRefreshAt: true,
            //     shippingApiResult: true,
            // },
            include: {
                items: {
                    include: {
                        dropshipperVariant: {
                            include: {
                                supplierProductVariant: {
                                    include: {
                                        variant: true
                                    }
                                }
                            }
                        },
                        dropshipperProduct: true,
                    },
                },
            },
        });

        logMessage('info', `Found ${ordersToRefresh.length} orders to refresh shipping status`);

        return {
            status: true,
            message: `Fetched ${ordersToRefresh.length} orders for shipping status refresh`,
            orders: ordersToRefresh,
        };

    } catch (error) {
        logMessage('error', 'Error fetching orders for shipping status refresh', { error });
        return {
            status: false,
            message: 'Failed to fetch orders for shipping status refresh',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function createRTOInventory(RTOInventory: RTOInventory) {
    try {
        const {
            order,
            orderItem,
            dropshipper,
            dropshipperProduct,
            dropshipperProductVariant,
            quantity,
            price,
        } = RTOInventory;

        // Check for existing RTO Inventory using unique orderItem ID
        const existing = await prisma.rtoInventory.findFirst({
            where: {
                orderItemId: orderItem.connect.id,
            },
        });

        if (existing) {
            return {
                status: false,
                message: 'RTO Inventory already exists for this order item.',
                existing: serializeBigInt(existing),
            };
        }

        // Create new RTO Inventory
        const newOrder = await prisma.rtoInventory.create({
            data: {
                order,
                orderItem,
                dropshipper,
                dropshipperProduct,
                dropshipperProductVariant,
                quantity,
                price,
                createdAt: new Date(),
            },
        });

        return { status: true, order: serializeBigInt(newOrder) };

    } catch (error) {
        console.error(`Error creating RTO Inventory:`, error);
        return { status: false, message: 'Internal Server Error' };
    }
}
