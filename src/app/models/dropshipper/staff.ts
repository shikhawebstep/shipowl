import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface DropshipperStaff {
    admin: {
        connect: { id: number }
    },
    role?: {
        connect: { id: number }
    },
    id?: bigint; // Optional: ID of the dropshipperStaff (if exists)
    name: string; // Name of the dropshipperStaff
    profilePicture: string,
    email: string; // Email address of the dropshipperStaff
    phoneNumber: string;
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
            select: { email: true, role: true, panel: true },
        });

        // If the email is already in use by a dropshipperStaff
        if (existingDropshipperStaff && existingDropshipperStaff.panel === 'dropshipper') {
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
            select: { email: true, role: true, panel: true },
        });

        // If the email is already in use by a dropshipperStaff
        if (existingDropshipperStaff && existingDropshipperStaff.panel === 'dropshipper') {
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
        const {
            admin,
            name,
            profilePicture,
            email,
            role,
            phoneNumber,
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
        } = dropshipperStaff;

        // Convert statusRaw to a boolean
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const newDropshipperStaff = await prisma.adminStaff.create({
            data: {
                admin,
                name,
                profilePicture,
                email,
                phoneNumber,
                password,
                role,
                panel: 'dropshipper_staff',
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

        return { status: true, dropshipperStaff: serializeBigInt(newDropshipperStaff) };

    } catch (error) {
        console.error(`Error creating dropshipper staff:`, error);
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
                whereCondition = { role: 'dropshipper', deletedAt: null };
                break;
            case "deleted":
                whereCondition = { role: 'dropshipper', deletedAt: { not: null } };
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
            where: { id, panel: 'dropshipper_staff' },
            include: {
                role: {
                    include: {
                        rolePermissions: true
                    }
                }
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
            role,
            password,
            phoneNumber,
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

        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const { status: dropshipperStaffStatus, dropshipperStaff: currentDropshipperStaff, message } =
            await getDropshipperStaffById(dropshipperStaffId, withPassword);

        if (!dropshipperStaffStatus || !currentDropshipperStaff) {
            return { status: false, message: message || "Dropshipper staff not found." };
        }

        const finalPassword = (withPassword && currentDropshipperStaff.password)
            ? password
            : currentDropshipperStaff.password; // Default password fallback

        // Delete old profile picture if new one is provided
        if (profilePicture && profilePicture.trim() !== '' && currentDropshipperStaff?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentDropshipperStaff.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipperStaff', imageFileName);

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
                role,
                panel: 'dropshipper_staff',
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
                role,
                panel: 'dropshipper_staff',
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

        const updatedDropshipperStaff = await prisma.adminStaff.update({
            where: { id: dropshipperStaffId },
            data: updateData,
        });

        return {
            status: true,
            dropshipperStaff: serializeBigInt(updatedDropshipperStaff)
        };

    } catch (error) {
        console.error(`Error updating dropshipper staff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for dropshipperStaff and variants)
export const softDeleteDropshipperStaff = async (dropshipperId: number, dropshipperStaffRole: string, id: number) => {
    try {
        // Soft delete the dropshipperStaff
        const updatedDropshipperStaff = await prisma.adminStaff.update({
            where: { id, panel: 'dropshipper_staff' },
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
        await prisma.adminStaff.delete({ where: { id, panel: 'dropshipper_staff' } });
        return { status: true, message: "DropshipperStaff deleted successfully" };
    } catch (error) {
        console.error("❌ deleteDropshipperStaff Error:", error);
        return { status: false, message: "Error deleting dropshipperStaff" };
    }
};