import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface SupplierStaff {
    admin: {
        connect: { id: number }
    },
    role?: {
        connect: { id: number }
    },
    id?: bigint; // Optional: ID of the supplierStaff (if exists)
    name: string; // Name of the supplierStaff
    profilePicture: string,
    email: string; // Email address of the supplierStaff
    phoneNumber: string;
    password: string; // Password for the supplierStaff account
    permanentAddress: string; // Permanent address of the supplierStaff
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
    status: boolean; // Status of the supplierStaff (active, inactive, etc.)
    createdAt?: Date; // Timestamp of when the supplierStaff was created
    updatedAt?: Date; // Timestamp of when the supplierStaff was last updated
    deletedAt?: Date | null; // Timestamp of when the supplierStaff was deleted, or null if not deleted
    createdBy?: number; // ID of the supplierStaff who created the supplierStaff
    updatedBy?: number; // ID of the supplierStaff who last updated the supplierStaff
    deletedBy?: number; // ID of the supplierStaff who deleted the supplierStaff
    createdByRole?: string | null; // Role of the supplierStaff who created the supplierStaff
    updatedByRole?: string | null; // Role of the supplierStaff who last updated the supplierStaff
    deletedByRole?: string | null; // Role of the supplierStaff who deleted the supplierStaff
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
        // Query to find if an email already exists with role 'supplierStaff'
        const existingSupplierStaff = await prisma.adminStaff.findFirst({
            where: { email },
            select: { email: true, role: true, panel: true },
        });

        // If the email is already in use by a supplierStaff
        if (existingSupplierStaff && existingSupplierStaff.panel === 'supplier') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a supplierStaff.`,
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

export async function checkEmailAvailabilityForUpdate(email: string, supplierStaffId: number) {
    try {
        // Query to find if an email already exists with role 'supplierStaff'
        const existingSupplierStaff = await prisma.adminStaff.findFirst({
            where: {
                email,
                NOT: {
                    id: supplierStaffId,  // Exclude the current product being updated
                },
            },
            select: { email: true, role: true, panel: true },
        });

        // If the email is already in use by a supplierStaff
        if (existingSupplierStaff && existingSupplierStaff.panel === 'supplier') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a supplierStaff.`,
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

export async function createSupplierStaff(supplierId: number, supplierRole: string, supplierStaff: SupplierStaff) {
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
        } = supplierStaff;

        // Convert statusRaw to a boolean
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const newSupplierStaff = await prisma.adminStaff.create({
            data: {
                admin,
                name,
                profilePicture,
                email,
                phoneNumber,
                password,
                role,
                panel: 'supplier_staff',
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

        return { status: true, supplierStaff: serializeBigInt(newSupplierStaff) };

    } catch (error) {
        console.error(`Error creating supplier staff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getSupplierStaffsByStatus = async (
    status: "deleted" | "notDeleted" = "notDeleted",
    withPassword: boolean | string | number = false
) => {
    try {
        let whereCondition = {};

        switch (status) {
            case "notDeleted":
                whereCondition = { role: 'supplier', deletedAt: null };
                break;
            case "deleted":
                whereCondition = { role: 'supplier', deletedAt: { not: null } };
                break;
            default:
                throw new Error("Invalid status");
        }

        const supplierStaffs = await prisma.adminStaff.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        return { status: true, supplierStaffs: serializeBigInt(supplierStaffs) };
    } catch (error) {
        console.error(`Error fetching supplierStaffs by status (${status}):`, error);
        return { status: false, message: "Error fetching supplierStaffs" };
    }
};

// 🔵 GET BY ID
export const getSupplierStaffById = async (id: number, withPassword: boolean | string | number = false) => {
    try {
        const supplierStaff = await prisma.adminStaff.findUnique({
            where: { id, panel: 'supplier_staff' },
            include: {
                role: {
                    include: {
                        rolePermissions: true
                    }
                }
            }
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        if (!supplierStaff) return { status: false, message: "SupplierStaff not found" };
        return { status: true, supplierStaff: serializeBigInt(supplierStaff) };
    } catch (error) {
        console.error("❌ getSupplierStaffById Error:", error);
        return { status: false, message: "Error fetching supplierStaff" };
    }
};

// 🟡 UPDATE
export const updateSupplierStaff = async (
    supplierStaffId: number,
    supplierStaffRole: string,
    supplierStaff: SupplierStaff,
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
        } = supplierStaff;

        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const statusString = status ? 'active' : 'inactive';

        const { status: supplierStaffStatus, supplierStaff: currentSupplierStaff, message } =
            await getSupplierStaffById(supplierStaffId, withPassword);

        if (!supplierStaffStatus || !currentSupplierStaff) {
            return { status: false, message: message || "Supplier staff not found." };
        }

        const finalPassword = (withPassword && currentSupplierStaff.password)
            ? password
            : currentSupplierStaff.password; // Default password fallback

        // Delete old profile picture if new one is provided
        if (profilePicture && profilePicture.trim() !== '' && currentSupplierStaff?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentSupplierStaff.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'supplierStaff', imageFileName);

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
                panel: 'supplier_staff',
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
                panel: 'supplier_staff',
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

        const updatedSupplierStaff = await prisma.adminStaff.update({
            where: { id: supplierStaffId },
            data: updateData,
        });

        return {
            status: true,
            supplierStaff: serializeBigInt(updatedSupplierStaff)
        };

    } catch (error) {
        console.error(`Error updating supplier staff:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for supplierStaff and variants)
export const softDeleteSupplierStaff = async (supplierId: number, supplierStaffRole: string, id: number) => {
    try {
        // Soft delete the supplierStaff
        const updatedSupplierStaff = await prisma.adminStaff.update({
            where: { id, panel: 'supplier_staff' },
            data: {
                deletedBy: supplierId,
                deletedAt: new Date(),
                deletedByRole: supplierStaffRole,
            },
        });

        return {
            status: true,
            message: "SupplierStaff soft deleted successfully",
            updatedSupplierStaff: serializeBigInt(updatedSupplierStaff)
        };
    } catch (error) {
        console.error("❌ softDeleteSupplierStaff Error:", error);
        return { status: false, message: "Error soft deleting supplierStaff" };
    }
};


// 🟢 RESTORE (Restores a soft-deleted supplierStaff setting deletedAt to null)
export const restoreSupplierStaff = async (supplierId: number, supplierStaffRole: string, id: number) => {
    try {
        // Restore the supplierStaff
        const restoredSupplierStaff = await prisma.adminStaff.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: supplierId,   // Record the user restoring the supplierStaff
                updatedByRole: supplierStaffRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return {
            status: true,
            message: "SupplierStaff restored successfully",
            restoredSupplierStaff: serializeBigInt(restoredSupplierStaff)
        };
    } catch (error) {
        console.error("❌ restoreSupplierStaff Error:", error);
        return { status: false, message: "Error restoring supplierStaff" };
    }
};

// 🔴 DELETE
export const deleteSupplierStaff = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.adminStaff.delete({ where: { id, panel: 'supplier_staff' } });
        return { status: true, message: "SupplierStaff deleted successfully" };
    } catch (error) {
        console.error("❌ deleteSupplierStaff Error:", error);
        return { status: false, message: "Error deleting supplierStaff" };
    }
};