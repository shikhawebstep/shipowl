import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface Dropshipper {
    id?: bigint; // Optional: ID of the dropshipper (if exists)
    name: string; // Name of the dropshipper
    profilePicture: string,
    email: string; // Email address of the dropshipper
    website?: string;
    referralCode: string,
    phoneNumber: string;
    password: string; // Password for the dropshipper account
    permanentAddress: string; // Permanent address of the dropshipper
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
    status: boolean; // Status of the dropshipper (active, inactive, etc.)
    createdAt?: Date; // Timestamp of when the dropshipper was created
    updatedAt?: Date; // Timestamp of when the dropshipper was last updated
    deletedAt?: Date | null; // Timestamp of when the dropshipper was deleted, or null if not deleted
    createdBy?: number; // ID of the admin who created the dropshipper
    updatedBy?: number; // ID of the admin who last updated the dropshipper
    deletedBy?: number; // ID of the admin who deleted the dropshipper
    createdByRole?: string | null; // Role of the admin who created the dropshipper
    updatedByRole?: string | null; // Role of the admin who last updated the dropshipper
    deletedByRole?: string | null; // Role of the admin who deleted the dropshipper
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

export async function generateUniqueDropshipperId() {
    let dropshipperId = '';
    let isTaken = true;

    while (isTaken) {
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // generates a 4-digit number
        dropshipperId = `DROP-${randomNumber}`;

        const existingDropshipper = await prisma.admin.findFirst({
            where: {
                role: 'dropshipper',
                uniqeId: dropshipperId, // assuming dropshipperId is stored in DB
            },
        });

        isTaken = !!existingDropshipper;
    }

    return dropshipperId;
}

export async function checkEmailAvailability(email: string) {
    try {
        // Query to find if an email already exists with role 'dropshipper'
        const existingDropshipper = await prisma.admin.findFirst({
            where: { email },
            select: { email: true, role: true },
        });

        // If the email is already in use by a dropshipper
        if (existingDropshipper && existingDropshipper.role === 'dropshipper') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a dropshipper.`,
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

export async function checkEmailAvailabilityForUpdate(email: string, dropshipperId: number) {
    try {
        // Query to find if an email already exists with role 'dropshipper'
        const existingDropshipper = await prisma.admin.findFirst({
            where: {
                email,
                NOT: {
                    id: dropshipperId,  // Exclude the current product being updated
                },
            },
            select: { email: true, role: true },
        });

        // If the email is already in use by a dropshipper
        if (existingDropshipper && existingDropshipper.role === 'dropshipper') {
            return {
                status: false,
                message: `Email "${email}" is already in use by a dropshipper.`,
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

export async function createDropshipper(adminId: number, adminRole: string, dropshipper: Dropshipper) {
    try {
        const { name, profilePicture, email, website, referralCode, phoneNumber, password, permanentAddress, permanentPostalCode, permanentCity, permanentState, permanentCountry, status: statusRaw, createdAt, createdBy, createdByRole } = dropshipper;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        const newDropshipper = await prisma.admin.create({
            data: {
                name,
                uniqeId: await generateUniqueDropshipperId(),
                profilePicture,
                email,
                website,
                phoneNumber,
                referralCode,
                password,
                role: 'dropshipper',
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

        return { status: true, dropshipper: serializeBigInt(newDropshipper) };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getDropshippersByStatus = async (
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

        const dropshippers = await prisma.admin.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
            include: {
                companyDetail: true,
                bankAccount: true,
                permanentCity: true,
                permanentCountry: true,
                permanentState: true,
            }
        });

        logMessage(`debug`, `withPassword:`, withPassword);

        return { status: true, dropshippers: serializeBigInt(dropshippers) };
    } catch (error) {
        console.error(`Error fetching dropshippers by status (${status}):`, error);
        return { status: false, message: "Error fetching dropshippers" };
    }
};

// 🔵 GET BY ID
export const getDropshipperById = async (id: number, withPassword: boolean | string | number = false) => {
    try {
        const dropshipper = await prisma.admin.findUnique({
            where: { id, role: 'dropshipper' },
            include: {
                companyDetail: true,
                bankAccount: true,
                permanentCountry: true,
                permanentState: true,
                permanentCity: true
            }

        });

        logMessage(`debug`, `withPassword:`, withPassword);

        if (!dropshipper) return { status: false, message: "Dropshipper not found" };
        return { status: true, dropshipper: serializeBigInt(dropshipper) };
    } catch (error) {
        console.error("❌ getDropshipperById Error:", error);
        return { status: false, message: "Error fetching dropshipper" };
    }
};

// 🟡 UPDATE
export const updateDropshipper = async (
    adminId: number,
    adminRole: string,
    dropshipperId: number,
    dropshipper: Dropshipper,
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
        } = dropshipper;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        // Fetch current dropshipper details, including password based on withPassword flag
        const { status: dropshipperStatus, dropshipper: currentDropshipper, message } = await getDropshipperById(dropshipperId, withPassword);

        if (!dropshipperStatus || !currentDropshipper) {
            return { status: false, message: message || "Dropshipper not found." };
        }

        // Check if currentSupplier has a password (it should if the supplier is valid)
        const finalPassword = (withPassword && currentDropshipper.password) ? password : currentDropshipper.password; // Default password

        if (profilePicture && profilePicture.trim() !== '' && currentDropshipper?.profilePicture?.trim()) {
            try {
                const imageFileName = path.basename(currentDropshipper.profilePicture.trim());
                const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper');

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
            role: 'dropshipper',
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

        const newDropshipper = await prisma.admin.update({
            where: { id: dropshipperId },
            data: updateData,
        });

        return { status: true, dropshipper: serializeBigInt(newDropshipper) };
    } catch (error) {
        console.error(`Error updating dropshipper:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

export const updateDropshipperStatus = async (
    adminId: number,
    adminRole: string,
    dropshipperId: number,
    statusRaw: string | boolean | number,
) => {
    try {

        // Convert status to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

        // Convert boolean status to string ('active' or 'inactive')
        const statusString = status ? 'active' : 'inactive';

        // Fetch current dropshipper details, including password based on withPassword flag
        const { status: dropshipperStatus, dropshipper: currentDropshipper, message } = await getDropshipperById(dropshipperId);

        if (!dropshipperStatus || !currentDropshipper) {
            return { status: false, message: message || "Dropshipper not found." };
        }

        const updateData = {
            status: statusString,
        };

        const newDropshipper = await prisma.admin.update({
            where: { id: dropshipperId },
            data: updateData,
        });

        return { status: true, dropshipper: serializeBigInt(newDropshipper) };
    } catch (error) {
        console.error(`Error updating dropshipper:`, error);
        return { status: false, message: "Internal Server Error" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for dropshipper and variants)
export const softDeleteDropshipper = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Soft delete the dropshipper
        const updatedDropshipper = await prisma.admin.update({
            where: { id, role: 'dropshipper' },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        // Soft delete the companyDetails of this dropshipper
        const updatedCompanyDeatil = await prisma.companyDetail.update({
            where: { adminId: id },  // assuming `dropshipperId` is the foreign key in the variant table
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        // Soft delete the bankAccounts of this dropshipper
        const updatedBankAccounts = await prisma.bankAccount.updateMany({
            where: { adminId: id },  // assuming `dropshipperId` is the foreign key in the variant table
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        return {
            status: true,
            message: "Dropshipper soft deleted successfully",
            updatedDropshipper: serializeBigInt(updatedDropshipper),
            updatedCompanyDeatil: serializeBigInt(updatedCompanyDeatil),
            updatedBankAccounts: serializeBigInt(updatedBankAccounts)
        };
    } catch (error) {
        console.error("❌ softDeleteDropshipper Error:", error);
        return { status: false, message: "Error soft deleting dropshipper" };
    }
};


// 🟢 RESTORE (Restores a soft-deleted dropshipper setting deletedAt to null)
export const restoreDropshipper = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Restore the dropshipper
        const restoredDropshipper = await prisma.admin.update({
            where: { id },
            include: { companyDetail: true, bankAccount: true },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the dropshipper
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Restore the variants of this dropshipper
        await prisma.companyDetail.updateMany({
            where: { adminId: id },  // assuming `dropshipperId` is the foreign key in the variant table
            data: {
                deletedBy: null,      // Reset the deletedBy field for variants
                deletedAt: null,      // Set deletedAt to null for variants
                deletedByRole: null,  // Reset the deletedByRole field for variants
                updatedBy: adminId,   // Record the user restoring the variant
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field for variants
            },
        });

        // Restore the variants of this dropshipper
        await prisma.bankAccount.updateMany({
            where: { adminId: id },  // assuming `dropshipperId` is the foreign key in the variant table
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
            message: "Dropshipper restored successfully",
            restoredDropshipper: serializeBigInt(restoredDropshipper)
        };
    } catch (error) {
        console.error("❌ restoreDropshipper Error:", error);
        return { status: false, message: "Error restoring dropshipper" };
    }
};

// 🔴 DELETE
export const deleteDropshipper = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.admin.delete({ where: { id, role: 'dropshipper' } });
        return { status: true, message: "Dropshipper deleted successfully" };
    } catch (error) {
        console.error("❌ deleteDropshipper Error:", error);
        return { status: false, message: "Error deleting dropshipper" };
    }
};