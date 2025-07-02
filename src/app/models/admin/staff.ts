import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface AdminStaff {
    admin: {
        connect: { id: number }
    }
    id?: bigint; // Optional: ID of the adminStaff (if exists)
    name: string; // Name of the adminStaff
    profilePicture: string,
    email: string; // Email address of the adminStaff
    phoneNumber: string;
    permissions: string;
    password: string; // Password for the adminStaff account
    permanentAddress: string; // Permanent address of the adminStaff
    permanentPostalCode: string; // Postal code of the permanent address
    permanentCity: {
        connect: { id: number }; // City ID for permanent city (connected to a city record)
    };
    permanentState: {
        connect: { id: number }; // State ID for permanent state (connected to a state record)
    };
    permanentCountry: {
        connect: { id: number }; // Country ID for permanent country (connected to a country record)
    };
    status: boolean; // Status of the adminStaff (active, inactive, etc.)
    createdAt?: Date; // Timestamp of when the adminStaff was created
    updatedAt?: Date; // Timestamp of when the adminStaff was last updated
    deletedAt?: Date | null; // Timestamp of when the adminStaff was deleted, or null if not deleted
    createdBy?: number; // ID of the adminStaff who created the adminStaff
    updatedBy?: number; // ID of the adminStaff who last updated the adminStaff
    deletedBy?: number; // ID of the adminStaff who deleted the adminStaff
    createdByRole?: string | null; // Role of the adminStaff who created the adminStaff
    updatedByRole?: string | null; // Role of the adminStaff who last updated the adminStaff
    deletedByRole?: string | null; // Role of the adminStaff who deleted the adminStaff
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

export async function checkEmailAvailability(email: string) {
    try {
        // Query to find if an email already exists with role 'adminStaff'
        const existingAdminStaff = await prisma.adminStaff.findFirst({
            where: { email },
            select: { email: true, role: true },
        });

        // If the email is already in use by a adminStaff
        if (existingAdminStaff && existingAdminStaff.role === 'admin_staff') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a adminStaff.`,
            };
        }

        // If no record is found, the email is available
        return {
            status: true,
            message: `Email "${email}" is available.`,
        };
    } catch (error) {
        // Log the error and return a general error message
        console.error('Error checking email availability:', error);
        return {
            status: false,
            message: 'Error while checking email availability.',
        };
    }
}

export async function checkEmailAvailabilityForUpdate(email: string, adminStaffId: number) {
    try {
        // Query to find if an email already exists with role 'adminStaff'
        const existingAdminStaff = await prisma.adminStaff.findFirst({
            where: {
                email,
                NOT: {
                    id: adminStaffId,  // Exclude the current product being updated
                },
            },
            select: { email: true, role: true },
        });

        // If the email is already in use by a adminStaff
        if (existingAdminStaff && existingAdminStaff.role === 'admin_staff') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a adminStaff.`,
            };
        }

        // If no record is found, the email is available
        return {
            status: true,
            message: `Email "${email}" is available.`,
        };
    } catch (error) {
        // Log the error and return a general error message
        console.error('Error checking email availability:', error);
        return {
            status: false,
            message: 'Error while checking email availability.',
        };
    }
}

