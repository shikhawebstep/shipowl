import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';

interface Category {
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

export async function generateCategorySlug(name: string) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let isSlugTaken = true;
    let suffix = 0;

    // Keep checking until an unused slug is found
    while (isSlugTaken) {
        const existingCategory = await prisma.category.findUnique({
            where: { slug },
        });

        if (existingCategory) {
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

export async function createCategory(adminId: number, adminRole: string, category: Category) {

    try {
        const { name, description, status, image } = category;

        // Generate a unique slug for the category
        const slug = await generateCategorySlug(name);

        const newCategory = await prisma.category.create({
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

        return { status: true, category: newCategory };
    } catch (error) {
        console.error(`Error creating category:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateCategory = async (
    adminId: number,
    adminRole: string,
    categoryId: number,
    data: Category
) => {
    try {
        data.updatedBy = adminId;
        data.updatedAt = new Date();
        data.updatedByRole = adminRole;

        if (data.image) {
            const newImagesArr = data.image.split(",").map((img) => img.trim());

            const { status, category, message } = await getCategoryById(categoryId);

            if (!status || !category) {
                return { status: false, message: message || "Category not found." };
            }

            const existingImages = category.image
                ? category.image.split(",").map((img) => img.trim())
                : [];

            // Merge and remove duplicates
            const mergedImages = Array.from(new Set([...existingImages, ...newImagesArr]));

            data.image = mergedImages.join(",");
        }

        const category = await prisma.category.update({
            where: { id: categoryId }, // Assuming 'id' is the correct primary key field
            data: data,
        });

        return { status: true, category };
    } catch (error) {
        console.error("❌ updateCategory Error:", error);
        return { status: false, message: "Error updating category" };
    }
};

// 🔵 GET BY ID
export const getCategoryById = async (id: number) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) return { status: false, message: "Category not found" };
        return { status: true, category };
    } catch (error) {
        console.error("❌ getCategoryById Error:", error);
        return { status: false, message: "Error fetching category" };
    }
};

// 🔵 GET BY ID
export const removeCategoryImageByIndex = async (categoryId: number, imageIndex: number) => {
    try {
        const { status, category, message } = await getCategoryById(categoryId);

        if (!status || !category) {
            return { status: false, message: message || "Category not found." };
        }

        if (!category.image) {
            return { status: false, message: "No images available to delete." };
        }

        const images = category.image.split(",");

        if (imageIndex < 0 || imageIndex >= images.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = images.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = images.join(",");

        // Update category in DB
        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: { image: updatedImages },
        });

        // 🔥 Attempt to delete the image file from storage
        const imageFileName = path.basename(removedImage.trim());
        const filePath = path.join(process.cwd(), "public", "uploads", "category", imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            category: updatedCategory,
        };
    } catch (error) {
        console.error("❌ Error removing category image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

// 🟣 GET ALL
export const getAllCategories = async () => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, categories };
    } catch (error) {
        console.error("❌ getAllCategories Error:", error);
        return { status: false, message: "Error fetching categories" };
    }
};

export const getCategoriesByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const categories = await prisma.category.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, categories };
    } catch (error) {
        console.error(`Error fetching categories by status (${status}):`, error);
        return { status: false, message: "Error fetching categories" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteCategory = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "Category soft deleted successfully", updatedCategory };
    } catch (error) {
        console.error("❌ softDeleteCategory Error:", error);
        return { status: false, message: "Error soft deleting category" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted category by setting deletedAt to null)
export const restoreCategory = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredCategory = await prisma.category.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the category
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "Category restored successfully", restoredCategory };
    } catch (error) {
        console.error("❌ restoreCategory Error:", error);
        return { status: false, message: "Error restoring category" };
    }
};

// 🔴 DELETE
export const deleteCategory = async (id: number) => {
    try {
        await prisma.category.delete({ where: { id } });
        return { status: true, message: "Category deleted successfully" };
    } catch (error) {
        console.error("❌ deleteCategory Error:", error);
        return { status: false, message: "Error deleting category" };
    }
};