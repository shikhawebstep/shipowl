import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface DropshipperCompany {
    admin: {
        connect: { id: number }; // City ID for permanent city (connected to a city record)
    };
    id?: bigint; // Optional: ID of the dropshipper (if exists)
    companyName?: string;
    brandName?: string;
    brandShortName?: string;
    billingAddress?: string;
    billingPincode?: string;
    billingCity?: {
        connect: { id: number }; // City ID for billing city (connected to a city record)
    };
    billingState?: {
        connect: { id: number }; // State ID for billing state (connected to a state record)
    };
    billingCountry?: {
        connect: { id: number }; // Country ID for billing country (connected to a country record)
    };
    businessType?: string;
    clientEntryType?: string;
    gstNumber?: string;
    companyPanNumber?: string;
    aadharNumber?: string;
    gstDocument?: string;
    panCardHolderName?: string;
    aadharCardHolderName?: string;
    panCardImage?: string;
    aadharCardImage?: string;
    additionalDocumentUpload?: string;
    documentId?: string;
    documentName?: string;
    documentImage?: string;
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

export const getCompanyDeailByDropshipperId = async (dropshipperId: number) => {
    try {
        const companyDetail = await prisma.companyDetail.findUnique({
            where: { adminId: dropshipperId },
        });

        if (!companyDetail) return { status: false, message: "Company Detail not found" };
        return { status: true, companyDetail };
    } catch (error) {
        console.error("❌ getCompanyDeailByDropshipperId Error:", error);
        return { status: false, message: "Error fetching dropshipper Detail" };
    }
};

export async function createDropshipperCompany(adminId: number, adminRole: string, dropshipperCompany: DropshipperCompany) {

    try {
        const {
            admin,
            gstNumber,
            gstDocument,
            panCardHolderName,
            aadharCardHolderName,
            panCardImage,
            aadharCardImage,
            createdAt,
            createdBy,
            createdByRole
        } = dropshipperCompany;

        const newDropshipper = await prisma.companyDetail.create({
            data: {
                admin,
                gstNumber,
                gstDocument,
                panCardHolderName,
                aadharCardHolderName,
                panCardImage,
                aadharCardImage,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        const sanitizedDropshipper = serializeBigInt(newDropshipper);
        return { status: true, dropshipper: sanitizedDropshipper };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const removeCompanyDetailImageByIndex = async (companyDetailId: number, dropshipperId: number, imageType: ImageType, imageIndex: number) => {
    try {
        const { status, companyDetail, message } = await getCompanyDeailByDropshipperId(dropshipperId);

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
        const filePath = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${dropshipperId}`, 'company', imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            companyDetail: updatedCompanyDeatil,
        };
    } catch (error) {
        console.error("❌ Error removing Company Deatil image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

export async function updateDropshipperCompany(
    adminId: number,
    adminRole: string,
    dropshipperId: number,
    dropshipperCompany: DropshipperCompany
) {
    try {

        const { companyDetail: currentCompanyDetail } = await getCompanyDeailByDropshipperId(dropshipperId);

        const fields = ['gstDocument', 'panCardImage', 'aadharCardImage', 'additionalDocumentUpload', 'documentImage'] as const;
        const mergedImages: Partial<Record<typeof fields[number], string>> = {};

        for (const field of fields) {
            const newImages = dropshipperCompany[field];
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
            admin: { connect: { id: dropshipperId } },
            companyName: dropshipperCompany.companyName,
            brandName: dropshipperCompany.brandName,
            brandShortName: dropshipperCompany.brandShortName,
            billingAddress: dropshipperCompany.billingAddress,
            billingPincode: dropshipperCompany.billingPincode,
            billingState: dropshipperCompany.billingState,
            billingCity: dropshipperCompany.billingCity,
            businessType: dropshipperCompany.businessType,
            clientEntryType: dropshipperCompany.clientEntryType,
            gstNumber: dropshipperCompany.gstNumber,
            companyPanNumber: dropshipperCompany.companyPanNumber,
            aadharNumber: dropshipperCompany.aadharNumber,
            panCardHolderName: dropshipperCompany.panCardHolderName,
            aadharCardHolderName: dropshipperCompany.aadharCardHolderName,
            documentId: dropshipperCompany.documentId,
            documentName: dropshipperCompany.documentName,
            updatedBy: dropshipperCompany.updatedBy,
            updatedByRole: dropshipperCompany.updatedByRole,
            updatedAt: dropshipperCompany.updatedAt,
            gstDocument: mergedImages.gstDocument,
            panCardImage: mergedImages.panCardImage,
            aadharCardImage: mergedImages.aadharCardImage,
            additionalDocumentUpload: mergedImages.additionalDocumentUpload,
            documentImage: mergedImages.documentImage,
        };

        const updatedOrCreated = currentCompanyDetail
            ? await prisma.companyDetail.update({
                where: { adminId: dropshipperId },
                data,
            })
            : await prisma.companyDetail.create({
                data,
            });

        return { status: true, dropshipper: serializeBigInt(updatedOrCreated) };
    } catch (error) {
        console.error("Error updating or creating dropshipper company:", error);
        return { status: false, message: "Internal Server Error" };
    }
}