export async function createAdminStaff(adminId: number, adminRole: string, adminStaff: AdminStaff) {
    try {
        const {
            admin,
            name,
            profilePicture,
            email,
            phoneNumber,
            permissions,
            password,
            permanentAddress,
            permanentPostalCode,
            permanentCity,
            permanentState,
            permanentCountry,
            status: statusRaw,
            createdAt,
            createdBy,
            createdByRole
        } = adminStaff;

        // Convert statusRaw to a boolean
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const newAdminStaff = await prisma.adminStaff.create({
            data: {
                admin,
                name,
                profilePicture,
                email,
                phoneNumber,
                password,
                role: 'admin_staff',
                permanentAddress,
                permanentPostalCode,
                permanentCity,
                permanentState,
                permanentCountry,
                status: statusString,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        if (permissions && permissions.trim() !== '') {
            const permissionsArray = permissions.split(',').map(p => p.trim());

            for (const [index, permission] of permissionsArray.entries()) {
                if (!permission) {
                    throw new Error(`Invalid permission at index ${index}: ${permission}`);
                }

                const permissionExists = await prisma.adminStaffPermission.findFirst({
                    where: { id: Number(permission), panel: 'admin' }
                });

                if (permissionExists) {
                    await prisma.adminStaffHasPermission.create({
                        data: {
                            adminStaffPermissionId: permissionExists.id,
                            adminStaffId: newAdminStaff.id
                        },
                    });
                }
            }
        }

        return { status: true, adminStaff: serializeBigInt(newAdminStaff) };

    } catch (error) {
        console.error(`Error creating admin staff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getAdminStaffsByStatus = async (
    status: "deleted" | "notDeleted" = "notDeleted",
    withPassword: boolean | string | number = false
) => {
    try {
        let whereCondition = {};

        switch (status) {
            case "notDeleted":
                whereCondition = { role: 'admin_staff', deletedAt: null };
                break;
            case "deleted":
                whereCondition = { role: 'admin_staff', deletedAt: { not: null } };
                break;
            default:
                throw new Error("Invalid status");
        }

        const adminStaffs = await prisma.adminStaff.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        return { status: true, adminStaffs: serializeBigInt(adminStaffs) };
    } catch (error) {
        console.error(`Error fetching adminStaffs by status (${status}):`, error);
        return { status: false, message: "Error fetching adminStaffs" };
    }
};

// 🔵 GET BY ID
export const getAdminStaffById = async (id: number, withPassword: boolean | string | number = false) => {
    try {
        const adminStaff = await prisma.adminStaff.findUnique({
            where: { id, role: 'admin_staff' },
            include: {
                adminStaffPermissions: true,
            }
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        if (!adminStaff) return { status: false, message: "AdminStaff not found" };
        return { status: true, adminStaff: serializeBigInt(adminStaff) };
    } catch (error) {
        console.error("❌ getAdminStaffById Error:", error);
        return { status: false, message: "Error fetching adminStaff" };
    }
};

// 🟡 UPDATE
export const updateAdminStaff = async (
    adminStaffId: number,
    adminStaffRole: string,
    adminStaff: AdminStaff,
    withPassword: boolean | string | number = false
) => {
    try {
        const {
            admin,
            name,
            profilePicture,
            email,
            password,
            phoneNumber,
            permissions,
            permanentAddress,
            permanentPostalCode,
            permanentCity,
            permanentState,
            permanentCountry,
            status: statusRaw,
            updatedAt,
            updatedBy,
            updatedByRole
        } = adminStaff;

        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const { status: adminStaffStatus, adminStaff: currentAdminStaff, message } =
            await getAdminStaffById(adminStaffId, withPassword);

        if (!adminStaffStatus || !currentAdminStaff) {
            return { status: false, message: message || "Admin staff not found." };
        }

        const finalPassword = (withPassword && currentAdminStaff.password)
            ? password
            : currentAdminStaff.password; // Default password fallback

        // Delete old profile picture if new one is provided
        if (profilePicture && profilePicture.trim() !== '' && currentAdminStaff?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentAdminStaff.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'adminStaff', imageFileName);

                const fileDeleted = await deleteFile(filePath);
                if (!fileDeleted) {
                    console.warn(`Failed to delete old profile picture: ${imageFileName}`);
                }
            } catch (error) {
                console.error("Error deleting profile picture:", error);
            }
        }

        let updateData;
        if (withPassword) {
            updateData = {
                admin,
                name,
                email,
                phoneNumber,
                password: finalPassword,
                role: 'admin_staff',
                permanentAddress,
                permanentPostalCode,
                permanentCity,
                permanentState,
                permanentCountry,
                status: statusString,
                updatedBy,
                updatedByRole,
                updatedAt,
                ...(profilePicture?.trim() ? { profilePicture: profilePicture.trim() } : {})
            };

        } else {
            updateData = {
                admin,
                name,
                email,
                phoneNumber,
                role: 'admin_staff',
                permanentAddress,
                permanentPostalCode,
                permanentCity,
                permanentState,
                permanentCountry,
                status: statusString,
                updatedBy,
                updatedByRole,
                updatedAt,
                ...(profilePicture?.trim() ? { profilePicture: profilePicture.trim() } : {})
            };

        }

        const updatedAdminStaff = await prisma.adminStaff.update({
            where: { id: adminStaffId },
            data: updateData,
        });

        // Assign new permissions if provided
        if (permissions && permissions.trim() !== '') {
            const permissionsArray = permissions
                .split(',')
                .map(p => p.trim())
                .filter(p => p !== '');

            const validPermissionIds: number[] = [];

            for (const [index, permission] of permissionsArray.entries()) {
                const permissionId = Number(permission);
                if (isNaN(permissionId)) {
                    throw new Error(`Permission ID must be a number. Invalid at index ${index}: ${permission}`);
                }

                const permissionExists = await prisma.adminStaffPermission.findFirst({
                    where: { id: permissionId, panel: 'admin' },
                });

                if (!permissionExists) {
                    throw new Error(`Invalid permission at index ${index}: ${permission}`);
                }

                validPermissionIds.push(permissionId);

                const alreadyGivenPermission = await prisma.adminStaffHasPermission.findFirst({
                    where: {
                        adminStaffId: updatedAdminStaff.id,
                        adminStaffPermissionId: permissionId,
                    },
                });

                if (!alreadyGivenPermission) {
                    await prisma.adminStaffHasPermission.create({
                        data: {
                            adminStaffPermissionId: permissionId,
                            adminStaffId: updatedAdminStaff.id,
                        },
                    });
                }
            }

            // Now delete permissions that are not in the new list
            await prisma.adminStaffHasPermission.deleteMany({
                where: {
                    adminStaffId: updatedAdminStaff.id,
                    adminStaffPermissionId: {
                        notIn: validPermissionIds,
                    },
                },
            });
        }

        return {
            status: true,
            adminStaff: serializeBigInt(updatedAdminStaff)
        };

    } catch (error) {
        console.error(`Error updating admin staff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for adminStaff and variants)
export const softDeleteAdminStaff = async (adminId: number, adminStaffRole: string, id: number) => {
    try {
        // Soft delete the adminStaff
        const updatedAdminStaff = await prisma.adminStaff.update({
            where: { id, role: 'admin_staff' },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminStaffRole,
            },
        });

        return {
            status: true,
            message: "AdminStaff soft deleted successfully",
            updatedAdminStaff: serializeBigInt(updatedAdminStaff)
        };
    } catch (error) {
        console.error("❌ softDeleteAdminStaff Error:", error);
        return { status: false, message: "Error soft deleting adminStaff" };
    }
};


// 🟢 RESTORE (Restores a soft-deleted adminStaff setting deletedAt to null)
export const restoreAdminStaff = async (adminId: number, adminStaffRole: string, id: number) => {
    try {
        // Restore the adminStaff
        const restoredAdminStaff = await prisma.adminStaff.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the adminStaff
                updatedByRole: adminStaffRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return {
            status: true,
            message: "AdminStaff restored successfully",
            restoredAdminStaff: serializeBigInt(restoredAdminStaff)
        };
    } catch (error) {
        console.error("❌ restoreAdminStaff Error:", error);
        return { status: false, message: "Error restoring adminStaff" };
    }
};

// 🔴 DELETE
export const deleteAdminStaff = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.adminStaff.delete({ where: { id, role: 'admin_staff' } });
        return { status: true, message: "AdminStaff deleted successfully" };
    } catch (error) {
        console.error("❌ deleteAdminStaff Error:", error);
        return { status: false, message: "Error deleting adminStaff" };
    }
};