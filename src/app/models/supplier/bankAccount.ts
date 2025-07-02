import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface SupplierBankAccountPayload {
    admin: { connect: { id: number } };
    bankAccount?: { connect: { id: number } } | null;
    id?: number;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
    accountType: string;
    ifscCode: string;
    cancelledChequeImage: string;
    createdAt?: Date; // Timestamp of when the supplier was created
    updatedAt?: Date; // Timestamp of when the supplier was last updated
    deletedAt?: Date | null; // Timestamp of when the supplier was deleted, or null if not deleted
    createdBy?: number; // ID of the admin who created the supplier
    updatedBy?: number; // ID of the admin who last updated the supplier
    deletedBy?: number; // ID of the admin who deleted the supplier
    createdByRole?: string | null; // Role of the admin who created the supplier
    updatedByRole?: string | null; // Role of the admin who last updated the supplier
    deletedByRole?: string | null; // Role of the admin who deleted the supplier
}

type ImageType = "cancelledChequeImage";

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

export const getBankAccountById = async (id: number) => {
    try {
        const bankAccount = await prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!bankAccount) return { status: false, message: "Company Bank Account not found" };
        return { status: true, bankAccount };
    } catch (error) {
        console.error("❌ getbankAccountIdBySupplierId Error:", error);
        return { status: false, message: "Error fetching supplier bank account" };
    }
};

