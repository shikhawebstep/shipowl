import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

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

export const getRTOInventories = async (dropshipperId: number) => {
    try {
        const inventories = await prisma.rtoInventory.findMany({
            where: { dropshipperId },
            orderBy: { id: "desc" },
            include: {
                dropshipperProductVariant: {
                    include: {
                        supplierProductVariant: {
                            include: {
                                variant: true
                            }
                        }
                    }
                }
            }
        });

        logMessage('info', 'RTO inventories fetched successfully', { dropshipperId });

        return {
            status: true,
            message: "RTO inventories fetched successfully",
            inventories: serializeBigInt(inventories),
        };

    } catch (error) {
        logMessage('error', 'Error fetching RTO inventories', { error, dropshipperId });

        return {
            status: false,
            message: "Failed to fetch RTO inventories",
            inventories: [],
        };
    }
};
