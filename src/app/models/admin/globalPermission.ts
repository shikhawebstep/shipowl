import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface StaffPermissionFilter {
    panel?: string;
    module?: string;
    action?: string;
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

// 🔵 GET BY ID
export const getGlobalPermissionById = async (id: number) => {
    try {
        const permission = await prisma.globalPermission.findUnique({
            where: { id },
        });

        if (!permission) return { status: false, message: "Permission not found" };
        return { status: true, permission: serializeBigInt(permission) };
    } catch (error) {
        console.error("❌ getPermissionById Error:", error);
        return { status: false, message: "Error fetching permission" };
    }
};

// 🟣 GET ALL
export const getAllGlobalPermissions = async () => {
    try {
        const permissions = await prisma.globalPermission.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, permissions: serializeBigInt(permissions) };
    } catch (error) {
        console.error("❌ getAllPermissions Error:", error);
        return { status: false, message: "Error fetching permissions" };
    }
};

// 🔍 Professional: Filter by panel, module, action (any or all)
export const getGlobalPermissionsByFilter = async (
    filter: StaffPermissionFilter = {}
) => {
    try {
        const permission = await prisma.globalPermission.findFirst({
            where: {
                ...(filter.panel ? { panel: filter.panel } : {}),
                ...(filter.module ? { module: filter.module } : {}),
                ...(filter.action ? { action: filter.action } : {}),
            },
            orderBy: { id: 'desc' },
        });

        if (!permission) {
            return {
                status: false,
                message: 'Permission not found',
            };
        }

        if (!permission.status) {
            return {
                status: false,
                message: 'Access Denied',
            };
        }

        return {
            status: true,
            permission: serializeBigInt(permission),
        };
    } catch (error) {
        console.error('❌ getGlobalPermissionsByFilter Error:', error);
        return {
            status: false,
            message: 'Error fetching global permission',
        };
    }
};

export const getAllGlobalPermissionsByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition;
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

        const permissions = await prisma.globalPermission.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, permissions: serializeBigInt(permissions) };
    } catch (error) {
        console.error(`Error fetching permissions by status (${status}):`, error);
        return { status: false, message: "Error fetching permissions" };
    }
};

export const getGlobalPermissionsByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition: Record<string, unknown> = {
            panel: "admin",
        };

        switch (status) {
            case "active":
                whereCondition = { ...whereCondition, status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { ...whereCondition, status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { ...whereCondition, deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { ...whereCondition, deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const permissions = await prisma.globalPermission.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, permissions: serializeBigInt(permissions) };
    } catch (error) {
        console.error(`Error fetching permissions by status (${status}):`, error);
        return { status: false, message: "Error fetching permissions" };
    }
};

export const updateGlobalPermissions = async (
    adminId: number,
    adminRole: string,
    payload: {
        permissions: { permissionId: number; status: boolean }[];
        updatedAt?: Date;
        updatedBy?: number;
        updatedByRole?: string | null;
    }
) => {
    try {
        const updates = payload.permissions.map(({ permissionId, status }) =>
            prisma.globalPermission.update({
                where: { id: permissionId },
                data: {
                    status,
                    updatedAt: payload.updatedAt,
                    updatedBy: payload.updatedBy,
                    updatedByRole: payload.updatedByRole,
                },
            })
        );

        const result = await Promise.all(updates);

        return { status: true, updatedPermissions: serializeBigInt(result) };
    } catch (error) {
        logMessage("error", "Failed to update permissions", error);
        return { status: false, message: "Internal Server Error" };
    }
};
