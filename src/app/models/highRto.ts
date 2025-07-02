import prisma from "@/lib/prisma";

interface HighRto {
    id?: bigint;
    pincode: string;
    city: {
        connect: { id: number }; // or whatever your relation is
    };
    state: {
        connect: { id: number }; // or whatever your relation is
    };
    country: {
        connect: { id: number }; // or whatever your relation is
    };
    status: boolean;
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

export async function createHighRto(adminId: number, adminRole: string, highRto: HighRto) {

    try {
        const {
            pincode,
            city,
            state,
            country,
            status,
            createdBy,
            createdByRole,
        } = highRto;

        const newHighRto = await prisma.highRto.create({
            data: {
                pincode,
                city,
                state,
                country,
                status,
                createdAt: new Date(),
                createdBy: createdBy,
                createdByRole: createdByRole,
            },
        });

        return { status: true, highRto: serializeBigInt(newHighRto) };
    } catch (error) {
        console.error(`Error creating highRto:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateHighRto = async (
    adminId: number,
    adminRole: string,
    highRtoId: number,
    data: HighRto
) => {
    try {
        const {
            pincode,
            city,
            state,
            country,
            status,
            updatedBy,
            updatedByRole,
        } = data;

        const highRto = await prisma.highRto.update({
            where: { id: highRtoId }, // Assuming 'id' is the correct primary key field
            data: {
                pincode,
                city,
                state,
                country,
                status,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, highRto: serializeBigInt(highRto) };
    } catch (error) {
        console.error("❌ updateHighRto Error:", error);
        return { status: false, message: "Error updating highRto" };
    }
};

// 🔵 GET BY ID
export const getHighRtoById = async (id: number) => {
    try {
        const highRto = await prisma.highRto.findUnique({
            where: { id },
        });

        if (!highRto) return { status: false, message: "HighRto not found" };
        return { status: true, highRto: serializeBigInt(highRto) };
    } catch (error) {
        console.error("❌ getHighRtoById Error:", error);
        return { status: false, message: "Error fetching highRto" };
    }
};

export const getHighRtoByPincode = async (pincode: string) => {
    try {
        const highRto = await prisma.highRto.findFirst({
            where: { pincode },
        });

        if (highRto) {
            return {
                status: true,
                message: `Pincode "${pincode}" is already in use.`,
            };
        }

        return {
            status: false,
            message: `Pincode "${pincode}" is available.`,
        };
    } catch (error) {
        console.error("❌ getHighRtoByPincode Error:", error);
        return { status: false, message: "Error fetching highRto" };
    }
};

export const getHighRtoByPincodeForUpdate = async (pincode: string, highRtoId: number) => {
    try {
        const highRto = await prisma.highRto.findFirst({
            where: {
                pincode,
                NOT: {
                    id: highRtoId,  // Exclude the current product being updated
                }
            },
        });

        if (highRto) {
            return {
                status: false,
                message: `Pincode "${pincode}" is already linked to highRtoId ${highRtoId}.`,
            };
        }

        return {
            status: true,
            message: `Pincode "${pincode}" is available for updating to highRtoId ${highRtoId}.`,
        };
    } catch (error) {
        console.error("❌ getHighRtoByPincode Error:", error);
        return { status: false, message: "Error fetching highRto" };
    }
};

// 🟣 GET ALL
export const getAllHighRtos = async () => {
    try {
        const highRtos = await prisma.highRto.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, highRtos: serializeBigInt(highRtos) };
    } catch (error) {
        console.error("❌ getAllHighRtos Error:", error);
        return { status: false, message: "Error fetching highRtos" };
    }
};

export const getHighRtosByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const highRtos = await prisma.highRto.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, highRtos: serializeBigInt(highRtos) };
    } catch (error) {
        console.error(`Error fetching highRtos by status (${status}):`, error);
        return { status: false, message: "Error fetching highRtos" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteHighRto = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedHighRto = await prisma.highRto.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "HighRto soft deleted successfully", updatedHighRto: serializeBigInt(updatedHighRto) };
    } catch (error) {
        console.error("❌ softDeleteHighRto Error:", error);
        return { status: false, message: "Error soft deleting highRto" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted highRto by setting deletedAt to null)
export const restoreHighRto = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredHighRto = await prisma.highRto.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the highRto
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "HighRto restored successfully", restoredHighRto: serializeBigInt(restoredHighRto) };
    } catch (error) {
        console.error("❌ restoreHighRto Error:", error);
        return { status: false, message: "Error restoring highRto" };
    }
};

// 🔴 DELETE
export const deleteHighRto = async (id: number) => {
    try {
        await prisma.highRto.delete({ where: { id } });
        return { status: true, message: "HighRto deleted successfully" };
    } catch (error) {
        console.error("❌ deleteHighRto Error:", error);
        return { status: false, message: "Error deleting highRto" };
    }
};