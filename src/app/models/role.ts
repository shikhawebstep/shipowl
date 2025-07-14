import prisma from "@/lib/prisma";
import { deleteFile } from '@/utils/saveFiles';

// Utility: Convert BigInt fields to strings (for safe JSON serialization)
const serializeBigInt = <T>(obj: T): T => {
    if (typeof obj === "bigint") return obj.toString() as unknown as T;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(serializeBigInt) as unknown as T;
    if (obj && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        ) as T;
    }
    return obj;
};

interface Role {
    name: string;
    description: string;
    status: boolean;
    createdBy?: number;
    createdAt?: Date;
    createdByRole?: string;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number;
    deletedAt?: Date;
    deletedByRole?: string;
}

// 🟢 CREATE
export async function createRole(adminId: number, adminRole: string, role: Role) {
    try {
        const newRole = await prisma.role.create({
            data: {
                name: role.name,
                description: role.description,
                status: role.status,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        return {
            status: true,
            message: "Role created successfully.",
            role: serializeBigInt(newRole),
        };
    } catch (error) {
        console.error("❌ createRole Error:", error);
        return { status: false, message: "Failed to create role." };
    }
}

// 🟡 UPDATE
export async function updateRole(adminId: number, adminRole: string, roleId: number, data: Role) {
    try {
        data.updatedBy = adminId;
        data.updatedByRole = adminRole;
        data.updatedAt = new Date();

        const updated = await prisma.role.update({
            where: { id: roleId },
            data,
        });

        return {
            status: true,
            message: "Role updated successfully.",
            role: serializeBigInt(updated),
        };
    } catch (error) {
        console.error("❌ updateRole Error:", error);
        return { status: false, message: "Failed to update role." };
    }
}

// 🔵 GET ROLE BY ID
export async function getRoleById(id: number) {
    try {
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) return { status: false, message: "Role not found." };

        return {
            status: true,
            message: "Role fetched successfully.",
            role: serializeBigInt(role),
        };
    } catch (error) {
        console.error("❌ getRoleById Error:", error);
        return { status: false, message: "Failed to fetch role." };
    }
}

// 🔵 GET PERMISSION BY ID
export async function getRolePermissionById(permissionId: number) {
    try {
        const permission = await prisma.rolePermission.findUnique({ where: { id: permissionId } });
        if (!permission) return { status: false, message: "Permission not found." };

        return {
            status: true,
            message: "Permission fetched successfully.",
            role: serializeBigInt(permission),
        };
    } catch (error) {
        console.error("❌ getRolePermissionById Error:", error);
        return { status: false, message: "Failed to fetch permission." };
    }
}

// 🔵 GET PERMISSIONS BY ROLE ID
export async function getRolePermissionsByRoleId(roleId: number) {
    try {
        const permissions = await prisma.roleHasPermission.findMany({
            where: { roleId },
            include: { permission: true },
        });

        if (!permissions || permissions.length === 0) {
            return { status: false, message: "No permissions found for this role." };
        }

        return {
            status: true,
            message: "Permissions fetched successfully.",
            permissions: serializeBigInt(permissions),
        };
    } catch (error) {
        console.error("❌ getRolePermissionsByRoleId Error:", error);
        return { status: false, message: "Failed to fetch permissions." };
    }
}

export async function updateStaffPermissions(
    adminId: number,
    adminRole: string,
    payload: {
        roleId: number;
        permissionIds: number[];
    },
    panel: string
) {
    const { roleId, permissionIds } = payload;

    try {
        // Fetch current permissions
        const existingPermissions = await prisma.roleHasPermission.findMany({
            where: { roleId },
            select: { rolePermissionId: true },
        });

        const existingIds = existingPermissions.map(p => p.rolePermissionId);

        // Get valid permission IDs from database
        const validPermissions = await prisma.rolePermission.findMany({
            where: {
                id: {
                    in: permissionIds,
                },
                panel
            },
            select: {
                id: true,
            },
        });

        const validIds = validPermissions.map(p => p.id);

        const toRemove = existingIds.filter(id => !validIds.includes(id));
        const toAdd = validIds.filter(id => !existingIds.includes(id));
        const skipped = validIds.filter(id => existingIds.includes(id));

        // Safety check: log invalid IDs
        const invalidIds = permissionIds.filter(id => !validIds.includes(id));
        if (invalidIds.length > 0) {
            console.warn(`⚠️ Skipping invalid permission IDs: ${invalidIds.join(', ')}`);
        }

        // Remove old permissions
        if (toRemove.length > 0) {
            await prisma.roleHasPermission.deleteMany({
                where: {
                    roleId,
                    rolePermissionId: { in: toRemove },
                },
            });
        }

        // Add new permissions
        if (toAdd.length > 0) {
            const newAssignments = toAdd.map(id => ({
                roleId,
                rolePermissionId: id,
                createdBy: adminId,
                createdByRole: adminRole,
            }));

            await prisma.roleHasPermission.createMany({ data: newAssignments });
        }

        return {
            status: true,
            message: `Permissions updated successfully.`,
            assigned: toAdd,
            removed: toRemove,
            skipped,
            invalid: invalidIds,
        };

    } catch (error) {
        console.error("❌ updateStaffPermissions Error:", error);
        return {
            status: false,
            message: "Failed to update staff permissions.",
            error,
        };
    }
}

// 🟣 GET ALL ROLES
export async function getAllRoles() {
    try {
        const roles = await prisma.role.findMany({ orderBy: { id: "desc" } });
        return {
            status: true,
            message: "All roles fetched successfully.",
            roles: serializeBigInt(roles),
        };
    } catch (error) {
        console.error("❌ getAllRoles Error:", error);
        return { status: false, message: "Failed to fetch roles." };
    }
}

// 🟣 GET ROLES BY STATUS
export async function getRolesByStatus(status: "active" | "inactive" | "deleted" | "notDeleted") {
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
                throw new Error("Invalid status type.");
        }

        const roles = await prisma.role.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return {
            status: true,
            message: "Roles filtered by status successfully.",
            roles: serializeBigInt(roles),
        };
    } catch (error) {
        console.error(`❌ getRolesByStatus (${status}) Error:`, error);
        return { status: false, message: "Failed to fetch roles by status." };
    }
}

