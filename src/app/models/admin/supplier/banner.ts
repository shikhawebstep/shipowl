import prisma from "@/lib/prisma";

interface SupplierBanner {
    status: boolean;
    image: string;
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

export async function changeSupplierBanner(adminId: number, adminRole: string, brand: SupplierBanner) {
    try {
        const { status, image } = brand;

        // Check if a banner already exists (assuming one record only)
        const existingBanner = await prisma.supplierBanner.findFirst();

        if (existingBanner) {
            const updatedBanner = await prisma.supplierBanner.update({
                where: { id: existingBanner.id },
                data: {
                    status,
                    image,
                    updatedAt: new Date(),
                    updatedBy: adminId,
                    updatedByRole: adminRole,
                },
            });

            return { status: true, supplierBanner: serializeBigInt(updatedBanner), message: "Banner updated" };
        } else {
            const newSupplierBanner = await prisma.supplierBanner.create({
                data: {
                    status,
                    image,
                    createdAt: new Date(),
                    createdBy: adminId,
                    createdByRole: adminRole,
                },
            });

            return { status: true, supplierBanner: serializeBigInt(newSupplierBanner), message: "Banner created" };
        }
    } catch (error) {
        console.error(`Error handling banner:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getSupplierBanner() {
    try {
        const banner = await prisma.supplierBanner.findFirst({
            where: {
                status: true,
            },
        });

        if (!banner) {
            return { status: false, message: "No active supplier banner found" };
        }

        return { status: true, supplierBanner: serializeBigInt(banner) };
    } catch (error) {
        console.error('Error fetching supplier banner:', error);
        return { status: false, message: "Internal Server Error" };
    }
}