export async function getSupplierBankAccountBySupplierId(supplierId: number) {
    try {
        const bankAccount = await prisma.bankAccount.findFirst({
            where: {
                adminId: supplierId,
            },
        });

        if (!bankAccount) {
            return { status: false, message: "No bank account found for this supplier." };
        }

        return { status: true, bankAccount: serializeBigInt(bankAccount) };
    } catch (error) {
        logMessage("error", "Error fetching bank account by supplierId", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getBankAccountChangeRequestByAdminId(adminId: number) {
    try {
        // Check if there's already an existing bank account change request for the given adminId
        const bankAccountChangeRequest = await prisma.bankAccountChangeRequest.findFirst({
            where: {
                adminId: adminId, // Check if a request exists for the same adminId
            },
        });

        // If an existing request is found, return it
        if (bankAccountChangeRequest) {
            return { status: true, bankAccountChangeRequest: serializeBigInt(bankAccountChangeRequest) };
        }

        // If no existing request is found, return a message
        return { status: false, message: "No bank account change request found for this admin." };
    } catch (error) {
        // Log the error and return a failure response
        logMessage("error", "Error fetching bank account change request", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getBankAccountChangeRequestById(id: number) {
    try {
        // Find the bank account change request by its unique ID
        const bankAccountChangeRequest = await prisma.bankAccountChangeRequest.findUnique({
            where: {
                id: id, // Primary key lookup
            },
        });

        // If found, return the serialized data
        if (bankAccountChangeRequest) {
            return { status: true, bankAccountChangeRequest: serializeBigInt(bankAccountChangeRequest) };
        }

        // If not found, return a not found message
        return { status: false, message: "No bank account change request found with this ID." };
    } catch (error) {
        // Log error and return failure response
        logMessage("error", "Error fetching bank account change request by ID", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function createSupplierBankAccount(
    adminId: number,
    adminRole: string,
    payload: SupplierBankAccountPayload
) {
    try {
        const { admin, accountHolderName, accountNumber, bankName, bankBranch, accountType, ifscCode, cancelledChequeImage, createdAt, createdBy, createdByRole } = payload;

        const newBankAccounts = await prisma.bankAccount.createMany({
            data: {
                adminId: admin.connect.id,
                accountHolderName,
                accountNumber,
                bankName,
                bankBranch,
                accountType,
                ifscCode,
                cancelledChequeImage,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        return { status: true, bankAccounts: newBankAccounts };
    } catch (error) {
        logMessage("error", "Error creating supplier bank account", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const removeBankAccountImageByIndex = async (bankAccountId: number, supplierId: number, imageType: ImageType, imageIndex: number) => {
    try {
        const { status, bankAccount, message } = await getBankAccountById(bankAccountId);

        if (!status || !bankAccount) {
            return { status: false, message: message || "bankAccount not found." };
        }

        logMessage(`debbug`, `bankAccount:`, bankAccount);
        logMessage(`debbug`, `imageType:`, imageType);
        if (!bankAccount[imageType]) {
            return { status: false, message: "No images available to delete." };
        }

        const images = bankAccount[imageType].split(",");

        logMessage(`debbug`, `images.length:`, images.length);
        if (imageIndex < 0 || imageIndex >= images.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = images.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = images.join(",");

        // Update category in DB
        const updatedBankAccount = await prisma.bankAccount.update({
            where: { id: bankAccountId },
            data: { [imageType]: updatedImages },
        });

        // 🔥 Attempt to delete the image file from storage
        const imageFileName = path.basename(removedImage.trim());
        const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'supplier', `${supplierId}`, 'company', imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            bankAccount: updatedBankAccount,
        };
    } catch (error) {
        console.error("❌ Error removing Bank Account Deatil image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

export async function updateSupplierBankAccount(
    adminId: number,
    adminRole: string,
    supplierId: number,
    payload: SupplierBankAccountPayload
) {
    try {
        const {
            admin,
            bankAccount,
            accountHolderName,
            accountNumber,
            bankName,
            bankBranch,
            accountType,
            ifscCode,
            cancelledChequeImage,
            updatedAt,
            updatedBy,
            updatedByRole
        } = payload;

        if (bankAccount?.connect?.id) {
            // Fetch the existing bank account to update
            const { status: supplierStatus, bankAccount: currentBankAccount, message } = await getBankAccountById(bankAccount.connect.id);

            if (!supplierStatus || !currentBankAccount) {
                return { status: false, message: message || "Bank Account not found." };
            }

            // If the bank account exists, update it
            await prisma.bankAccount.update({
                where: { id: bankAccount.connect.id },
                data: {
                    adminId: admin.connect.id,
                    accountHolderName,
                    accountNumber,
                    bankName,
                    bankBranch,
                    accountType,
                    ifscCode,
                    cancelledChequeImage,
                    updatedAt,
                    updatedBy,
                    updatedByRole
                }
            });

            // Return success response
            return { status: true, message: "Bank account updated successfully." };

        } else {
            // If there's no bank account to update, create a new one
            await prisma.bankAccount.create({
                data: {
                    adminId: admin.connect.id,
                    accountHolderName,
                    accountNumber,
                    bankName,
                    bankBranch,
                    accountType,
                    ifscCode,
                    cancelledChequeImage,
                    createdAt: updatedAt,
                    createdBy: updatedBy,
                    createdByRole: updatedByRole
                }
            });

            // Return success response for creation
            return { status: true, message: "Bank account created successfully." };
        }
    } catch (error) {
        logMessage("error", "Error updating/creating supplier bank account", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function requestSupplierBankAccountChange(
    supplierId: number,
    supplierRole: string,
    payload: SupplierBankAccountPayload
) {
    try {
        const { admin, accountHolderName, accountNumber, bankName, bankBranch, accountType, ifscCode, cancelledChequeImage, createdAt, createdBy, createdByRole } = payload;

        const currentBankAccountChangeRequest = await getBankAccountChangeRequestByAdminId(admin.connect.id);
        if (currentBankAccountChangeRequest.status) {
            return { status: false, message: 'A bank account change request already exists for this supplier.' };
        }

        // Create a single bank account change request
        const newBankAccount = await prisma.bankAccountChangeRequest.create({
            data: {
                adminId: admin.connect.id,
                accountHolderName,
                accountNumber,
                bankName,
                bankBranch,
                accountType,
                ifscCode,
                cancelledChequeImage,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        // Return success status and the created record
        return { status: true, bankAccount: serializeBigInt(newBankAccount) };
    } catch (error) {
        // Log the error and return a failure response
        logMessage("error", "Error creating supplier bank account change request", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const getAllBankAccountChangeRequests = async () => {
    try {
        const requests = await prisma.bankAccountChangeRequest.findMany({
            where: {
                admin: {
                    role: 'supplier',
                },
            },
            include: {
                admin: {
                    include: {
                        bankAccount: true
                    }
                },
                bankAccount: true
            }
        });

        return {
            status: true,
            requests: serializeBigInt(requests),
        };
    } catch (error) {
        console.error("❌ Error fetching all bank account change requests:", error);
        return {
            status: false,
            message: error || "Internal Server Error",
        };
    }
};

export async function reviewBankAccountChangeRequest(
    adminId: number,
    adminRole: string,
    isApproved: boolean,
    bankAccountChangeRequestId: number
) {
    try {
        const {
            status: changeRequestStatus,
            bankAccountChangeRequest,
        } = await getBankAccountChangeRequestById(bankAccountChangeRequestId);

        if (!changeRequestStatus || !bankAccountChangeRequest) {
            return { status: false, message: "Bank account change request not found." };
        }

        if (isApproved) {
            const {
                adminId: supplierId,
                accountHolderName,
                accountNumber,
                bankName,
                bankBranch,
                accountType,
                ifscCode,
                cancelledChequeImage,
            } = bankAccountChangeRequest;

            const {
                status: bankAccountStatus,
                bankAccount,
            } = await getSupplierBankAccountBySupplierId(supplierId);

            if (bankAccountStatus && bankAccount) {
                // Update existing bank account
                await prisma.bankAccount.update({
                    where: { id: bankAccount.id },
                    data: {
                        accountHolderName,
                        accountNumber,
                        bankName,
                        bankBranch,
                        accountType,
                        ifscCode,
                        cancelledChequeImage,
                        updatedAt: new Date(),
                        updatedBy: adminId,
                        updatedByRole: adminRole,
                    },
                });
            } else {
                // Create a new bank account
                await prisma.bankAccount.create({
                    data: {
                        adminId: supplierId,
                        accountHolderName,
                        accountNumber,
                        bankName,
                        bankBranch,
                        accountType,
                        ifscCode,
                        cancelledChequeImage,
                        createdAt: new Date(),
                        createdBy: adminId,
                        createdByRole: adminRole,
                    },
                });
            }

            await prisma.bankAccountChangeRequest.delete({
                where: { id: bankAccountChangeRequestId },
            });

            return { status: true, message: "Bank account change request approved." };
        } else {
            // Rejected: simply delete the request
            await prisma.bankAccountChangeRequest.delete({
                where: { id: bankAccountChangeRequestId },
            });

            return { status: true, message: "Bank account change request rejected and deleted." };
        }
    } catch (error) {
        logMessage("error", "Error in reviewing bank account change request", error);
        return { status: false, message: "Internal Server Error" };
    }
}
