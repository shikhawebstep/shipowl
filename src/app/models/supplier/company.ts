import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface SupplierCompany {
    admin: {
        connect: { id: number }; // City ID for permanent city (connected to a city record)
    };
    id?: bigint; // Optional: ID of the supplier (if exists)
    companyName: string;
    brandName: string;
    brandShortName: string;
    billingAddress: string;
    billingPincode: string;
    billingCity: {
        connect: { id: number }; // City ID for billing city (connected to a city record)
    };
    billingState: {
        connect: { id: number }; // State ID for billing state (connected to a state record)
    };
    billingCountry: {
        connect: { id: number }; // Country ID for billing country (connected to a country record)
    };
    businessType: string;
    clientEntryType: string;
    gstNumber: string;
    companyPanNumber: string;
    companyPanCardName?: string,
    companyPanCardImage?: string,
    aadharNumber: string;
    gstDocument: string;
    panCardHolderName: string;
    aadharCardHolderName: string;
    panCardImage: string;
    aadharCardImage: string;
    additionalDocumentUpload: string;
    documentId: string;
    documentName: string;
    documentImage: string;
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

type ImageType = "gstDocument" | "panCardImage" | "aadharCardImage" | "additionalDocumentUpload" | "documentImage";

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

export const getCompanyDeailBySupplierId = async (supplierId: number) => {
    try {
        const companyDetail = await prisma.companyDetail.findUnique({
            where: { adminId: supplierId },
        });

        if (!companyDetail) return { status: false, message: "Company Detail not found" };
        return { status: true, companyDetail };
    } catch (error) {
        console.error("❌ getCompanyDeailBySupplierId Error:", error);
        return { status: false, message: "Error fetching supplier Detail" };
    }
};

export async function createSupplierCompany(adminId: number, adminRole: string, supplierCompany: SupplierCompany) {

    try {
        const {
            admin,
            companyName,
            brandName,
            brandShortName,
            billingAddress,
            billingPincode,
            billingCountry,
            billingState,
            billingCity,
            businessType,
            clientEntryType,
            gstNumber,
            companyPanNumber,
            companyPanCardName,
            companyPanCardImage,
            aadharNumber,
            gstDocument,
            panCardHolderName,
            aadharCardHolderName,
            panCardImage,
            aadharCardImage,
            additionalDocumentUpload,
            documentId,
            documentName,
            documentImage,
            createdAt,
            createdBy,
            createdByRole
        } = supplierCompany;

        const newSupplier = await prisma.companyDetail.create({
            data: {
                admin,
                companyName,
                brandName,
                brandShortName,
                billingAddress,
                billingPincode,
                billingCountry,
                billingState,
                billingCity,
                businessType,
                clientEntryType,
                gstNumber,
                companyPanNumber,
                companyPanCardName,
                companyPanCardImage,
                aadharNumber,
                gstDocument,
                panCardHolderName,
                aadharCardHolderName,
                panCardImage,
                aadharCardImage,
                additionalDocumentUpload,
                documentId,
                documentName,
                documentImage,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        const sanitizedSupplier = serializeBigInt(newSupplier);
        return { status: true, supplier: sanitizedSupplier };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const removeCompanyDetailImageByIndex = async (companyDetailId: number, supplierId: number, imageType: ImageType, imageIndex: number) => {
    try {
        const { status, companyDetail, message } = await getCompanyDeailBySupplierId(supplierId);

        if (!status || !companyDetail) {
            return { status: false, message: message || "companyDetail not found." };
        }

        if (!companyDetail[imageType]) {
            return { status: false, message: "No images available to delete." };
        }

        const images = companyDetail[imageType].split(",");

        if (imageIndex < 0 || imageIndex >= images.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = images.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = images.join(",");

        // Update category in DB
        const updatedCompanyDeatil = await prisma.companyDetail.update({
            where: { id: companyDetailId },
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
            companyDetail: serializeBigInt(updatedCompanyDeatil),
        };
    } catch (error) {
        console.error("❌ Error removing Company Deatil image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

export async function updateSupplierCompany(
    adminId: number,
    adminRole: string,
    supplierId: number,
    supplierCompany: SupplierCompany
) {
    try {
        const { companyDetail: currentCompanyDetail } = await getCompanyDeailBySupplierId(supplierId);

        const fields = ['gstDocument', 'companyPanCardImage', 'panCardImage', 'aadharCardImage', 'additionalDocumentUpload', 'documentImage'] as const;
        const mergedImages: Partial<Record<typeof fields[number], string>> = {};

        for (const field of fields) {
            const newImages = supplierCompany[field];
            const existingImages = currentCompanyDetail?.[field];
            if (newImages && newImages.trim()) {
                const merged = Array.from(new Set([
                    ...(existingImages ? existingImages.split(',').map(x => x.trim()) : []),
                    ...newImages.split(',').map(x => x.trim())
                ])).join(',');
                mergedImages[field] = merged;
            }
        }

        const data = {
            admin: supplierCompany.admin,
            companyName: supplierCompany.companyName,
            brandName: supplierCompany.brandName,
            brandShortName: supplierCompany.brandShortName,
            billingAddress: supplierCompany.billingAddress,
            billingPincode: supplierCompany.billingPincode,
            billingCountry: supplierCompany.billingCountry,
            billingState: supplierCompany.billingState,
            billingCity: supplierCompany.billingCity,
            businessType: supplierCompany.businessType,
            clientEntryType: supplierCompany.clientEntryType,
            gstNumber: supplierCompany.gstNumber,
            companyPanNumber: supplierCompany.companyPanNumber,
            companyPanCardName: supplierCompany.companyPanCardName,
            aadharNumber: supplierCompany.aadharNumber,
            panCardHolderName: supplierCompany.panCardHolderName,
            aadharCardHolderName: supplierCompany.aadharCardHolderName,
            documentId: supplierCompany.documentId,
            documentName: supplierCompany.documentName,
            updatedBy: supplierCompany.updatedBy,
            updatedByRole: supplierCompany.updatedByRole,
            updatedAt: supplierCompany.updatedAt,
            gstDocument: mergedImages.gstDocument,
            companyPanCardImage: mergedImages.companyPanCardImage,
            panCardImage: mergedImages.panCardImage,
            aadharCardImage: mergedImages.aadharCardImage,
            additionalDocumentUpload: mergedImages.additionalDocumentUpload,
            documentImage: mergedImages.documentImage,
        };

        const updatedSupplier = currentCompanyDetail
            ? await prisma.companyDetail.update({
                where: { adminId: supplierId },
                data,
            })
            : await prisma.companyDetail.create({
                data,
            });

        return { status: true, supplier: serializeBigInt(updatedSupplier) };
    } catch (error) {
        console.error("Error updating supplier company:", error);
        return { status: false, message: "Internal Server Error" };
    }
}
