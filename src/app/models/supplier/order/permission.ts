import prisma from "@/lib/prisma";

export const getPermissions = async () => {
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