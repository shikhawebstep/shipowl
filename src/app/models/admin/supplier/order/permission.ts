import prisma from "@/lib/prisma";

export const getSupplierOrderPermissions = async () => {
    try {
        const permissions = await prisma.supplierOrderPermission.findMany({
            orderBy: {
                id: 'asc',
            }
        });

        return { status: true, permissions };
    } catch (error) {
        console.error("❌ getPermissions Error:", error);
        return { status: false, message: "Error fetching permissions" };
    }
};

export const updateSupplierOrderPermission = async (
    adminId: number,
    adminRole: string,
    data: {
        permissions: { permissionIndex: string; status: boolean }[];
        updatedBy?: number;
        updatedAt?: Date;
    }
) => {
    try {
        // Use boolean instead of any
        const updateData: Record<string, boolean> = {};

        for (const perm of data.permissions) {
            updateData[perm.permissionIndex] = perm.status;
        }

        // Update the single row with id = 1 (change if needed)
        const updatedPermissions = await prisma.supplierOrderPermission.update({
            where: { id: 1 },
            data: updateData,
        });

        return { status: true, updatedPermissions };
    } catch (error) {
        console.error("❌ updatePermission Error:", error);
        return { status: false, message: "Error updating permissions" };
    }
};
