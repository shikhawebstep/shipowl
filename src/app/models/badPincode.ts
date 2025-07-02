import prisma from "@/lib/prisma";

interface BadPincode {
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

export async function createBadPincode(adminId: number, adminRole: string, badPincode: BadPincode) {

    try {
        const {
            pincode,
            status,
            createdBy,
            createdByRole,
        } = badPincode;

        const newBadPincode = await prisma.badPincode.create({
            data: {
                pincode,
                status,
                createdAt: new Date(),
                createdBy: createdBy,
                createdByRole: createdByRole,
            },
        });

        return { status: true, badPincode: serializeBigInt(newBadPincode) };
    } catch (error) {
        console.error(`Error creating badPincode:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// Bulk import for bad pincodes
export async function importBadPincodes(adminId: number, adminRole: string, badPincodes: { pincode: string }[]) {
    try {
        // Filter out any badPincode entries where pincode is empty or null
        const validBadPincodes = badPincodes.filter(badPincode => badPincode.pincode && badPincode.pincode.trim() !== '');

        if (validBadPincodes.length === 0) {
            return { status: false, message: 'No valid pincodes to import.' };
        }

        // Check which pincodes already exist in the database
        const existingPincodes = await prisma.badPincode.findMany({
            where: {
                pincode: {
                    in: validBadPincodes.map(badPincode => badPincode.pincode),
                },
            },
            select: {
                pincode: true,
            },
        });

        // Extract existing pincodes from the result
        const existingPincodeSet = new Set(existingPincodes.map(p => p.pincode));

        // Filter out the pincodes that already exist
        const newBadPincodes = validBadPincodes.filter(badPincode => !existingPincodeSet.has(badPincode.pincode));

        if (newBadPincodes.length === 0) {
            return { status: false, message: 'All pincodes already exist in the database.' };
        }

        // Prepare data for bulk creation
        const badPincodeData = newBadPincodes.map(badPincode => ({
            pincode: badPincode.pincode,
            status: true, // Default status, you can modify this as needed
            createdAt: new Date(),
            createdBy: adminId,
            createdByRole: adminRole,
        }));

        // Bulk insert into the database
        const result = await prisma.badPincode.createMany({
            data: badPincodeData,
        });

        // Return the result
        return { status: true, message: `${result.count} pincodes imported successfully.` };
    } catch (error) {
        console.error('Error importing badPincodes:', error);
        return { status: false, message: 'Internal Server Error' };
    }
}

// 🟡 UPDATE
export const updateBadPincode = async (
    adminId: number,
    adminRole: string,
    badPincodeId: number,
    data: BadPincode
) => {
    try {
        const {
            pincode,
            status,
            updatedBy,
            updatedByRole,
        } = data;

        const badPincode = await prisma.badPincode.update({
            where: { id: badPincodeId }, // Assuming 'id' is the correct primary key field
            data: {
                pincode,
                status,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, badPincode: serializeBigInt(badPincode) };
    } catch (error) {
        console.error("❌ updateBadPincode Error:", error);
        return { status: false, message: "Error updating badPincode" };
    }
};

// 🔵 GET BY ID
export const getBadPincodeById = async (id: number) => {
    try {
        const badPincode = await prisma.badPincode.findUnique({
            where: { id },
        });

        if (!badPincode) return { status: false, message: "BadPincode not found" };
        return { status: true, badPincode: serializeBigInt(badPincode) };
    } catch (error) {
        console.error("❌ getBadPincodeById Error:", error);
        return { status: false, message: "Error fetching badPincode" };
    }
};

export const getBadPincodeByPincode = async (pincode: string) => {
    try {
        const badPincode = await prisma.badPincode.findFirst({
            where: { pincode },
        });

        if (badPincode) {
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
        console.error("❌ getBadPincodeByPincode Error:", error);
        return { status: false, message: "Error fetching badPincode" };
    }
};

export const getBadPincodeByPincodeForUpdate = async (pincode: string, badPincodeId: number) => {
    try {
        const badPincode = await prisma.badPincode.findFirst({
            where: {
                pincode,
                NOT: {
                    id: badPincodeId,  // Exclude the current product being updated
                }
            },
        });

        if (badPincode) {
            return {
                status: false,
                message: `Pincode "${pincode}" is already linked to badPincodeId ${badPincodeId}.`,
            };
        }

        return {
            status: true,
            message: `Pincode "${pincode}" is available for updating to badPincodeId ${badPincodeId}.`,
        };
    } catch (error) {
        console.error("❌ getBadPincodeByPincode Error:", error);
        return { status: false, message: "Error fetching badPincode" };
    }
};

// 🟣 GET ALL
export const getAllBadPincodes = async () => {
    try {
        const badPincodes = await prisma.badPincode.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, badPincodes: serializeBigInt(badPincodes) };
    } catch (error) {
        console.error("❌ getAllBadPincodes Error:", error);
        return { status: false, message: "Error fetching badPincodes" };
    }
};

export const getBadPincodesByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const badPincodes = await prisma.badPincode.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, badPincodes: serializeBigInt(badPincodes) };
    } catch (error) {
        console.error(`Error fetching badPincodes by status (${status}):`, error);
        return { status: false, message: "Error fetching badPincodes" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteBadPincode = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedBadPincode = await prisma.badPincode.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "BadPincode soft deleted successfully", updatedBadPincode: serializeBigInt(updatedBadPincode) };
    } catch (error) {
        console.error("❌ softDeleteBadPincode Error:", error);
        return { status: false, message: "Error soft deleting badPincode" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted badPincode by setting deletedAt to null)
export const restoreBadPincode = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredBadPincode = await prisma.badPincode.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the badPincode
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "BadPincode restored successfully", restoredBadPincode: serializeBigInt(restoredBadPincode) };
    } catch (error) {
        console.error("❌ restoreBadPincode Error:", error);
        return { status: false, message: "Error restoring badPincode" };
    }
};

// 🔴 DELETE
export const deleteBadPincode = async (id: number) => {
    try {
        await prisma.badPincode.delete({ where: { id } });
        return { status: true, message: "BadPincode deleted successfully" };
    } catch (error) {
        console.error("❌ deleteBadPincode Error:", error);
        return { status: false, message: "Error deleting badPincode" };
    }
};