import prisma from "@/lib/prisma";
import path from "path";
import { deleteFile } from '@/utils/saveFiles';
import { logMessage } from "@/utils/commonUtils";

interface Variant {
    id?: number;
    name?: string;
    color?: string;
    sku: string;
    suggested_price?: number;
    product_link: string;
    model: string;
}

interface VariantSKUInput {
    sku: string;
    id?: number | null;
}

interface Product {
    name: string;
    categoryId: number;
    imageSortingIndex: string;
    main_sku: string;
    hsnCode: string | null;
    taxRate: number | null;
    rtoAddress: string | null;
    pickupAddress: string | null;
    description: string | null;
    gallery: string;
    tags: string;
    brandId: number;
    originCountryId: number;
    shippingCountryId: number;
    list_as: string | null;
    shipping_time: string | null;
    weight: number | null;
    package_length: number | null;
    package_width: number | null;
    package_height: number | null;
    chargeable_weight: number | null;
    variants: Variant[];
    product_detail_video?: string | null;
    status: boolean;
    isVarientExists: boolean;
    package_weight_image?: string | null;
    package_length_image?: string | null;
    package_width_image?: string | null;
    package_height_image?: string | null;
    video_url?: string | null;
    training_guidance_video?: string | null;
    isVisibleToAll?: boolean;
    createdBy?: number | null;
    createdByRole?: string | null;
    updatedBy?: number | null;
    updatedAt?: Date;
    updatedByRole?: string | null;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

type ImageType =
    | 'package_weight_image'
    | 'package_length_image'
    | 'package_width_image'
    | 'package_height_image'
    | 'gallery';

type ProductFilters = {
    categoryId?: number;
    brandId?: number;
};

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

export async function checkMainSKUAvailability(main_sku: string) {
    try {
        const existing = await prisma.product.findUnique({
            where: { main_sku },
        });

        if (existing) {
            return {
                status: false,
                message: `SKU "${main_sku}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `SKU "${main_sku}" is available.`,
        };
    } catch (error) {
        console.error("Error checking SKU:", error);
        return {
            status: false,
            message: "Error while checking SKU availability.",
        };
    }
}

export async function checkMainSKUAvailabilityForUpdate(main_sku: string, productId: number) {
    try {
        const existing = await prisma.product.findUnique({
            where: {
                main_sku,
                NOT: {
                    id: productId,  // Exclude the current product being updated
                },
            },

        });

        if (existing) {
            return {
                status: false,
                message: `SKU "${main_sku}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `SKU "${main_sku}" is available.`,
        };
    } catch (error) {
        console.error("Error checking SKU:", error);
        return {
            status: false,
            message: "Error while checking SKU availability.",
        };
    }
}

export async function checkVariantSKUsAvailability(skus: string[]) {
    try {
        // Get existing SKUs from the database
        const existingVariants = await prisma.productVariant.findMany({
            where: {
                sku: {
                    in: skus
                }
            },
            select: {
                sku: true
            }
        });

        if (existingVariants.length > 0) {
            const usedSkus = existingVariants.map(v => v.sku);
            return {
                status: false,
                message: `The following SKUs are already in use: ${usedSkus.join(', ')}`,
                usedSkus
            };
        }

        return {
            status: true,
            message: `All SKUs are available.`,
        };
    } catch (error) {
        console.error("Error checking variant SKUs:", error);
        return {
            status: false,
            message: "Error while checking variant SKU availability.",
        };
    }
}

export async function checkVariantSKUsAvailabilityForUpdate(variants: VariantSKUInput[], productId: number) {
    try {
        const skus = variants.map(v => v.sku);

        // Fetch existing variants with matching SKUs, excluding current productId
        const existingVariants = await prisma.productVariant.findMany({
            where: {
                sku: {
                    in: skus,
                },
                NOT: {
                    productId,
                },
            },
            select: {
                sku: true,
                id: true,
            },
        });

        // Filter out variants that match the same id (i.e., currently being updated)
        const conflictingSkus = existingVariants.filter(ev => {
            const incomingVariant = variants.find(v => v.sku === ev.sku);
            return !incomingVariant?.id || incomingVariant.id !== ev.id;
        });

        if (conflictingSkus.length > 0) {
            const usedSkus = conflictingSkus.map(v => v.sku);
            return {
                status: false,
                message: `The following SKUs are already in use: ${usedSkus.join(', ')}`,
                usedSkus,
            };
        }

        return {
            status: true,
            message: 'All SKUs are available.',
        };
    } catch (error) {
        console.error('Error checking variant SKUs:', error);
        return {
            status: false,
            message: 'Error while checking variant SKU availability.',
        };
    }
}

export async function generateProductSlug(name: string) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let isSlugTaken = true;
    let suffix = 0;

    // Keep checking until an unused slug is found
    while (isSlugTaken) {
        const existingProduct = await prisma.product.findUnique({
            where: { slug },
        });

        if (existingProduct) {
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

export async function generateUniqueShippingOwlProductId() {
    let isIdTaken = true;
    let shippingOwlProductId = '';

    while (isIdTaken) {
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        shippingOwlProductId = `PRD-${randomNumber}`;

        const existingProduct = await prisma.product.findUnique({
            where: { shippingOwlProductId },
        });

        isIdTaken = !!existingProduct;
    }

    return shippingOwlProductId;
}

export async function createProduct(adminId: number, adminRole: string, product: Product) {
    try {
        const {
            name,
            categoryId,
            main_sku,
            hsnCode,
            taxRate,
            rtoAddress,
            pickupAddress,
            description,
            gallery,
            imageSortingIndex,
            tags,
            brandId,
            originCountryId,
            shippingCountryId,
            list_as,
            shipping_time,
            weight,
            package_length,
            package_width,
            package_height,
            chargeable_weight,
            variants,
            product_detail_video,
            training_guidance_video,
            isVisibleToAll,
            status,
            isVarientExists,
            package_weight_image,
            package_length_image,
            package_width_image,
            package_height_image,
            video_url,
            createdBy,
            createdByRole
        } = product;

        // Generate a unique slug for the product
        const slug = await generateProductSlug(name);

        const shippingOwlProductId = await generateUniqueShippingOwlProductId();

        // Create the product in the database
        const newProduct = await prisma.product.create({
            data: {
                shippingOwlProductId,
                name,
                categoryId,  // Use categoryId here
                main_sku,
                hsnCode,
                taxRate,
                rtoAddress,
                pickupAddress,
                description,
                gallery,
                imageSortingIndex,
                tags,
                brandId,  // Use brandId here
                originCountryId,  // Use originCountryId here
                shippingCountryId,  // Use shippingCountryId here
                list_as,
                shipping_time,
                weight,
                package_length,
                package_width,
                package_height,
                chargeable_weight,
                product_detail_video,
                training_guidance_video,
                isVisibleToAll,
                status,
                isVarientExists,
                package_weight_image,
                package_length_image,
                package_width_image,
                package_height_image,
                video_url,
                createdBy,
                createdByRole,
                slug,
                createdAt: new Date(),
            },
        });

        // Convert BigInt to string for serialization
        const productWithStringBigInts = {
            ...newProduct,
            originCountryId: newProduct.originCountryId.toString(),
            shippingCountryId: newProduct.shippingCountryId.toString()
        };


        // If there are variants, create them separately in the related productVariant model
        if (variants && variants.length > 0) {
            const productVariants = variants.map(variant => ({
                name: variant.name ?? '',
                color: variant.color ?? '',
                sku: variant.sku ?? '',
                suggested_price: typeof variant.suggested_price === 'string'
                    ? parseFloat(variant.suggested_price)
                    : variant.suggested_price ?? 0,
                product_link: variant.product_link ?? '',
                productId: productWithStringBigInts.id,
                model: variant.model ?? '',
            }));

            // Create variants in the database
            try {
                await prisma.productVariant.createMany({
                    data: productVariants,
                });
            } catch (variantError) {
                console.error('Error creating product variants:', variantError);

                // If variants creation fails, delete the main product
                await prisma.product.delete({
                    where: { id: productWithStringBigInts.id },
                });

                // Throw the error to exit the transaction
                throw new Error('Failed to create product variants');
            }
        }

        const { status: productStatus, product: fetchedProduct, message } = await getProductById(newProduct.id);

        if (!productStatus || !fetchedProduct) {
            return { status: false, message: message || "Product not found." };
        }

        return { status: true, product: serializeBigInt(fetchedProduct) };
    } catch (error) {
        console.error(`Error creating product:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function assignProductVisibilityToSuppliers(
    adminId: number,
    adminRole: string,
    productId: number,
    supplierIds: number[]
) {
    try {
        // 1. Validate product existence
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return { status: false, message: "Product not found." };
        }

        // 2. Validate supplier IDs
        const validSuppliers = await prisma.admin.findMany({
            where: {
                id: { in: supplierIds },
                role: "supplier",
                deletedAt: null,
            },
            select: { id: true },
        });

        const validSupplierIds = validSuppliers.map(s => s.id);
        const invalidSupplierIds = supplierIds.filter(id => !validSupplierIds.includes(id));
        if (invalidSupplierIds.length > 0) {
            return {
                status: false,
                message: `Invalid supplier IDs: ${invalidSupplierIds.join(', ')}`,
            };
        }

        // 3. Fetch existing visibility entries
        const existingVisibility = await prisma.productSupplierVisibility.findMany({
            where: { productId },
            select: { supplierId: true },
        });

        const existingSupplierIds = existingVisibility.map(v => v.supplierId);

        // 4. Determine suppliers to add and to remove
        const newSupplierIds = supplierIds.filter(id => !existingSupplierIds.includes(id));
        const supplierIdsToRemove = existingSupplierIds.filter(id => !supplierIds.includes(id));

        // 5. Transaction for updating visibility
        await prisma.$transaction(async (tx) => {
            // 5a. Update product visibility flag
            await tx.product.update({
                where: { id: productId },
                data: {
                    isVisibleToAll: false,
                    updatedBy: adminId,
                    updatedByRole: adminRole,
                    updatedAt: new Date(),
                },
            });

            // 5b. Add new entries
            if (newSupplierIds.length > 0) {
                await tx.productSupplierVisibility.createMany({
                    data: newSupplierIds.map(supplierId => ({
                        productId,
                        supplierId,
                        createdBy: adminId,
                        createdByRole: adminRole,
                        createdAt: new Date(),
                    })),
                });
            }

            // 5c. Remove unwanted entries
            if (supplierIdsToRemove.length > 0) {
                await tx.productSupplierVisibility.deleteMany({
                    where: {
                        productId,
                        supplierId: { in: supplierIdsToRemove },
                    },
                });
            }
        });

        // 6. Return updated visibility
        const updatedVisibility = await prisma.productSupplierVisibility.findMany({
            where: { productId },
            include: { supplier: true },
        });

        return {
            status: true,
            message: `Product visibility updated for ${supplierIds.length} supplier(s).`,
            visibility: serializeBigInt(updatedVisibility),
        };
    } catch (error) {
        console.error("Error assigning product visibility to suppliers:", error);
        return {
            status: false,
            message: "Error assigning product visibility to suppliers.",
        };
    }
}

export async function getSuppliersByProductId(productId: number) {
    try {
        // Validate product existence
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return {
                status: false,
                message: "Product not found.",
            };
        }

        // Fetch all suppliers associated with the product from productSupplierVisibility
        const suppliers = await prisma.productSupplierVisibility.findMany({
            where: {
                productId,
                supplier: {
                    role: "supplier",
                    deletedAt: null, // Ensure only active suppliers are returned
                },
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });

        if (suppliers.length === 0) {
            return {
                status: true,
                message: "No suppliers found for this product.",
                suppliers: [],
            };
        }

        // Serialize BigInt fields (e.g., supplier.id)
        const sanitizedSuppliers = serializeBigInt(suppliers);

        logMessage('debug', 'Fetched suppliers for product:', sanitizedSuppliers);

        return {
            status: true,
            message: `Found ${suppliers.length} supplier(s) for product ID ${productId}.`,
            suppliers: sanitizedSuppliers,
        };
    } catch (error) {
        console.error("Error fetching suppliers for product:", error);
        return {
            status: false,
            message: "Error fetching suppliers for product.",
        };
    }
}

export const getProductsByFiltersAndStatus = async (productFilters: ProductFilters, status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        // Define status condition
        const statusCondition:
            | { status: true; deletedAt: null }
            | { status: false; deletedAt: null }
            | { deletedAt: { not: null } }
            | { deletedAt: null } = (() => {
                switch (status) {
                    case "active":
                        return { status: true, deletedAt: null };
                    case "inactive":
                        return { status: false, deletedAt: null };
                    case "deleted":
                        return { deletedAt: { not: null } };
                    case "notDeleted":
                        return { deletedAt: null };
                    default:
                        throw new Error("Invalid status");
                }
            })();

        console.log(`productFilters - `, productFilters);

        // Combine with filters (fully typed)
        const whereCondition = {
            ...statusCondition,
            ...(productFilters.categoryId !== undefined && {
                categoryId: productFilters.categoryId,
            }),
            ...(productFilters.brandId !== undefined && {
                brandId: productFilters.brandId,
            }),
        };

        const products = await prisma.product.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            select: {
                id: true,
                shippingOwlProductId: true,
                categoryId: true,
                name: true,
                slug: true,
                main_sku: true,
                gallery: true,
                imageSortingIndex: true,
                tags: true,
                brandId: true,
                originCountryId: true,
                hsnCode: true,
                taxRate: true,
                rtoAddress: true,
                pickupAddress: true,
                shippingCountryId: true,
                video_url: true,
                list_as: true,
                shipping_time: true,
                weight: true,
                package_length: true,
                package_width: true,
                package_height: true,
                chargeable_weight: true,
                package_weight_image: true,
                package_length_image: true,
                package_width_image: true,
                package_height_image: true,
                product_detail_video: true,
                training_guidance_video: true,
                isVisibleToAll: true,
                status: true,
                isVarientExists: true,
                createdAt: true,
                createdBy: true,
                createdByRole: true,
                updatedAt: true,
                updatedBy: true,
                updatedByRole: true,
                deletedAt: true,
                deletedBy: true,
                deletedByRole: true,

                // Include related "variants"
                variants: true, // or use `select` inside if you want specific fields from variants
            },
        });

        const sanitizedProducts = serializeBigInt(products);
        logMessage("debug", "Fetched products:", sanitizedProducts);

        return { status: true, products: sanitizedProducts };
    } catch (error) {
        console.error(`Error fetching products by filters and status:`, error);
        return { status: false, message: "Error fetching products" };
    }
};

export const getProductsByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const products = await prisma.product.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
            select: {
                id: true,
                shippingOwlProductId: true,
                categoryId: true,
                name: true,
                slug: true,
                main_sku: true,
                gallery: true,
                imageSortingIndex: true,
                tags: true,
                brandId: true,
                originCountryId: true,
                hsnCode: true,
                taxRate: true,
                rtoAddress: true,
                pickupAddress: true,
                shippingCountryId: true,
                video_url: true,
                list_as: true,
                shipping_time: true,
                weight: true,
                package_length: true,
                package_width: true,
                package_height: true,
                chargeable_weight: true,
                package_weight_image: true,
                package_length_image: true,
                package_width_image: true,
                package_height_image: true,
                product_detail_video: true,
                training_guidance_video: true,
                isVisibleToAll: true,
                status: true,
                isVarientExists: true,
                createdAt: true,
                createdBy: true,
                createdByRole: true,
                updatedAt: true,
                updatedBy: true,
                updatedByRole: true,
                deletedAt: true,
                deletedBy: true,
                deletedByRole: true,

                // Include related "variants"
                variants: true, // or use `select` inside if you want specific fields from variants
            },
        });

        const sanitizedProducts = serializeBigInt(products);
        logMessage('debug', 'fetched products :', sanitizedProducts);

        return { status: true, products: sanitizedProducts };
    } catch (error) {
        console.error(`Error fetching products by status (${status}):`, error);
        return { status: false, message: "Error fetching products" };
    }
};

// 🔵 GET BY ID
export const removeProductImageByIndex = async (
    productId: number,
    type: ImageType, // 👈 restrict to known keys
    imageIndex: number
) => {
    try {
        const { status, product, message } = await getProductById(productId);

        if (!status || !product) {
            return { status: false, message: message || "Product not found." };
        }

        logMessage(`debug`, `product (${type}):`, product);

        const allowedImages = {
            package_weight_image: product.package_weight_image,
            package_length_image: product.package_length_image,
            package_width_image: product.package_width_image,
            package_height_image: product.package_height_image,
            gallery: product.gallery,
        };

        const images = allowedImages[type]; // ✅ No TS error now

        console.log(`Images of type '${type}':`, images);

        if (!images) {
            return { status: false, message: "No images available to delete." };
        }

        const imagesArr = images.split(",");

        if (imageIndex < 0 || imageIndex >= imagesArr.length) {
            return { status: false, message: "Invalid image index provided." };
        }

        const removedImage = imagesArr.splice(imageIndex, 1)[0]; // Remove image at given index
        const updatedImages = imagesArr.join(",");

        // Update product in DB
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { [type]: updatedImages },
        });

        // 🔥 Attempt to delete the image file from storage
        const imageFileName = path.basename(removedImage.trim());
        const filePath = path.join(process.cwd(), "public", "uploads", "product", imageFileName);

        const fileDeleted = await deleteFile(filePath);

        return {
            status: true,
            message: fileDeleted
                ? "Image removed and file deleted successfully."
                : "Image removed, but file deletion failed.",
            product: serializeBigInt(updatedProduct),
        };
    } catch (error) {
        console.error("❌ Error removing product image:", error);
        return {
            status: false,
            message: "An unexpected error occurred while removing the image.",
        };
    }
};

// 🔵 GET BY ID
export const getProductById = async (id: number, includeOtherSuppliers: boolean = false) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { variants: true, supplierVisibility: true },
        });

        if (!product) return { status: false, message: "Product not found" };

        let otherSuppliers: { id: number; productId: number; supplierId: number }[] = [];

        if (includeOtherSuppliers) {
            otherSuppliers = await prisma.supplierProduct.findMany({
                where: {
                    productId: id,
                },
                include: {
                    supplier: true,
                }
            });
        }

        return { status: true, product: serializeBigInt(product), otherSuppliers: serializeBigInt(otherSuppliers), };
    } catch (error) {
        console.error("❌ getProductById Error:", error);
        return { status: false, message: "Error fetching product" };
    }
};

export const getProductDescriptionById = async (id: number) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                description: true
            }
        });

        if (!product) return { status: false, message: "Product not found" };

        return { status: true, product: serializeBigInt(product) };
    } catch (error) {
        console.error("❌ getProductDescriptionById Error:", error);
        return { status: false, message: "Error fetching product description" };
    }
};

export const getProductVariantById = async (id: number) => {
    try {
        const productVariant = await prisma.productVariant.findUnique({
            where: { id }
        });

        if (!productVariant) return { status: false, message: "productVariant Variant not found" };

        const sanitizedProductVariant = serializeBigInt(productVariant);
        logMessage('debug', 'fetched product variants :', sanitizedProductVariant);

        return { status: true, variant: sanitizedProductVariant };
    } catch (error) {
        console.error("❌ getProductVariantById Error:", error);
        return { status: false, message: "Error fetching product variant" };
    }
};

// 🟡 UPDATE
export const updateProduct = async (
    adminId: number,
    adminRole: string,
    productId: number,
    product: Product
) => {
    try {
        const {
            name,
            categoryId,
            main_sku,
            hsnCode,
            taxRate,
            rtoAddress,
            pickupAddress,
            description,
            imageSortingIndex,
            tags,
            brandId,
            originCountryId,
            shippingCountryId,
            list_as,
            shipping_time,
            weight,
            package_length,
            package_width,
            package_height,
            chargeable_weight,
            variants,
            product_detail_video,
            training_guidance_video,
            status,
            isVarientExists,
            package_weight_image,
            package_length_image,
            package_width_image,
            package_height_image,
            video_url,
        } = product;

        let {
            gallery
        } = product;

        // Image fields to process
        const imageFields: Array<'package_weight_image' | 'package_length_image' | 'package_width_image' | 'package_height_image' | 'gallery'> = [
            'package_weight_image',
            'package_length_image',
            'package_width_image',
            'package_height_image',
            'gallery'
        ];

        // Fetch existing product once
        const productResponse = await getProductById(productId);
        if (!productResponse.status || !productResponse.product) {
            return {
                status: false,
                message: productResponse.message || "Product not found.",
            };
        }

        const existingProduct = productResponse.product;

        for (const field of imageFields) {
            const newValue = product[field];
            const existingValue = existingProduct[field];

            const isValidString = (val: unknown): val is string =>
                typeof val === 'string' && val.trim() !== '';

            if (isValidString(newValue)) {
                const newImages = newValue
                    .split(',')
                    .map(img => img.trim())
                    .filter(Boolean);
                const existingImages = isValidString(existingValue)
                    ? existingValue.split(',').map(img => img.trim()).filter(Boolean)
                    : [];
                const mergedImages = Array.from(new Set([...existingImages, ...newImages]));
                product[field] = mergedImages.join(',');
            } else {
                product[field] = existingValue ?? '';
            }
        }

        // Update the product details
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name: product.name,
                categoryId: product.categoryId,
                main_sku: product.main_sku,
                hsnCode: product.hsnCode,
                taxRate: product.taxRate,
                rtoAddress: product.rtoAddress,
                pickupAddress: product.pickupAddress,
                description: product.description,
                gallery: product.gallery,
                imageSortingIndex: product.imageSortingIndex,
                tags: product.tags,
                brandId: product.brandId,
                originCountryId: product.originCountryId,
                shippingCountryId: product.shippingCountryId,
                list_as: product.list_as,
                shipping_time: product.shipping_time,
                weight: product.weight,
                package_length: product.package_length,
                package_width: product.package_width,
                package_height: product.package_height,
                chargeable_weight: product.chargeable_weight,
                product_detail_video: product.product_detail_video,
                training_guidance_video: product.training_guidance_video,
                status: product.status,
                isVarientExists: product.isVarientExists,
                package_weight_image: product.package_weight_image,
                package_length_image: product.package_length_image,
                package_width_image: product.package_width_image,
                package_height_image: product.package_height_image,
                video_url: product.video_url,
                updatedBy: adminId,
                updatedByRole: adminRole,
                updatedAt: new Date(),
            },
        });

        // Handle variants: update if id exists, else create new
        if (variants && variants.length > 0) {

            // Get incoming IDs from variants
            const incomingIds = variants
                .filter(v => v.id)
                .map(v => Number(v.id));

            // Delete DB variants for this product that are not in incoming list
            await prisma.productVariant.deleteMany({
                where: {
                    productId: productId,
                    ...(incomingIds.length > 0 && {
                        id: {
                            notIn: incomingIds,
                        },
                    }),
                },
            });

            for (const variant of variants) {
                const variantData = {
                    name: variant.name ?? '',
                    color: variant.color ?? '',
                    sku: variant.sku ?? '',
                    suggested_price: typeof variant.suggested_price === 'string'
                        ? parseFloat(variant.suggested_price)
                        : variant.suggested_price ?? 0,
                    product_link: variant.product_link ?? '',
                    model: variant.model ?? '',
                    updatedBy: adminId ?? 0,
                    updatedByRole: adminRole ?? '',
                    updatedAt: new Date(),
                };

                if (variant.id) {
                    await prisma.productVariant.update({
                        where: { id: Number(variant.id) },
                        data: variantData,
                    });
                } else {
                    await prisma.productVariant.create({
                        data: {
                            ...variantData,
                            productId: productId,
                        },
                    });
                }
            }
        }

        const sanitizedProducts = serializeBigInt(updatedProduct);
        logMessage('debug', 'fetched products :', sanitizedProducts);

        return { status: true, product: sanitizedProducts };
    } catch (error) {
        console.error("❌ updateProduct Error:", error);
        return { status: false, message: "Error updating product" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field for product and variants)
export const softDeleteProduct = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Soft delete the product
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        // Soft delete the variants of this product
        const updatedVariants = await prisma.productVariant.updateMany({
            where: { productId: id },  // assuming `productId` is the foreign key in the variant table
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });

        return {
            status: true,
            message: "Product and variants soft deleted successfully",
            updatedProduct,
            updatedVariants
        };
    } catch (error) {
        console.error("❌ softDeleteProduct Error:", error);
        return { status: false, message: "Error soft deleting product and variants" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted product and its variants by setting deletedAt to null)
export const restoreProduct = async (adminId: number, adminRole: string, id: number) => {
    try {
        // Restore the product
        const restoredProduct = await prisma.product.update({
            where: { id },
            include: { variants: true },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the product
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Restore the variants of this product
        await prisma.productVariant.updateMany({
            where: { productId: id },  // assuming `productId` is the foreign key in the variant table
            data: {
                deletedBy: null,      // Reset the deletedBy field for variants
                deletedAt: null,      // Set deletedAt to null for variants
                deletedByRole: null,  // Reset the deletedByRole field for variants
                updatedBy: adminId,   // Record the user restoring the variant
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field for variants
            },
        });

        const sanitizedProduct = serializeBigInt(restoredProduct);
        logMessage('debug', 'fetched products :', sanitizedProduct);

        return {
            status: true,
            message: "Product and variants restored successfully",
            restoredProduct: sanitizedProduct
        };
    } catch (error) {
        console.error("❌ restoreProduct Error:", error);
        return { status: false, message: "Error restoring product and variants" };
    }
};

// 🔴 DELETE
export const deleteProduct = async (id: number) => {
    try {
        console.log(`id - `, id);
        await prisma.product.delete({ where: { id } });
        return { status: true, message: "Product deleted successfully" };
    } catch (error) {
        console.error("❌ deleteProduct Error:", error);
        return { status: false, message: "Error deleting product" };
    }
};