import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface DropshipperStaff {
    admin: {
        connect: { id: number }
    }
    id?: bigint; // Optional: ID of the dropshipperStaff (if exists)
    name: string; // Name of the dropshipperStaff
    profilePicture: string,
    email: string; // Email address of the dropshipperStaff
    phoneNumber: string;
    permissions: string;
    password: string; // Password for the dropshipperStaff account
    permanentAddress: string; // Permanent address of the dropshipperStaff
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
    status: boolean; // Status of the dropshipperStaff (active, inactive, etc.)
    createdAt?: Date; // Timestamp of when the dropshipperStaff was created
    updatedAt?: Date; // Timestamp of when the dropshipperStaff was last updated
    deletedAt?: Date | null; // Timestamp of when the dropshipperStaff was deleted, or null if not deleted
    createdBy?: number; // ID of the dropshipperStaff who created the dropshipperStaff
    updatedBy?: number; // ID of the dropshipperStaff who last updated the dropshipperStaff
    deletedBy?: number; // ID of the dropshipperStaff who deleted the dropshipperStaff
    createdByRole?: string | null; // Role of the dropshipperStaff who created the dropshipperStaff
    updatedByRole?: string | null; // Role of the dropshipperStaff who last updated the dropshipperStaff
    deletedByRole?: string | null; // Role of the dropshipperStaff who deleted the dropshipperStaff
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
        // Query to find if an email already exists with role 'dropshipperStaff'
        const existingDropshipperStaff = await prisma.adminStaff.findFirst({
            where: { email },
            select: { email: true, role: true },
        });

        // If the email is already in use by a dropshipperStaff
        if (existingDropshipperStaff && existingDropshipperStaff.role === 'dropshipper_staff') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a dropshipperStaff.`,
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

export async function checkEmailAvailabilityForUpdate(email: string, dropshipperStaffId: number) {
    try {
        // Query to find if an email already exists with role 'dropshipperStaff'
        const existingDropshipperStaff = await prisma.adminStaff.findFirst({
            where: {
                email,
                NOT: {
                    id: dropshipperStaffId,  // Exclude the current product being updated
                },
            },
            select: { email: true, role: true },
        });

        // If the email is already in use by a dropshipperStaff
        if (existingDropshipperStaff && existingDropshipperStaff.role === 'dropshipper_staff') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a dropshipperStaff.`,
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

export async function createDropshipperStaff(dropshipperId: number, dropshipperRole: string, dropshipperStaff: DropshipperStaff) {
    try {
        const { admin, name, profilePicture, email, phoneNumber, permissions, password, permanentAddress, permanentPostalCode, permanentCity, permanentState, permanentCountry, status: statusRaw, createdAt, createdBy, createdByRole } = dropshipperStaff;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        const newDropshipperStaff = await prisma.adminStaff.create({
            data: {
                admin,
                name,
                profilePicture,
                email,
                phoneNumber,
                password,
                role: 'dropshipper_staff',
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
                    where: { id: Number(permission), panel: 'dropshipper' }
                });

                if (permissionExists) {
                    await prisma.adminStaffHasPermission.create({
                        data: {
                            adminStaffPermissionId: permissionExists.id,
                            adminStaffId: newDropshipperStaff.id
                        },
                    });
                }
            }
        }

        return { status: true, dropshipperStaff: serializeBigInt(newDropshipperStaff) };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getDropshipperStaffsByStatus = async (
    status: "deleted" | "notDeleted" = "notDeleted",
    withPassword: boolean | string | number = false
) => {
    try {
        let whereCondition = {};

        switch (status) {
            case "notDeleted":
                whereCondition = { role: 'dropshipper_staff', deletedAt: null };
                break;
            case "deleted":
                whereCondition = { role: 'dropshipper_staff', deletedAt: { not: null } };
                break;
            default:
                throw new Error("Invalid status");
        }

        const dropshipperStaffs = await prisma.adminStaff.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        return { status: true, dropshipperStaffs: serializeBigInt(dropshipperStaffs) };
    } catch (error) {
        console.error(`Error fetching dropshipperStaffs by status (${status}):`, error);
        return { status: false, message: "Error fetching dropshipperStaffs" };
    }
};

// 🔵 GET BY ID
export const getDropshipperStaffById = async (id: number, withPassword: boolean | string | number = false) => {
    try {
        const dropshipperStaff = await prisma.adminStaff.findUnique({
            where: { id, role: 'dropshipper_staff' },
            include: {
                adminStaffPermissions: true,
            }
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        if (!dropshipperStaff) return { status: false, message: "DropshipperStaff not found" };
        return { status: true, dropshipperStaff: serializeBigInt(dropshipperStaff) };
    } catch (error) {
        console.error("❌ getDropshipperStaffById Error:", error);
        return { status: false, message: "Error fetching dropshipperStaff" };
    }
};

// 🟡 UPDATE
export const updateDropshipperStaff = async (
    dropshipperStaffId: number,
    dropshipperStaffRole: string,
    dropshipperStaff: DropshipperStaff,
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
        } = dropshipperStaff;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        // Fetch current dropshipperStaff details, including password based on withPassword flag
        const { status: dropshipperStaffStatus, dropshipperStaff: currentDropshipperStaff, message } = await getDropshipperStaffById(dropshipperStaffId, withPassword);

        if (!dropshipperStaffStatus || !currentDropshipperStaff) {
            return { status: false, message: message || "DropshipperStaff not found." };
        }

        // Check if currentDropshipper has a password (it should if the dropshipper is valid)
        const finalPassword = (withPassword && currentDropshipperStaff.password) ? password : currentDropshipperStaff.password; // Default password

        if (profilePicture && profilePicture.trim() !== '' && currentDropshipperStaff?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentDropshipperStaff.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipperStaff');

                const fileDeleted = await deleteFile(filePath);

                if (!fileDeleted) {
                    console.warn(`Failed to delete old profile picture: ${imageFileName}`);
                }
            } catch (error) {
                console.error("Error deleting profile picture:", error);
            }
        }

        const updateData = {
            admin,
            name,
            email,
            phoneNumber,
            password: finalPassword,
            role: 'dropshipper_staff',
            permanentAddress,
            permanentPostalCode,
            permanentCity,
            permanentState,
            permanentCountry,
            status: statusString,
            updatedBy,
            updatedByRole,
            updatedAt,
            ...(profilePicture && profilePicture.trim() !== '' ? { profilePicture: profilePicture.trim() } : {})
        };

        const updatedDropshipperStaff = await prisma.adminStaff.update({
            where: { id: dropshipperStaffId },
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
                    where: { id: permissionId, panel: 'dropshipper' },
                });

                if (!permissionExists) {
                    throw new Error(`Invalid permission at index ${index}: ${permission}`);
                }

                validPermissionIds.push(permissionId);

                const alreadyGivenPermission = await prisma.adminStaffHasPermission.findFirst({
                    where: {
                        adminStaffId: updatedDropshipperStaff.id,
                        adminStaffPermissionId: permissionId,
                    },
                });

                if (!alreadyGivenPermission) {
                    await prisma.adminStaffHasPermission.create({
                        data: {
                            adminStaffPermissionId: permissionId,
                            adminStaffId: updatedDropshipperStaff.id,
                        },
                    });
                }
            }

            // Now delete permissions that are not in the new list
            await prisma.adminStaffHasPermission.deleteMany({
                where: {
                    adminStaffId: updatedDropshipperStaff.id,
                    adminStaffPermissionId: {
                        notIn: validPermissionIds,
                    },
                },
            });
        }

        return { status: true, dropshipperStaff: serializeBigInt(updatedDropshipperStaff) };
    } catch (error) {
        console.error(`Error updating dropshipperStaff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for dropshipperStaff and variants)
export const softDeleteDropshipperStaff = async (dropshipperId: number, dropshipperStaffRole: string, id: number) => {
    try {
        // Soft delete the dropshipperStaff
        const updatedDropshipperStaff = await prisma.adminStaff.update({
            where: { id, role: 'dropshipper_staff' },
            data: {
                deletedBy: dropshipperId,
                deletedAt: new Date(),
                deletedByRole: dropshipperStaffRole,
            },
        });

        return {
            status: true,
            message: "DropshipperStaff soft deleted successfully",
            updatedDropshipperStaff: serializeBigInt(updatedDropshipperStaff)
        };
    } catch (error) {
        console.error("❌ softDeleteDropshipperStaff Error:", error);
        return { status: false, message: "Error soft deleting dropshipperStaff" };
    }
};


// 🟢 RESTORE (Restores a soft-deleted dropshipperStaff setting deletedAt to null)
export const restoreDropshipperStaff = async (dropshipperId: number, dropshipperStaffRole: string, id: number) => {
    try {
        // Restore the dropshipperStaff
        const restoredDropshipperStaff = await prisma.adminStaff.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: dropshipperId,   // Record the user restoring the dropshipperStaff
                updatedByRole: dropshipperStaffRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return {
            status: true,
            message: "DropshipperStaff restored successfully",
            restoredDropshipperStaff: serializeBigInt(restoredDropshipperStaff)
        };
    } catch (error) {
        console.error("❌ restoreDropshipperStaff Error:", error);
        return { status: false, message: "Error restoring dropshipperStaff" };
    }
};

// 🔴 DELETE
export const deleteDropshipperStaff = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.adminStaff.delete({ where: { id, role: 'dropshipper_staff' } });
        return { status: true, message: "DropshipperStaff deleted successfully" };
    } catch (error) {
        console.error("❌ deleteDropshipperStaff Error:", error);
        return { status: false, message: "Error deleting dropshipperStaff" };
    }
};