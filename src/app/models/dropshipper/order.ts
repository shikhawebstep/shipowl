import prisma from "@/lib/prisma";

// Utility to recursively convert BigInt values to strings for JSON serialization
const serializeBigInt = <T>(obj: T): T => {
    if (typeof obj === "bigint") {
        return obj.toString() as unknown as T;
    }

    if (obj instanceof Date) {
        return obj; // Keep Date objects as-is
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

export const getDropshipperOrderById = async (
    dropshipperId: number,
    orderId: number
) => {
    try {
        const whereCondition = {
            AND: [
                { id: orderId },
                {
                    items: {
                        some: {
                            dropshipperProduct: {
                                dropshipperId,
                            },
                        },
                    },
                },
            ],
        };

        const order = await prisma.order.findFirst({
            where: whereCondition,
            orderBy: { id: "desc" },
            select: {
                id: true,
                awbNumber: true,
            },
        });

        if (!order) {
            return {
                status: false,
                message: `Order with ID ${orderId} not found for dropshipper ${dropshipperId}.`,
            };
        }

        return {
            status: true,
            order: serializeBigInt(order),
        };
    } catch (error) {
        console.error(
            `❌ Error fetching order by ID (${orderId}) for dropshipper (${dropshipperId}):`,
            error
        );
        return {
            status: false,
            message: "Error fetching order",
        };
    }
};

export const getDropshipperOrders = async (
    dropshipperId: number
) => {
    try {
        const whereCondition = {
            items: {
                some: {
                    dropshipperProduct: {
                        dropshipperId,
                    },
                },
            },
        };

        const orders = await prisma.order.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            select: {
                id: true,
                awbNumber: true,
            },
        });

        if (!orders || orders.length === 0) {
            return {
                status: false,
                message: `No orders found for dropshipper ID ${dropshipperId}.`,
            };
        }

        return {
            status: true,
            orders: serializeBigInt(orders),
        };
    } catch (error) {
        console.error(
            `❌ Error fetching orders for dropshipper (${dropshipperId}):`,
            error
        );
        return {
            status: false,
            message: "An error occurred while fetching orders.",
        };
    }
};
