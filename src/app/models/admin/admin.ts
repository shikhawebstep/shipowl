import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface Admin {
    id?: bigint; // Optional: ID of the admin (if exists)
    name: string; // Name of the admin
    profilePicture: string,
    email: string; // Email address of the admin
    website?: string;
    referralCode: string,
    phoneNumber: string;
    password: string; // Password for the admin account
    permanentAddress: string; // Permanent address of the admin
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
    status: boolean; // Status of the admin (active, inactive, etc.)
    createdAt?: Date; // Timestamp of when the admin was created
    updatedAt?: Date; // Timestamp of when the admin was last updated
    deletedAt?: Date | null; // Timestamp of when the admin was deleted, or null if not deleted
    createdBy?: number; // ID of the admin who created the admin
    updatedBy?: number; // ID of the admin who last updated the admin
    deletedBy?: number; // ID of the admin who deleted the admin
    createdByRole?: string | null; // Role of the admin who created the admin
    updatedByRole?: string | null; // Role of the admin who last updated the admin
    deletedByRole?: string | null; // Role of the admin who deleted the admin
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

export async function generateUniqueAdminId() {
    let adminId = '';
    let isTaken = true;

    while (isTaken) {
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // generates a 4-digit number
        adminId = `DROP-${randomNumber}`;

        const existingAdmin = await prisma.admin.findFirst({
            where: {
                role: 'Admin',
                uniqeId: adminId, // assuming adminId is stored in DB
            },
        });

        isTaken = !!existingAdmin;
    }

    return adminId;
}

export async function checkEmailAvailability(email: string) {
    try {
        // Query to find if an email already exists with role 'admin'
        const existingAdmin = await prisma.admin.findFirst({
            where: { email },
            select: { email: true, role: true },
        });

        // If the email is already in use by a admin
        if (existingAdmin && existingAdmin.role === 'admin') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a admin.`,
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

export async function checkEmailAvailabilityForUpdate(email: string, adminId: number) {
    try {
        // Query to find if an email already exists with role 'admin'
        const existingAdmin = await prisma.admin.findFirst({
            where: {
                email,
                NOT: {
                    id: adminId,  // Exclude the current product being updated
                },
            },
            select: { email: true, role: true },
        });

        // If the email is already in use by a admin
        if (existingAdmin && existingAdmin.role === 'admin') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a admin.`,
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

export async function createAdmin(adminId: number, adminRole: string, admin: Admin) {
    try {
        const { name, profilePicture, email, website, referralCode, phoneNumber, password, permanentAddress, permanentPostalCode, permanentCity, permanentState, permanentCountry, status: statusRaw, createdAt, createdBy, createdByRole } = admin;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        const newAdmin = await prisma.admin.create({
            data: {
                name,
                uniqeId: await generateUniqueAdminId(),
                profilePicture,
                email,
                website,
                phoneNumber,
                referralCode,
                password,
                role: 'admin',
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

        return { status: true, admin: serializeBigInt(newAdmin) };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getAdminsByStatus = async (
    status: "deleted" | "notDeleted" = "notDeleted",
    withPassword: boolean | string | number = false
) => {
    try {
        let whereCondition = {};

        switch (status) {
            case "notDeleted":
                whereCondition = { role: 'admin', deletedAt: null };
                break;
            case "deleted":
                whereCondition = { role: 'admin', deletedAt: { not: null } };
                break;
            default:
                throw new Error("Invalid status");
        }

        const admins = await prisma.admin.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
            include: {
                companyDetail: true,
                bankAccount: true,
            }
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        return { status: true, admins: serializeBigInt(admins) };
    } catch (error) {
        console.error(`Error fetching admins by status (${status}):`, error);
        return { status: false, message: "Error fetching admins" };
    }
};

// 🔵 GET BY ID
export const getAdminById = async (id: number, withPassword: boolean | string | number = false) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id, role: 'admin' },
            include: {
                companyDetail: true,
                bankAccount: true,
            }

        });

        logMessage(`debug`, `withPassword:`, withPassword);

        if (!admin) return { status: false, message: "Admin not found" };
        return { status: true, admin: serializeBigInt(admin) };
    } catch (error) {
        console.error("❌ getAdminById Error:", error);
        return { status: false, message: "Error fetching admin" };
    }
};

// 🟡 UPDATE
export const updateAdmin = async (
    adminId: number,
    adminRole: string,
    admin: Admin,
    withPassword: boolean | string | number = false
) => {
    try {
        const {
            name,
            profilePicture,
            email,
            password,
            website,
            referralCode,
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
        } = admin;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        // Fetch current admin details, including password based on withPassword flag
        const { status: adminStatus, admin: currentAdmin, message } = await getAdminById(adminId, withPassword);

        if (!adminStatus || !currentAdmin) {
            return { status: false, message: message || "Admin not found." };
        }

        // Check if currentSupplier has a password (it should if the supplier is valid)
        const finalPassword = (withPassword && currentAdmin.password) ? password : currentAdmin.password; // Default password

        if (profilePicture && profilePicture.trim() !== '' && currentAdmin?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentAdmin.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'admin');

                const fileDeleted = await deleteFile(filePath);

                if (!fileDeleted) {
                    console.warn(`Failed to delete old profile picture: ${imageFileName}`);
                }
            } catch (error) {
                console.error("Error deleting profile picture:", error);
            }
        }

        const updateData = {
            name,
            email,
            website,
            phoneNumber,
            referralCode,
            password: finalPassword,
            role: 'admin',
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

        const newAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: updateData,
        });

        return { status: true, admin: serializeBigInt(newAdmin) };
    } catch (error) {
        console.error(`Error updating admin:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for admin and variants)
export const softDeleteAdmin = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Soft delete the admin
        const updatedAdmin = await prisma.admin.update({
            where: { id, role: 'admin' },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        // Soft delete the companyDetails of this admin
        const updatedCompanyDeatil = await prisma.companyDetail.update({
            where: { adminId: id },  // assuming `adminId` is the foreign key in the variant table
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        // Soft delete the bankAccounts of this admin
        const updatedBankAccounts = await prisma.bankAccount.updateMany({
            where: { adminId: id },  // assuming `adminId` is the foreign key in the variant table
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        return {
            status: true,
            message: "Admin soft deleted successfully",
            updatedAdmin: serializeBigInt(updatedAdmin),
            updatedCompanyDeatil: serializeBigInt(updatedCompanyDeatil),
            updatedBankAccounts: serializeBigInt(updatedBankAccounts)
        };
    } catch (error) {
        console.error("❌ softDeleteAdmin Error:", error);
        return { status: false, message: "Error soft deleting admin" };
    }
};


// 🟢 RESTORE (Restores a soft-deleted admin setting deletedAt to null)
export const restoreAdmin = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Restore the admin
        const restoredAdmin = await prisma.admin.update({
            where: { id },
            include: { companyDetail: true, bankAccount: true },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the admin
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Restore the variants of this admin
        await prisma.companyDetail.updateMany({
            where: { adminId: id },  // assuming `adminId` is the foreign key in the variant table
            data: {
                deletedBy: null,      // Reset the deletedBy field for variants
                deletedAt: null,      // Set deletedAt to null for variants
                deletedByRole: null,  // Reset the deletedByRole field for variants
                updatedBy: adminId,   // Record the user restoring the variant
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field for variants
            },
        });

        // Restore the variants of this admin
        await prisma.bankAccount.updateMany({
            where: { adminId: id },  // assuming `adminId` is the foreign key in the variant table
            data: {
                deletedBy: null,      // Reset the deletedBy field for variants
                deletedAt: null,      // Set deletedAt to null for variants
                deletedByRole: null,  // Reset the deletedByRole field for variants
                updatedBy: adminId,   // Record the user restoring the variant
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field for variants
            },
        });

        return {
            status: true,
            message: "Admin restored successfully",
            restoredAdmin: serializeBigInt(restoredAdmin)
        };
    } catch (error) {
        console.error("❌ restoreAdmin Error:", error);
        return { status: false, message: "Error restoring admin" };
    }
};

// 🔴 DELETE
export const deleteAdmin = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.admin.delete({ where: { id, role: 'admin' } });
        return { status: true, message: "Admin deleted successfully" };
    } catch (error) {
        console.error("❌ deleteAdmin Error:", error);
        return { status: false, message: "Error deleting admin" };
    }
};