import prisma from "@/lib/prisma";

interface GoodPincode {
    id?: bigint;
    pincode: string;
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

export async function createGoodPincode(adminId: number, adminRole: string, goodPincode: GoodPincode) {

    try {
        const {
            pincode,
            status,
            createdBy,
            createdByRole,
        } = goodPincode;

        const newGoodPincode = await prisma.goodPincode.create({
            data: {
                pincode,
                status,
                createdAt: new Date(),
                createdBy: createdBy,
                createdByRole: createdByRole,
            },
        });

        return { status: true, goodPincode: serializeBigInt(newGoodPincode) };
    } catch (error) {
        console.error(`Error creating goodPincode:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}
// Bulk import for good pincodes
export async function importGoodPincodes(adminId: number, adminRole: string, goodPincodes: { pincode: string }[]) {
    try {
        // Filter out any goodPincode entries where pincode is empty or null
        const validGoodPincodes = goodPincodes.filter(goodPincode => goodPincode.pincode && goodPincode.pincode.trim() !== '');

        if (validGoodPincodes.length === 0) {
            return { status: false, message: 'No valid pincodes to import.' };
        }

        // Check which pincodes already exist in the database
        const existingPincodes = await prisma.goodPincode.findMany({
            where: {
                pincode: {
                    in: validGoodPincodes.map(goodPincode => goodPincode.pincode),
                },
            },
            select: {
                pincode: true,
            },
        });

        // Extract existing pincodes from the result
        const existingPincodeSet = new Set(existingPincodes.map(p => p.pincode));

        // Filter out the pincodes that already exist
        const newGoodPincodes = validGoodPincodes.filter(goodPincode => !existingPincodeSet.has(goodPincode.pincode));

        if (newGoodPincodes.length === 0) {
            return { status: false, message: 'All pincodes already exist in the database.' };
        }

        // Prepare data for bulk creation
        const goodPincodeData = newGoodPincodes.map(goodPincode => ({
            pincode: goodPincode.pincode,
            status: true, // Default status, you can modify this as needed
            createdAt: new Date(),
            createdBy: adminId,
            createdByRole: adminRole,
        }));

        // Bulk insert into the database
        const result = await prisma.goodPincode.createMany({
            data: goodPincodeData,
        });

        // Return the result
        return { status: true, message: `${result.count} pincodes imported successfully.` };
    } catch (error) {
        console.error('Error importing goodPincodes:', error);
        return { status: false, message: 'Internal Server Error' };
    }
}

// 🟡 UPDATE
export const updateGoodPincode = async (
    adminId: number,
    adminRole: string,
    goodPincodeId: number,
    data: GoodPincode
) => {
    try {
        const {
            pincode,
            status,
            updatedBy,
            updatedByRole,
        } = data;

        const goodPincode = await prisma.goodPincode.update({
            where: { id: goodPincodeId }, // Assuming 'id' is the correct primary key field
            data: {
                pincode,
                status,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, goodPincode: serializeBigInt(goodPincode) };
    } catch (error) {
        console.error("❌ updateGoodPincode Error:", error);
        return { status: false, message: "Error updating goodPincode" };
    }
};

// 🔵 GET BY ID
export const getGoodPincodeById = async (id: number) => {
    try {
        const goodPincode = await prisma.goodPincode.findUnique({
            where: { id },
        });

        if (!goodPincode) return { status: false, message: "GoodPincode not found" };
        return { status: true, goodPincode: serializeBigInt(goodPincode) };
    } catch (error) {
        console.error("❌ getGoodPincodeById Error:", error);
        return { status: false, message: "Error fetching goodPincode" };
    }
};

export const getGoodPincodeByPincode = async (pincode: string) => {
    try {
        const goodPincode = await prisma.goodPincode.findFirst({
            where: { pincode },
        });

        if (goodPincode) {
            return {
                status: false,
                message: `Pincode "${pincode}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `Pincode "${pincode}" is available.`,
        };
    } catch (error) {
        console.error("❌ getGoodPincodeByPincode Error:", error);
        return { status: false, message: "Error fetching goodPincode" };
    }
};

export const getGoodPincodeByPincodeForUpdate = async (pincode: string, goodPincodeId: number) => {
    try {
        const goodPincode = await prisma.goodPincode.findFirst({
            where: {
                pincode,
                NOT: {
                    id: goodPincodeId,  // Exclude the current product being updated
                }
            },
        });

        if (goodPincode) {
            return {
                status: false,
                message: `Pincode "${pincode}" is already linked to goodPincodeId ${goodPincodeId}.`,
            };
        }

        return {
            status: true,
            message: `Pincode "${pincode}" is available for updating to goodPincodeId ${goodPincodeId}.`,
        };
    } catch (error) {
        console.error("❌ getGoodPincodeByPincode Error:", error);
        return { status: false, message: "Error fetching goodPincode" };
    }
};

// 🟣 GET ALL
export const getAllGoodPincodes = async () => {
    try {
        const goodPincodes = await prisma.goodPincode.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, goodPincodes: serializeBigInt(goodPincodes) };
    } catch (error) {
        console.error("❌ getAllGoodPincodes Error:", error);
        return { status: false, message: "Error fetching goodPincodes" };
    }
};

export const getGoodPincodesByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const goodPincodes = await prisma.goodPincode.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, goodPincodes: serializeBigInt(goodPincodes) };
    } catch (error) {
        console.error(`Error fetching goodPincodes by status (${status}):`, error);
        return { status: false, message: "Error fetching goodPincodes" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteGoodPincode = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedGoodPincode = await prisma.goodPincode.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "GoodPincode soft deleted successfully", updatedGoodPincode: serializeBigInt(updatedGoodPincode) };
    } catch (error) {
        console.error("❌ softDeleteGoodPincode Error:", error);
        return { status: false, message: "Error soft deleting goodPincode" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted goodPincode by setting deletedAt to null)
export const restoreGoodPincode = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredGoodPincode = await prisma.goodPincode.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the goodPincode
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "GoodPincode restored successfully", restoredGoodPincode: serializeBigInt(restoredGoodPincode) };
    } catch (error) {
        console.error("❌ restoreGoodPincode Error:", error);
        return { status: false, message: "Error restoring goodPincode" };
    }
};

// 🔴 DELETE
export const deleteGoodPincode = async (id: number) => {
    try {
        await prisma.goodPincode.delete({ where: { id } });
        return { status: true, message: "GoodPincode deleted successfully" };
    } catch (error) {
        console.error("❌ deleteGoodPincode Error:", error);
        return { status: false, message: "Error deleting goodPincode" };
    }
};