import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface Brand {
    name: string;
    description: string;
    status: boolean;
    image?: string;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

export async function generateBrandSlug(name: string) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let isSlugTaken = true;
    let suffix = 0;

    // Keep checking until an unused slug is found
    while (isSlugTaken) {
        const existingBrand = await prisma.brand.findUnique({
            where: { slug },
        });

        if (existingBrand) {
            // If the slug already exists, add a suffix (-1, -2, etc.)
            suffix++;
            slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${suffix}`;
        } else {
            // If the slug is not taken, set isSlugTaken to false to exit the loop
            isSlugTaken = false;
        }
    }

    return slug;
}

export async function createBrand(adminId: number, adminRole: string, brand: Brand) {

    try {
        const { name, description, status, image } = brand;

        // Generate a unique slug for the brand
        const slug = await generateBrandSlug(name);

        const newBrand = await prisma.brand.create({
            data: {
                name,
                description,
                status,
                slug,
                image,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        return { status: true, brand: newBrand };
    } catch (error) {
        console.error(`Error creating brand:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateBrand = async (
    adminId: number,
    adminRole: string,
    brandId: number,
    data: Brand
) => {
    try {
        data.updatedBy = adminId;
        data.updatedAt = new Date();
        data.updatedByRole = adminRole;

        if (data.image) {
            const newImagesArr = data.image.split(",").map((img) => img.trim());

            const { status, brand, message } = await getBrandById(brandId);

            if (!status || !brand) {
                return { status: false, message: message || "Brand not found." };
            }

            const existingImages = brand.image
                ? brand.image.split(",").map((img) => img.trim())
                : [];

            // Merge and remove duplicates
            const mergedImages = Array.from(new Set([...existingImages, ...newImagesArr]));

            data.image = mergedImages.join(",");
        }

        const brand = await prisma.brand.update({
            where: { id: brandId }, // Assuming 'id' is the correct primary key field
            data: data,
        });

        return { status: true, brand };
    } catch (error) {
        console.error("❌ updateBrand Error:", error);
        return { status: false, message: "Error updating brand" };
    }
};

// 🔵 GET BY ID
export const getBrandById = async (id: number) => {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) return { status: false, message: "Brand not found" };
        return { status: true, brand };
    } catch (error) {
        console.error("❌ getBrandById Error:", error);
        return { status: false, message: "Error fetching brand" };
    }
};

// 🔵 GET BY ID
export const removeBrandImageByIndex = async (brandId: number, imageIndex: number) => {
    try {
        const { status, brand, message } = await getBrandById(brandId);

        if (!status || !brand) {
            return { status: false, message: message || "Brand not found." };
        }

        if (!brand.image) {
            return { status: false, message: "No images available to delete." };
        }

        const images = brand.image.split(",");

        if (imageIndex < 0 || imageIndex >= images.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = images.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = images.join(",");

        // Update brand in DB
        const updatedBrand = await prisma.brand.update({
            where: { id: brandId },
            data: { image: updatedImages },
        });

        // 🔥 Attempt to delete the image file from storage
        const imageFileName = path.basename(removedImage.trim());
        const filePath = path.join(process.cwd(), "public", "uploads", "brand", imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            brand: updatedBrand,
        };
    } catch (error) {
        console.error("❌ Error removing brand image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

// 🟣 GET ALL
export const getAllBrands = async () => {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, brands };
    } catch (error) {
        console.error("❌ getAllBrands Error:", error);
        return { status: false, message: "Error fetching brands" };
    }
};

export const getBrandsByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition = {};

        switch (status) {
            case "active":
                whereCondition = { status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const brands = await prisma.brand.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, brands };
    } catch (error) {
        console.error(`Error fetching brands by status (${status}):`, error);
        return { status: false, message: "Error fetching brands" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteBrand = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedBrand = await prisma.brand.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "Brand soft deleted successfully", updatedBrand };
    } catch (error) {
        console.error("❌ softDeleteBrand Error:", error);
        return { status: false, message: "Error soft deleting brand" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted brand by setting deletedAt to null)
export const restoreBrand = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredBrand = await prisma.brand.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the brand
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "Brand restored successfully", restoredBrand };
    } catch (error) {
        console.error("❌ restoreBrand Error:", error);
        return { status: false, message: "Error restoring brand" };
    }
};

// 🔴 DELETE
export const deleteBrand = async (id: number) => {
    try {
        await prisma.brand.delete({ where: { id } });
        return { status: true, message: "Brand deleted successfully" };
    } catch (error) {
        console.error("❌ deleteBrand Error:", error);
        return { status: false, message: "Error deleting brand" };
    }
};