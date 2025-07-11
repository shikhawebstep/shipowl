import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface Variant {
    variantId: number;
    price: number;
    status?: boolean;
}

interface Product {
    supplierProductId: number;
    shopifyProductId: string;
    shopifyStoreId: number;
    dropshipperId: number;
    variants: Variant[];
    createdBy?: number | null;
    createdByRole?: string | null;
    updatedBy?: number | null;
    updatedAt?: Date;
    updatedByRole?: string | null;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

type ProductFilters = {
    categoryId?: number;
    brandId?: number;
};

type ProductType = "all" | "my" | "notmy";
type ProductStatus = "active" | "inactive" | "deleted" | "notDeleted";

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

export async function createDropshipperProduct(
    dropshipperId: number,
    dropshipperRole: string,
    product: Product
) {
    try {
        const { supplierProductId, shopifyProductId, shopifyStoreId, variants, createdBy, createdByRole } = product;

        // Step 1: Check if main product exists
        const existingProduct = await prisma.supplierProduct.findUnique({
            where: { id: supplierProductId },
        });

        if (!existingProduct) {
            return { status: false, message: "Product does not exist." };
        }

        // Step 2: Validate each variant under this product
        const variantIds = variants.map(v => v.variantId);
        const existingVariants = await prisma.supplierProductVariant.findMany({
            where: {
                id: { in: variantIds },
                supplierProductId: supplierProductId,
            },
        });

        const existingVariantIds = new Set(existingVariants.map(v => v.id));
        const invalidVariantIds = variantIds.filter(id => !existingVariantIds.has(id));

        if (invalidVariantIds.length > 0) {
            return {
                status: false,
                message: `Invalid variants for this product: [${invalidVariantIds.join(", ")}]`,
            };
        }

        // Step 3: Create dropshipperProduct
        const newDropshipperProduct = await prisma.dropshipperProduct.create({
            data: {
                supplierProductId,
                shopifyProductId,
                shopifyStoreId,
                supplierId: existingProduct.supplierId,
                productId: existingProduct.productId,
                dropshipperId,
                createdBy,
                createdByRole,
                createdAt: new Date(),
            }
        });

        // Step 4: Create dropshipperProductVariants
        for (const variant of variants) {
            await prisma.dropshipperProductVariant.create({
                data: {
                    dropshipperId,
                    supplierProductId: newDropshipperProduct.supplierProductId,
                    dropshipperProductId: newDropshipperProduct.id,
                    productId: newDropshipperProduct.productId,
                    supplierProductVariantId: variant.variantId,
                    price: variant.price,
                    status: variant.status ?? true,
                    createdBy,
                    createdByRole,
                    createdAt: new Date(),
                },
            });
        }

        return { status: true, product: serializeBigInt(newDropshipperProduct) };
    } catch (error) {
        logMessage("error", "Error creating dropshipper product:", error);
        return { status: false, message: "Internal Server Error" };
    }
}


export const updateDropshipperProduct = async (
    dropshipperId: number,
    dropshipperRole: string,
    dropshipperProductId: number,
    product: Product
) => {
    try {
        const { variants, updatedBy, updatedByRole } = product;

        // Step 1: Check if dropshipper product exists
        const dropshipperProduct = await prisma.dropshipperProduct.findUnique({
            where: { id: dropshipperProductId },
        });

        if (!dropshipperProduct) {
            return { status: false, message: "Dropshipper product not found." };
        }

        // Step 2: Update dropshipperProduct
        await prisma.dropshipperProduct.update({
            where: { id: dropshipperProductId },
            data: {
                updatedBy,
                updatedByRole,
                updatedAt: new Date(),
            },
        });

        const incomingVariantIds = variants.map(v => v.variantId);
        await prisma.dropshipperProductVariant.deleteMany({
            where: {
                dropshipperProductId,
                supplierProductVariantId: {
                    notIn: incomingVariantIds,
                },
            },
        });

        for (const variant of variants) {
            const existing = await prisma.dropshipperProductVariant.findFirst({
                where: {
                    dropshipperProductId,
                    supplierProductVariantId: variant.variantId,
                },
            });

            if (existing) {
                await prisma.dropshipperProductVariant.update({
                    where: { id: existing.id },
                    data: {
                        price: variant.price,
                        status: variant.status ?? true,
                        updatedBy,
                        updatedByRole,
                        updatedAt: new Date(),
                    },
                });
            } else {
                await prisma.dropshipperProductVariant.create({
                    data: {
                        dropshipperId,
                        supplierProductId: dropshipperProduct.supplierProductId,
                        dropshipperProductId,
                        productId: dropshipperProduct.productId,
                        supplierProductVariantId: variant.variantId,
                        price: variant.price,
                        status: variant.status ?? true,
                        updatedBy,
                        updatedByRole,
                        updatedAt: new Date(),
                    },
                });
            }
        }

        return { status: true, message: "Dropshipper product updated successfully." };
    } catch (error) {
        console.error("Update error:", error);
        return { status: false, message: "Something went wrong." };
    }
};

export const getProductsByFiltersAndStatus = async (
    type: ProductType,
    filters: ProductFilters,
    dropshipperId: number,
    status: ProductStatus
) => {
    try {
        const statusCondition = (() => {
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

        let products;

        if (type === "all") {
            products = await prisma.supplierProduct.findMany({
                where: {
                    ...statusCondition,
                    ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
                    ...(filters.brandId ? { product: { brandId: filters.brandId } } : {}),
                },
                orderBy: { id: "desc" },
                include: {
                    variants: {
                        include: { variant: true },
                    },
                    product: {
                        include: {
                            category: true,
                            brand: true,
                        }
                    },
                },
            });
        }

        if (type === "my") {
            products = await prisma.dropshipperProduct.findMany({
                where: {
                    ...statusCondition,
                    dropshipperId,
                    ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
                    ...(filters.brandId ? { product: { brandId: filters.brandId } } : {}),
                },
                include: {
                    shopifyStore: true,
                    product: {
                        select: {
                            id: true,
                            shippingOwlProductId: true,
                            categoryId: true,
                            name: true,
                            gallery: true,
                            imageSortingIndex: true,
                            slug: true,
                            main_sku: true,
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

                            // Related category and brand still included
                            category: true,
                            brand: true,
                        },
                    },
                    dropshipper: true,
                    variants: {
                        include: {
                            supplierProductVariant: {
                                include: {
                                    variant: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { id: "desc" },
            });
        }

        if (type === "notmy") {
            const myProductIds = await prisma.dropshipperProduct.findMany({
                where: { dropshipperId },
                include: {
                    variants: true,
                }
            }).then(data => data.map(d => d.supplierProductId));

            const notMyProducts = await prisma.supplierProduct.findMany({
                where: {
                    ...statusCondition,
                    // id: { notIn: myProductIds.length ? myProductIds : [0] },
                },
                orderBy: { id: "desc" },
                include: {
                    product: {
                        select: {
                            id: true,
                            shippingOwlProductId: true,
                            categoryId: true,
                            name: true,
                            gallery: true,
                            imageSortingIndex: true,
                            slug: true,
                            main_sku: true,
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
                        },
                    },
                    variants: {
                        select: {
                            id: true,
                            supplierId: true,
                            productId: true,
                            productVariantId: true,
                            supplierProductId: true,
                            price: true,
                            variant: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                    model: true,
                                    sku: true
                                }
                            }
                        }
                    }
                },
            });

            console.dir(notMyProducts, { depth: null, colors: true });

            // Attach each variant's lowest suggested_price from other dropshippers
            const enrichedProducts = await Promise.all(
                notMyProducts.map(async (product) => {
                    const enrichedVariants = await Promise.all(
                        product.variants.map(async (variant) => {
                            const priceData = await prisma.dropshipperProductVariant.findFirst({
                                where: {
                                    supplierProductVariantId: variant.id,
                                    dropshipperProduct: {
                                        dropshipperId: { not: dropshipperId }, // Only other dropshippers
                                    },
                                },
                                orderBy: { price: "asc" },
                                select: { price: true },
                            });

                            return {
                                ...variant,
                                lowestOtherDropshipperSuggestedPrice: priceData?.price ?? null,
                            };
                        })
                    );

                    return {
                        ...product,
                        variants: enrichedVariants, // Overwrite with enriched variants
                    };
                })
            );

            const uniqueByProductId = [];
            const seenProductIds = new Set();

            for (const item of enrichedProducts) {
                if (!seenProductIds.has(item.productId)) {
                    seenProductIds.add(item.productId);
                    uniqueByProductId.push(item);
                }
            }

            products = uniqueByProductId;
        }

        return { status: true, products: serializeBigInt(products) };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { status: false, message: "Error fetching products" };
    }
};

export const getProductsByStatus = async (
    type: "all" | "my" | "notmy",
    dropshipperId: number,
    status: "active" | "inactive" | "deleted" | "notDeleted"
) => {
    try {
        console.log(`type - ${type} // dropshipperId - ${dropshipperId} // status - ${status}`);
        const statusCondition = (() => {
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

        let products = [];
        if (type === "all") {
            products = await prisma.supplierProduct.findMany({
                where: statusCondition,
                orderBy: { id: "desc" },
                include: {
                    variants: {
                        include: {
                            variant: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            shippingOwlProductId: true,
                            categoryId: true,
                            name: true,
                            gallery: true,
                            imageSortingIndex: true,
                            slug: true,
                            main_sku: true,
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

                            // Related category and brand still included
                            category: true,
                            brand: true,
                        },
                    },
                },
            });
        } else if (type === "my") {
            products = await prisma.dropshipperProduct.findMany({
                where: { ...statusCondition, dropshipperId },
                include: {
                    product: {
                        select: {
                            id: true,
                            shippingOwlProductId: true,
                            categoryId: true,
                            name: true,
                            gallery: true,
                            imageSortingIndex: true,
                            slug: true,
                            main_sku: true,
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

                            // Related category and brand still included
                            category: true,
                            brand: true,
                        },
                    },
                    dropshipper: true,
                    shopifyStore: true,
                    variants: {
                        include: {
                            supplierProductVariant: {
                                include: {
                                    variant: true
                                }
                            }
                        }
                    }
                },
                orderBy: { id: "desc" },
            });
        } else if (type === "notmy") {
            const myProductIds = await prisma.dropshipperProduct.findMany({
                where: { dropshipperId },
                include: {
                    variants: true,
                }
            }).then(data => data.map(d => d.supplierProductId));

            const notMyProducts = await prisma.supplierProduct.findMany({
                where: {
                    ...statusCondition,
                    // id: { notIn: myProductIds.length ? myProductIds : [0] },
                },
                orderBy: { id: "desc" },
                include: {
                    product: {
                        select: {
                            id: true,
                            shippingOwlProductId: true,
                            categoryId: true,
                            name: true,
                            gallery: true,
                            imageSortingIndex: true,
                            slug: true,
                            main_sku: true,
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
                        },
                    },
                    variants: {
                        select: {
                            id: true,
                            supplierId: true,
                            productId: true,
                            productVariantId: true,
                            supplierProductId: true,
                            price: true,
                            variant: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                    model: true,
                                    sku: true
                                }
                            }
                        }
                    }
                },
            });

            console.dir(notMyProducts, { depth: null, colors: true });

            // Attach each variant's lowest suggested_price from other dropshippers
            const enrichedProducts = await Promise.all(
                notMyProducts.map(async (product) => {
                    const enrichedVariants = await Promise.all(
                        product.variants.map(async (variant) => {
                            const priceData = await prisma.dropshipperProductVariant.findFirst({
                                where: {
                                    supplierProductVariantId: variant.id,
                                    dropshipperProduct: {
                                        dropshipperId: { not: dropshipperId }, // Only other dropshippers
                                    },
                                },
                                orderBy: { price: "asc" },
                                select: { price: true },
                            });

                            return {
                                ...variant,
                                lowestOtherDropshipperSuggestedPrice: priceData?.price ?? null,
                            };
                        })
                    );

                    return {
                        ...product,
                        variants: enrichedVariants, // Overwrite with enriched variants
                    };
                })
            );

            const uniqueByProductId = [];
            const seenProductIds = new Set();

            for (const item of enrichedProducts) {
                if (!seenProductIds.has(item.productId)) {
                    seenProductIds.add(item.productId);
                    uniqueByProductId.push(item);
                }
            }

            products = uniqueByProductId;
        } else {
            return { status: false, message: "Invalid type parameter", products: [] };
        }

        return { status: true, message: "Products fetched successfully", products: serializeBigInt(products) };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { status: false, message: "Error fetching products", products: [] };
    }
};

export const checkProductForDropshipper = async (
    dropshipperId: number,
    supplierProductId: number
) => {
    try {
        // 1. Check if product exists
        const product = await prisma.supplierProduct.findUnique({
            where: { id: supplierProductId },
            include: { variants: true, product: true }, // optional: remove if you don't need variants
        });

        if (!product) {
            return {
                status: false,
                message: "Product not found",
                existsInProduct: false,
                existsInDropshipperProduct: false,
            };
        }

        // 2. Check if product exists for the given dropshipper
        const dropshipperProduct = await prisma.dropshipperProduct.findFirst({
            where: {
                dropshipperId,
                supplierProductId,
            },
        });

        if (!dropshipperProduct) {
            return {
                status: true,
                message: "Product exists but is not assigned to the dropshipper",
                existsInProduct: true,
                existsInDropshipperProduct: false,
                product,
            };
        }

        return {
            status: true,
            message: "Product exists and is assigned to the dropshipper",
            existsInProduct: true,
            existsInDropshipperProduct: true,
            product,
            dropshipperProduct
        };
    } catch (error) {
        console.error("Error checking product for dropshipper:", error);
        return {
            status: false,
            message: "Internal server error",
            existsInProduct: false,
            existsInDropshipperProduct: false,
        };
    }
};

export const checkDropshipperProductForDropshipper = async (
    dropshipperId: number,
    dropshipperProductId: number
) => {
    try {
        // Check if the dropshipper product exists for the given dropshipper
        const dropshipperProduct = await prisma.dropshipperProduct.findFirst({
            where: {
                id: dropshipperProductId,
                dropshipperId,
            },
            include: {
                shopifyStore: true,
                product: true,
                dropshipper: true,
                variants: {
                    include: {
                        supplierProductVariant: {
                            include: {
                                variant: true
                            }
                        }
                    }
                }
            }
        });

        if (!dropshipperProduct) {
            return {
                status: true,
                message: "Dropshipper product not found or not assigned to the dropshipper.",
                existsInDropshipperProduct: false,
                dropshipperProduct: null,
            };
        }

        return {
            status: true,
            message: "Dropshipper product exists and is assigned to the dropshipper.",
            existsInDropshipperProduct: true,
            dropshipperProduct: serializeBigInt(dropshipperProduct),
        };
    } catch (error) {
        console.error("❌ Error checking dropshipper product for dropshipper:", error);
        return {
            status: false,
            message: "Internal server error while checking dropshipper product.",
            existsInDropshipperProduct: false,
            dropshipperProduct: null,
        };
    }
};

// 🟢 RESTORE (Restores a soft-deleted product and its variants by setting deletedAt to null)
export const restoreDropshipperProduct = async (
    dropshipperId: number,
    dropshipperRole: string,
    id: number
) => {
    try {
        const updatedAt = new Date();

        // Step 1: Restore the dropshipper product
        const restoredDropshipperProduct = await prisma.dropshipperProduct.update({
            where: { id },
            data: {
                deletedBy: null,
                deletedAt: null,
                deletedByRole: null,
                updatedBy: dropshipperId,
                updatedByRole: dropshipperRole,
                updatedAt,
            },
        });

        // Step 2: Restore all associated dropshipperProductVariants
        await prisma.dropshipperProductVariant.updateMany({
            where: { dropshipperProductId: id },
            data: {
                deletedBy: null,
                deletedAt: null,
                deletedByRole: null,
                updatedBy: dropshipperId,
                updatedByRole: dropshipperRole,
                updatedAt,
            },
        });

        return {
            status: true,
            message: "Dropshipper product and variants restored successfully.",
            restoredDropshipperProduct: serializeBigInt(restoredDropshipperProduct),
        };
    } catch (error) {
        console.error("❌ restoreDropshipperProduct Error:", error);
        return { status: false, message: "Error restoring dropshipper product." };
    }
};

export const softDeleteDropshipperProduct = async (
    dropshipperId: number,
    dropshipperRole: string,
    id: number
) => {
    try {
        const deletedAt = new Date();

        // Step 1: Soft delete dropshipperProduct
        const updatedDropshipperProduct = await prisma.dropshipperProduct.update({
            where: { id },
            data: {
                deletedBy: dropshipperId,
                deletedByRole: dropshipperRole,
                deletedAt,
            },
        });

        // Step 2: Soft delete all related dropshipperProductVariants
        await prisma.dropshipperProductVariant.updateMany({
            where: { dropshipperProductId: id },
            data: {
                deletedBy: dropshipperId,
                deletedByRole: dropshipperRole,
                deletedAt,
            },
        });

        return {
            status: true,
            message: "Dropshipper product and its variants soft deleted successfully.",
            updatedDropshipperProduct,
        };
    } catch (error) {
        console.error("❌ softDeleteDropshipperProduct Error:", error);
        return { status: false, message: "Error soft deleting dropshipper product." };
    }
};

// 🔴 DELETE
export const deleteDropshipperProduct = async (id: number) => {
    try {
        await prisma.dropshipperProduct.delete({ where: { id } });
        return { status: true, message: "Dropshipper Product deleted successfully" };
    } catch (error) {
        console.error("❌ deleteProduct Error:", error);
        return { status: false, message: "Error deleting dropshipper product" };
    }
};

export const getDropshipperProductById = async (id: number) => {
    try {
        const dropshipperProduct = await prisma.dropshipperProduct.findFirst({
            where: {
                id,
            }
        });

        if (!dropshipperProduct) {
            return {
                status: false,
                message: "Dropshipper product not found.",
                product: null,
            };
        }

        return {
            status: true,
            message: "Dropshipper product ID fetched successfully.",
            dropshipperProduct: serializeBigInt(dropshipperProduct),
        };
    } catch (error) {
        console.error("❌ Error in getDropshipperProductById:", error);
        return {
            status: false,
            message: "Internal server error.",
            product: null,
        };
    }
};

export const getDropshipperProductVariantById = async (id: number) => {
    try {
        const dropshipperProductVariant = await prisma.dropshipperProductVariant.findUnique({
            where: { id }
        });

        if (!dropshipperProductVariant) return { status: false, message: "dropshipperProductVariant Variant not found" };

        const sanitizedDropshipperProductVariant = serializeBigInt(dropshipperProductVariant);
        logMessage('debug', 'fetched product variants :', sanitizedDropshipperProductVariant);

        return { status: true, variant: sanitizedDropshipperProductVariant };
    } catch (error) {
        console.error("❌ getProductVariantById Error:", error);
        return { status: false, message: "Error fetching product variant" };
    }
};

export const checkSupplierProductForDropshipper = async (
    dropshipperId: number,
    supplierProductId: number
) => {
    try {
        // 1. Find the supplier product
        const supplierProduct = await prisma.supplierProduct.findFirst({
            where: { id: supplierProductId },
            include: {
                product: true,
                supplier: {
                    select: {
                        id: true,
                        uniqeId: true
                    }
                },
                variants: {
                    include: {
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                model: true,
                                sku: true
                            }
                        }
                    }
                }
            }
        });

        if (!supplierProduct) {
            return {
                status: true,
                message: "Supplier product not found or not assigned to the supplier.",
                existsInSupplierProduct: false,
                supplierProduct: null,
                otherSuppliers: [],
            };
        }

        // 2. Find other suppliers listing the same product
        const otherSuppliers = await prisma.supplierProduct.findMany({
            where: {
                productId: supplierProduct.productId,
                supplierId: { not: supplierProduct.supplierId } // Exclude current supplier
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        uniqeId: true
                    }
                },
                variants: {
                    include: {
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                model: true,
                                sku: true
                            }
                        }
                    }
                }
            }
        });

        return {
            status: true,
            message: "Supplier product exists and is assigned to the supplier.",
            existsInSupplierProduct: true,
            supplierProduct: serializeBigInt(supplierProduct),
            otherSuppliers: serializeBigInt(otherSuppliers),
        };
    } catch (error) {
        console.error("❌ Error checking supplier product for supplier:", error);
        return {
            status: false,
            message: "Internal server error while checking supplier product.",
            existsInSupplierProduct: false,
            supplierProduct: null,
            otherSuppliers: [],
        };
    }
};
