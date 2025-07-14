import prisma from "@/lib/prisma";

// Serialize BigInt to string to avoid JSON issues
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

interface StaffPermissionFilter {
    panel?: string;
    module?: string;
    action?: string;
}

// ✅ VALID PANELS
const VALID_PANELS = ["Admin", "Supplier", "Dropshipper"];

// ✅ COMMON: Validate filter
const validateFilter = (filter: any, requiredFields = ["panel", "module", "action"]) => {
    for (const field of requiredFields) {
        if (!filter[field]) {
            return `Missing required filter property: ${field}`;
        }
    }
    if (!VALID_PANELS.includes(filter.panel)) {
        return `Invalid panel: ${filter.panel}`;
    }
    return null;
};

// ✅ COMMON: Fetch staff and validate
const getValidStaff = async (staffId: number) => {
    if (!staffId || isNaN(staffId)) return { message: "Invalid staff ID" };

    const staff = await prisma.adminStaff.findUnique({
        where: { id: staffId },
    });

    if (!staff || !staff.roleId) return { message: "Staff not found" };
    return { staff };
};

// 🔍 Get Permissions based on optional filter
export const getRolePermissions = async (filter: StaffPermissionFilter = {}) => {
    console.log("📥 getRolePermissions - Input Filter:", filter);
    try {
        const staffPermissions = await prisma.rolePermission.findMany({
            where: {
                ...(filter.panel && { panel: filter.panel }),
                ...(filter.module && { module: filter.module }),
                ...(filter.action && { action: filter.action }),
            },
            orderBy: { id: "desc" },
        });

        console.log("✅ getRolePermissions - Fetched Records:", staffPermissions.length);
        return {
            status: true,
            staffPermissions: serializeBigInt(staffPermissions),
        };
    } catch (error) {
        console.error("❌ getRolePermissions Error:", error);
        return {
            status: false,
            message: "Error fetching staff permissions",
        };
    }
};

// ✅ Check Permission Status for a Staff
export const checkStaffPermissionStatus = async (filter: StaffPermissionFilter = {}, staffId: number) => {
    console.log("📥 checkStaffPermissionStatus - Input:", { filter, staffId });

    try {
        const validationError = validateFilter(filter);
        if (validationError) return { status: false, message: validationError };

        const { staff, message: staffError } = await getValidStaff(staffId);
        if (staffError) return { status: false, message: staffError };

        if (!staff || !staff.roleId) {
            console.warn("⚠️ Staff not found with ID:", staffId);
            return {
                status: false,
                message: "Staff not found",
            };
        }

        console.log("👤 Fetched Staff:", { id: staff.id, roleId: staff.roleId });

        const permission = await prisma.rolePermission.findFirst({
            where: {
                panel: filter.panel,
                module: filter.module,
                action: filter.action,
            },
        });

        if (!permission) {
            console.warn("❌ No matching permission found");
            return {
                status: false,
                message: "No matching permission found for the given filter",
            };
        }

        console.log("🔎 Found Permission:", permission);

        const roleHasPermission = await prisma.roleHasPermission.findFirst({
            where: {
                rolePermissionId: permission.id,
                roleId: staff.roleId,
            },
            orderBy: { id: "desc" },
        });

        console.log("🔐 Role Permission Check:", roleHasPermission);

        if (!roleHasPermission) {
            return {
                status: false,
                message: "Action Unauthorized",
            };
        }

        return {
            status: true,
            message: "Action Authorized",
        };

    } catch (error) {
        console.error("❌ checkStaffPermissionStatus Error:", error);
        return {
            status: false,
            message: "Error fetching staff permissions",
        };
    }
};

// ✅ Get Permissions assigned to Staff
export const getRolePermissionsByStaffId = async (filter: StaffPermissionFilter = {}, staffId: number) => {
    console.log("📥 getRolePermissionsByStaffId - Input:", { filter, staffId });

    try {
        const { staff, message: staffError } = await getValidStaff(staffId);
        if (staffError) return { status: false, message: staffError };

        if (!staff || !staff.roleId) {
            console.warn("⚠️ Staff not found with ID:", staffId);
            return {
                status: false,
                message: "Staff not found",
            };
        }

        if (filter.panel) {
            const isValidPanel = VALID_PANELS.includes(filter.panel);
            if (!isValidPanel) {
                return {
                    status: false,
                    message: "Invalid panel provided",
                };
            }
        }

        const matchingPermissions = await prisma.rolePermission.findMany({
            where: {
                ...(filter.panel && { panel: filter.panel }),
                ...(filter.module && { module: filter.module }),
                ...(filter.action && { action: filter.action }),
            },
            orderBy: { id: 'desc' },
        });

        console.log("🔎 Matching Permissions Found:", matchingPermissions.length);

        if (!matchingPermissions.length) {
            return {
                status: false,
                message: "No matching permissions found for the given filter",
            };
        }

        const permissionIds = matchingPermissions.map(p => p.id);
        console.log("🧾 Permission IDs:", permissionIds);

        const assignedPermissions = await prisma.roleHasPermission.findMany({
            where: {
                rolePermissionId: { in: permissionIds },
                roleId: staff.roleId,
            },
            include: {
                permission: true,
            },
            orderBy: { id: 'desc' },
        });

        console.log("✅ Assigned Permissions:", assignedPermissions.length);

        if (!assignedPermissions.length) {
            return {
                status: false,
                message: "No permissions assigned to this staff for the given filter",
            };
        }

        return {
            status: true,
            message: "Permissions retrieved successfully",
            assignedPermissions: serializeBigInt(assignedPermissions),
        };
    } catch (error) {
        console.error("❌ getRolePermissionsByStaffId Error:", error);
        return {
            status: false,
            message: "Error retrieving staff permissions",
        };
    }
};