// 🔴 SOFT DELETE
export async function softDeleteRole(adminId: number, adminRole: string, id: number) {
    try {
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedByRole: adminRole,
                deletedAt: new Date(),
            },
        });

        return {
            status: true,
            message: "Role soft-deleted successfully.",
            updatedRole: serializeBigInt(updatedRole),
        };
    } catch (error) {
        console.error("❌ softDeleteRole Error:", error);
        return { status: false, message: "Failed to soft delete role." };
    }
}

// 🟢 RESTORE DELETED ROLE
export async function restoreRole(adminId: number, adminRole: string, id: number) {
    try {
        const restoredRole = await prisma.role.update({
            where: { id },
            data: {
                deletedAt: null,
                deletedBy: null,
                deletedByRole: null,
                updatedBy: adminId,
                updatedByRole: adminRole,
                updatedAt: new Date(),
            },
        });

        return {
            status: true,
            message: "Role restored successfully.",
            restoredRole: serializeBigInt(restoredRole),
        };
    } catch (error) {
        console.error("❌ restoreRole Error:", error);
        return { status: false, message: "Failed to restore role." };
    }
}

// 🔴 PERMANENT DELETE
export async function deleteRole(id: number) {
    try {
        await prisma.role.delete({ where: { id } });
        return { status: true, message: "Role permanently deleted." };
    } catch (error) {
        console.error("❌ deleteRole Error:", error);
        return { status: false, message: "Failed to delete role." };
    }
}
