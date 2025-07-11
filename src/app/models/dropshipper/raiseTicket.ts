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

export async function generateTicketNumber() {
    let isTicketNumberTaken = true;
    let ticketNumber = '';

    while (isTicketNumberTaken) {
        // Generate a random 6-digit number
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        ticketNumber = `TCKT-${randomNumber}`;

        // Check if this ticket number already exists
        const existingTicket = await prisma.raiseTicket.findUnique({
            where: { ticketNumber },
        });

        if (!existingTicket) {
            isTicketNumberTaken = false;
        }
    }

    return ticketNumber;
}

export async function createRaiseTicket(adminId: number, adminRole: string, raiseTicket: RaiseTicket) {

    try {
        const { dropshipper, description, gallery } = raiseTicket;

        // Generate a unique slug for the brand
        const ticketNumber = await generateTicketNumber();

        const newRaiseTicket = await prisma.raiseTicket.create({
            data: {
                dropshipper,
                description,
                ticketNumber,
                gallery,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        return { status: true, raiseTicket: serializeBigInt(newRaiseTicket) };
    } catch (error) {
        console.error(`Error creating raiseTicket:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}


export async function createTicketOrder(adminId: number, adminRole: string, raiseTicketOrder: RaiseTicketOrder) {

    try {
        const { raiseTicket, order } = raiseTicketOrder;

        const ticketOrder = await prisma.ticketOrder.create({
            data: {
                raiseTicket,
                order,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        return { status: true, brand: serializeBigInt(ticketOrder) };
    } catch (error) {
        console.error(`Error creating brand:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getRaiseTicketsList({
    dropshipperId,
    search = '',
    page = 1,
    limit = 10,
}: {
    dropshipperId: number;
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const skip = (page - 1) * limit;

        // ✅ Build where condition first
        const whereCondition: Record<string, any> = {
            dropshipperId,
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
