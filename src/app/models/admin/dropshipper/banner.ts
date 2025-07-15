import prisma from "@/lib/prisma";

interface DropshipperBanner {
    status: boolean;
    image: string;
    url?: string;
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

export async function changeDropshipperBanner(adminId: number, adminRole: string, brand: DropshipperBanner) {
    try {
        const { status, image, url } = brand;

        // Check if a banner already exists (assuming one record only)
        const existingBanner = await prisma.dropshipperBanner.findFirst();

        if (existingBanner) {
            const updatedBanner = await prisma.dropshipperBanner.update({
                where: { id: existingBanner.id },
                data: {
                    status,
                    image,
                    url,
                    updatedAt: new Date(),
                    updatedBy: adminId,
                    updatedByRole: adminRole,
                },
            });

            return { status: true, dropshipperBanner: serializeBigInt(updatedBanner), message: "Banner updated" };
        } else {
            const newDropshipperBanner = await prisma.dropshipperBanner.create({
                data: {
                    status,
                    image,
                    url,
                    createdAt: new Date(),
                    createdBy: adminId,
                    createdByRole: adminRole,
                },
            });

            return { status: true, dropshipperBanner: serializeBigInt(newDropshipperBanner), message: "Banner created" };
        }
    } catch (error) {
        console.error(`Error handling banner:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getDropshipperBanner() {
    try {
        const banner = await prisma.dropshipperBanner.findFirst();

        if (!banner) {
            return { status: false, message: "No active dropshipper banner found" };
        }

        return { status: true, dropshipperBanner: serializeBigInt(banner) };
    } catch (error) {
        console.error('Error fetching dropshipper banner:', error);
        return { status: false, message: "Internal Server Error" };
    }
}

