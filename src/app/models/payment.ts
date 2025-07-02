import prisma from "@/lib/prisma";

interface Payment {
    id?: string;
    transactionId: string;
    cycle: string;
    amount: number;
    status: string;
    date?: Date;
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

export async function checkTransactionIdAvailability(transactionId: string) {
    try {
        const existing = await prisma.payment.findUnique({
            where: { transactionId },
        });

        if (existing) {
            return {
                status: false,
                message: `Transaction ID "${transactionId}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `Transaction ID "${transactionId}" is available.`,
        };
    } catch (error) {
        console.error("Error checking Transaction ID:", error);
        return {
            status: false,
            message: "Error while checking Transaction ID availability.",
        };
    }
}

export async function checkTransactionIdAvailabilityForUpdate(transactionId: string, paymentId: number) {
    try {
        const existing = await prisma.payment.findUnique({
            where: {
                transactionId,
                NOT: {
                    id: paymentId,  // Exclude the current product being updated
                },
            },

        });

        if (existing) {
            return {
                status: false,
                message: `Transaction ID "${transactionId}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `Transaction ID "${transactionId}" is available.`,
        };
    } catch (error) {
        console.error("Error checking Transaction ID:", error);
        return {
            status: false,
            message: "Error while checking Transaction ID availability.",
        };
    }
}

export async function createPayment(adminId: number, adminRole: string, payment: Payment) {

    try {
        const {
            transactionId,
            cycle,
            amount,
            date,
            status,
            createdBy,
            createdByRole,
        } = payment;

        const newPayment = await prisma.payment.create({
            data: {
                transactionId,
                cycle,
                amount,
                date,
                status,
                createdAt: new Date(),
                createdBy: createdBy,
                createdByRole: createdByRole,
            },
        });

        return { status: true, payment: newPayment };
    } catch (error) {
        console.error(`Error creating payment:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updatePayment = async (
    adminId: number,
    adminRole: string,
    paymentId: number,
    data: Payment
) => {
    try {
        const {
            transactionId,
            cycle,
            amount,
            date,
            status,
            updatedBy,
            updatedByRole,
        } = data;

        const payment = await prisma.payment.update({
            where: { id: paymentId }, // Assuming 'id' is the correct primary key field
            data: {
                transactionId,
                cycle,
                amount,
                date,
                status,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, payment };
    } catch (error) {
        console.error("❌ updatePayment Error:", error);
        return { status: false, message: "Error updating payment" };
    }
};

// 🔵 GET BY ID
export const getPaymentById = async (id: number) => {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) return { status: false, message: "Payment not found" };
        return { status: true, payment };
    } catch (error) {
        console.error("❌ getPaymentById Error:", error);
        return { status: false, message: "Error fetching payment" };
    }
};

// 🟣 GET ALL
export const getAllPayments = async () => {
    try {
        const payments = await prisma.payment.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, payments };
    } catch (error) {
        console.error("❌ getAllPayments Error:", error);
        return { status: false, message: "Error fetching payments" };
    }
};

export const getPaymentsByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const payments = await prisma.payment.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, payments };
    } catch (error) {
        console.error(`Error fetching payments by status (${status}):`, error);
        return { status: false, message: "Error fetching payments" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeletePayment = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "Payment soft deleted successfully", updatedPayment };
    } catch (error) {
        console.error("❌ softDeletePayment Error:", error);
        return { status: false, message: "Error soft deleting payment" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted payment by setting deletedAt to null)
export const restorePayment = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredPayment = await prisma.payment.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the payment
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "Payment restored successfully", restoredPayment };
    } catch (error) {
        console.error("❌ restorePayment Error:", error);
        return { status: false, message: "Error restoring payment" };
    }
};

// 🔴 DELETE
export const deletePayment = async (id: number) => {
    try {
        await prisma.payment.delete({ where: { id } });
        return { status: true, message: "Payment deleted successfully" };
    } catch (error) {
        console.error("❌ deletePayment Error:", error);
        return { status: false, message: "Error deleting payment" };
    }
};