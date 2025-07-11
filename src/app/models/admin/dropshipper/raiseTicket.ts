import prisma from "@/lib/prisma";

interface AdminReviewRaiseTicket {
    status: boolean;
    responder: {
        connect: { id: number };
    };
    responseByRole: string;
    responseAt: Date;
}

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

interface RaiseTicket {
    dropshipper: {
        connect: { id: number };
    };
    description: string;
    ticketNumber?: string;
    gallery: string;
    status?: boolean;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

interface RaiseTicketOrder {
    raiseTicket: {
        connect: { id: number };
    };
    order: {
        connect: { id: number };
    };
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

export async function getRaiseTicketsList({
    search = '',
    page = 1,
    limit = 10,
}: {
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const skip = (page - 1) * limit;

        // ✅ Build where condition first
        const whereCondition: Record<string, any> = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                {
                    ticketNumber: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        // ✅ Use whereCondition in both queries
        const [tickets, total] = await Promise.all([
            prisma.raiseTicket.findMany({
                where: whereCondition,
                include: {
                    dropshipper: true,
                    ticketOrders: {
                        select: {
                            id: true,
                            orderId: true,
                            order: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.raiseTicket.count({
                where: whereCondition,
            }),
        ]);

        return {
            status: true,
            data: serializeBigInt({
                tickets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }),
        };
    } catch (error) {
        console.error('❌ Error fetching raise tickets:', error);
        return {
            status: false,
            message: 'Internal Server Error',
            error,
        };
    }
}

export async function getRaiseTicketById({
    id,
}: {
    id: number;
}) {
    try {

        // ✅ Build where condition first
        const whereCondition: Record<string, any> = {
            id,
            deletedAt: null,
        };

        const raiseTicket = await prisma.raiseTicket.findFirst({
            where: whereCondition,
            include: {
                dropshipper: true,
                ticketOrders: {
                    select: {
                        id: true,
                        orderId: true,
                        order: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!raiseTicket) {
            return {
                status: false,
                message: 'Raise ticket not found.',
            };
        }

        return {
            status: true,
            raiseTicket: serializeBigInt(raiseTicket),
        };
    } catch (error) {
        console.error('❌ Error fetching raise tickets:', error);
        return {
            status: false,
            message: 'Internal Server Error',
            error,
        };
    }
}

export async function adminReviewRaiseTicket(raiseTicketId: number, adminReviewRaiseTicketPayload: AdminReviewRaiseTicket) {
    try {

        const { status, responder, responseByRole, responseAt } = adminReviewRaiseTicketPayload;

        // ✅ Check if ticket exists
        const ticketExists = await prisma.raiseTicket.findUnique({
            where: { id: raiseTicketId, deletedAt: null },
        });

        if (!ticketExists) {
            return {
                status: false,
                message: "Raise ticket not found.",
            };
        }

        // ✅ Perform the update
        const updatedTicket = await prisma.raiseTicket.update({
            where: { id: raiseTicketId },
            data: {
                status,
                responder,
                responseByRole,
                responseAt
            },
            include: {
                dropshipper: true,
                ticketOrders: {
                    select: {
                        id: true,
                        orderId: true,
                        order: true,
                    },
                },
            },
        });

        return {
            status: true,
            message: "Raise ticket reviewed successfully.",
            raiseTicket: serializeBigInt(updatedTicket),
        };
    } catch (error) {
        console.error("❌ Error reviewing raise ticket:", error);
        return {
            status: false,
            message: "Internal Server Error",
            error,
        };
    }
}
