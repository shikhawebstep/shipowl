import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface ProductRequest {
    id?: number,
    name: string;
    categoryId?: number;
    category: {
        connect: { id: number }; // or whatever your relation is
    };
    expectedPrice: number;
    expectedDailyOrders?: string;
    url?: string;
    image?: string;
    status: boolean;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

// 🟡 UPDATE
export const updateProductRequest = async (
    adminId: number,
    adminRole: string,
    productRequestId: number,
    data: ProductRequest
) => {
    try {
        const {
            name,
            category,
            expectedPrice,
            expectedDailyOrders,
            url,
            status,
            image
        } = data;

        if (data.image) {
            const newImagesArr = data.image.split(",").map((img) => img.trim());

            const { status, productRequest, message } = await getProductRequestById(adminId, adminRole, productRequestId);

            if (!status || !productRequest) {
                return { status: false, message: message || "ProductRequest not found." };
            }

            const existingImages = productRequest.image
                ? productRequest.image.split(",").map((img) => img.trim())
                : [];

            // Merge and remove duplicates
            const mergedImages = Array.from(new Set([...existingImages, ...newImagesArr]));
            data.image = mergedImages.join(",");
        }

        const productRequest = await prisma.productRequest.update({
            where: { id: productRequestId }, // Assuming 'id' is the correct primary key field
            data: {
                name,
                category,
                expectedPrice,
                expectedDailyOrders,
                url,
                status,
                image,
                updatedAt: new Date(),
                updatedBy: adminId,
                updatedByRole: adminRole,
            },
        });

        return { status: true, productRequest };
    } catch (error) {
        console.error("❌ updateProductRequest Error:", error);
        return { status: false, message: "Error updating productRequest" };
    }
};

// 🔵 GET BY ID
export const getProductRequestById = async (
    adminId: number,
    adminRole: string,
    id: number
) => {
    try {
        const productRequest = await prisma.productRequest.findUnique({
            where: {
                id,
                createdBy: adminId,
                createdByRole: adminRole
            },
        });

        if (!productRequest) return { status: false, message: "ProductRequest not found" };
        return { status: true, productRequest };
    } catch (error) {
        console.error("❌ getProductRequestById Error:", error);
        return { status: false, message: "Error fetching productRequest" };
    }
};

// 🔵 GET BY ID
export const removeProductRequestImageByIndex = async (
    adminId: number,
    adminRole: string,
    productRequestId: number,
    imageIndex: number
) => {
    try {
        const { status, productRequest, message } = await getProductRequestById(adminId, adminRole, productRequestId);

        if (!status || !productRequest) {
            return { status: false, message: message || "ProductRequest not found." };
        }

        if (!productRequest.image) {
            return { status: false, message: "No images available to delete." };
        }

        const images = productRequest.image.split(",");

        if (imageIndex < 0 || imageIndex >= images.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = images.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = images.join(",");

        // Update productRequest in DB
        const updatedProductRequest = await prisma.productRequest.update({
            where: {
                id: productRequestId,
                createdBy: adminId,
                createdByRole: adminRole
            },
            data: { image: updatedImages },
        });

        // 🔥 Attempt to delete the image file from storage
        const imageFileName = path.basename(removedImage.trim());
        const filePath = path.join(process.cwd(), "public", "uploads", "productRequest", imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            productRequest: updatedProductRequest,
        };
    } catch (error) {
        console.error("❌ Error removing productRequest image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

// 🟣 GET ALL
export const getAllProductRequests = async () => {
    try {
        const productRequests = await prisma.productRequest.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, productRequests };
    } catch (error) {
        console.error("❌ getAllProductRequests Error:", error);
        return { status: false, message: "Error fetching productRequests" };
    }
};

export const getProductRequestsByStatus = async (
    adminId: number,
    adminRole: string,
    status: "active" | "inactive" | "deleted" | "notDeleted"
) => {
    try {
        let whereCondition: Record<string, unknown> = {
            createdBy: adminId,
            createdByRole: adminRole,
        };

        switch (status) {
            case "active":
                whereCondition = { ...whereCondition, status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { ...whereCondition, status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { ...whereCondition, deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { ...whereCondition, deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const productRequests = await prisma.productRequest.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            include: { category: true }
        });

        return { status: true, productRequests };
    } catch (error) {
        console.error(`Error fetching productRequests by status (${status}):`, error);
        return { status: false, message: "Error fetching productRequests" };
    }
};


// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteProductRequest = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedProductRequest = await prisma.productRequest.update({
            where: {
                id,
                createdBy: adminId,
                createdByRole: adminRole
            },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "ProductRequest soft deleted successfully", updatedProductRequest };
    } catch (error) {
        console.error("❌ softDeleteProductRequest Error:", error);
        return { status: false, message: "Error soft deleting productRequest" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted productRequest by setting deletedAt to null)
export const restoreProductRequest = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredProductRequest = await prisma.productRequest.update({
            where: {
                id,
                createdBy: adminId,
                createdByRole: adminRole
            },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the productRequest
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "ProductRequest restored successfully", restoredProductRequest };
    } catch (error) {
        console.error("❌ restoreProductRequest Error:", error);
        return { status: false, message: "Error restoring productRequest" };
    }
};

// 🔴 DELETE
export const deleteProductRequest = async (adminId: number, adminRole: string, id: number) => {
    try {
        await prisma.productRequest.delete({
            where: {
                id,
                createdBy: adminId,
                createdByRole: adminRole
            }
        });
        return { status: true, message: "ProductRequest deleted successfully" };
    } catch (error) {
        console.error("❌ deleteProductRequest Error:", error);
        return { status: false, message: "Error deleting productRequest" };
    }
};