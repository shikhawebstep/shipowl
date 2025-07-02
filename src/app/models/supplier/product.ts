import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface Variant {
    variantId: number;
    stock: number;
    price: number;
    status?: boolean;
}

interface Product {
    productId: number;
    supplierId: number;
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

export async function createSupplierProduct(
    supplierId: number,
    supplierRole: string,
    product: Product
) {
    try {
        const { productId, variants, createdBy, createdByRole } = product;

        // Step 1: Check if main product exists
        const existingProduct = await prisma.product.findFirst({
            where: {
                id: productId,
                OR: [
                    { isVisibleToAll: true },
                    {
                        supplierVisibility: {
                            some: {
                                supplierId: supplierId,
                                deletedAt: null, // exclude soft-deleted visibility entries
                            },
                        },
                    },
                ],
            },
            include: {
                variants: true,
                supplierVisibility: true,
            },
        });

        if (!existingProduct) {
            return { status: false, message: "Product does not exist." };
        }

        // Step 2: Validate each variant under this product
        const variantIds = variants.map(v => v.variantId);
        const existingVariants = await prisma.productVariant.findMany({
            where: {
                id: { in: variantIds },
                productId: productId,
            },
        });

        if (existingVariants.length !== variantIds.length) {
            return { status: false, message: "One or more variants are invalid for this product." };
        }

        // Step 3: Create supplierProduct
        const newSupplierProduct = await prisma.supplierProduct.create({
            data: {
                productId,
                supplierId,
                createdBy,
                createdByRole,
                createdAt: new Date(),
            },
        });

        // Step 4: Create supplierProductVariants
        for (const variant of variants) {
            await prisma.supplierProductVariant.create({
                data: {
                    supplierId, // Add this
                    productId: newSupplierProduct.productId, // Add this
                    supplierProductId: newSupplierProduct.id,
                    productVariantId: variant.variantId,
                    stock: variant.stock,
                    price: variant.price,
                    status: variant.status ?? true,
                    createdBy,
                    createdByRole,
                    createdAt: new Date(),
                },
            });
        }

        return { status: true, product: serializeBigInt(newSupplierProduct) };
    } catch (error) {
        logMessage("error", "Error creating supplier product:", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export const updateSupplierProduct = async (
    supplierId: number,
    supplierRole: string,
    supplierProductId: number,
    product: Product
) => {
    try {
        const { variants, updatedBy, updatedByRole } = product;

        // Step 1: Check if supplier product exists
        const supplierProduct = await prisma.supplierProduct.findUnique({
            where: { id: supplierProductId },
        });

        if (!supplierProduct) {
            return { status: false, message: "Supplier product not found." };
        }

        // Step 2: Update supplierProduct
        await prisma.supplierProduct.update({
            where: { id: supplierProductId },
            data: {
                updatedBy,
                updatedByRole,
                updatedAt: new Date(),
            },
        });

        const incomingVariantIds = variants.map(v => v.variantId);
        await prisma.supplierProductVariant.deleteMany({
            where: {
                supplierProductId,
                id: {
                    notIn: incomingVariantIds,
                },
            },
        });

        // Step 3: Update or Create each variant
        for (const variant of variants) {
            const existing = await prisma.supplierProductVariant.findFirst({
                where: {
                    supplierProductId,
                    id: variant.variantId,
                },
            });

            if (existing) {
                await prisma.supplierProductVariant.update({
                    where: { id: existing.id },
                    data: {
                        stock: variant.stock,
                        price: variant.price,
                        status: variant.status ?? true,
                        updatedBy,
                        updatedByRole,
                        updatedAt: new Date(),
                    },
                });
            } else {
                await prisma.supplierProductVariant.create({
                    data: {
                        supplierId,
                        productId: supplierProduct.productId,
                        supplierProductId,
                        productVariantId: variant.variantId,
                        stock: variant.stock,
                        price: variant.price,
                        status: variant.status ?? true,
                        updatedBy,
                        updatedByRole,
                        updatedAt: new Date(),
                    },
                });
            }
        }

        return { status: true, message: "Supplier product updated successfully." };
    } catch (error) {
        console.error("Update error:", error);
        return { status: false, message: "Something went wrong." };
    }
};

export const getProductsByFiltersAndStatus = async (
    type: ProductType,
    filters: ProductFilters,
    supplierId: number,
    status: ProductStatus
) => {
    try {
        const statusCondition = (() => {
            switch (status) {
                case "active": return { status: true, deletedAt: null };
                case "inactive": return { status: false, deletedAt: null };
                case "deleted": return { deletedAt: { not: null } };
                case "notDeleted": return { deletedAt: null };
                default: throw new Error("Invalid status");
            }
        })();

        const baseFilters = {
            ...statusCondition,
            ...(filters.categoryId && { categoryId: filters.categoryId }),
            ...(filters.brandId && { brandId: filters.brandId }),
        };

        let products;

        if (type === "all") {
            products = await prisma.product.findMany({
                where: {
                    ...baseFilters,
                    OR: [
                        { isVisibleToAll: true },
                        {
                            supplierVisibility: {
                                some: {
                                    supplierId: supplierId,
                                    deletedAt: null, // exclude soft-deleted visibility entries
                                },
                            },
                        },
                    ],
                },
                include: {
                    variants: true,
                    supplierVisibility: true,
                },
            });
        }

        if (type === "my") {
            products = await prisma.supplierProduct.findMany({
                where: { ...baseFilters, supplierId },
                include: {
                    product: true,
                    supplier: true,
                    variants: {
                        include: {
                            variant: true
                        }
                    },
                },
                orderBy: { id: "desc" },
            });
        }

        if (type === "notmy") {
            const myProductIds = await prisma.supplierProduct.findMany({
                where: { supplierId },
                include: {
                    variants: true,
                }
            }).then(data => data.map(d => d.productId));

            const notMyProducts = await prisma.product.findMany({
                where: {
                    ...baseFilters,
                    id: { notIn: myProductIds.length ? myProductIds : [0] },
                    OR: [
                        { isVisibleToAll: true },
                        {
                            supplierVisibility: {
                                some: {
                                    supplierId: supplierId,
                                    deletedAt: null, // exclude soft-deleted visibility entries
                                },
                            },
                        },
                    ],
                },
                include: {
                    variants: true,
                    supplierVisibility: true,
                },
            });

            console.dir(notMyProducts, { depth: null, colors: true });

            // Attach each variant's lowest suggested_price from other suppliers
            const enrichedProducts = await Promise.all(
                notMyProducts.map(async (product) => {
                    const enrichedVariants = await Promise.all(
                        product.variants.map(async (variant) => {
                            const priceData = await prisma.supplierProductVariant.findFirst({
                                where: {
                                    productVariantId: variant.id,
                                    supplierProduct: {
                                        supplierId: { not: supplierId }, // Only other suppliers
                                    },
                                },
                                orderBy: { price: "asc" },
                                select: { price: true },
                            });

                            return {
                                ...variant,
                                lowestOtherSupplierSuggestedPrice: priceData?.price ?? null,
                            };
                        })
                    );

                    return {
                        ...product,
                        variants: enrichedVariants, // Overwrite with enriched variants
                    };
                })
            );

            products = enrichedProducts;
        }

        return { status: true, products: serializeBigInt(products) };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { status: false, message: "Error fetching products" };
    }
};

export const getProductsByStatus = async (
    type: "all" | "my" | "notmy",
    supplierId: number,
    status: "active" | "inactive" | "deleted" | "notDeleted"
) => {
    try {
        console.log(`type - ${type} // supplierId - ${supplierId} // status - ${status}`);
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
            products = await prisma.product.findMany({
                where: {
                    ...statusCondition,
                    OR: [
                        { isVisibleToAll: true },
                        {
                            supplierVisibility: {
                                some: {
                                    supplierId: supplierId,
                                    deletedAt: null,
                                },
                            },
                        },
                    ],
                },
                include: {
                    variants: true,
                    supplierVisibility: true,
                },
            });
        } else if (type === "my") {
            products = await prisma.supplierProduct.findMany({
                where: { ...statusCondition, supplierId },
                include: {
                    product: true,
                    supplier: true,
                    variants: {
                        include: {
                            variant: true
                        }
                    },
                },
                orderBy: { id: "desc" },
            });
        } else if (type === "notmy") {
            const myProductIds = await prisma.supplierProduct.findMany({
                where: { supplierId },
                include: {
                    variants: true,
                }
            }).then(data => data.map(d => d.productId));

            const notMyProducts = await prisma.product.findMany({
                where: {
                    ...statusCondition,
                    id: { notIn: myProductIds.length ? myProductIds : [0] },
                    OR: [
                        { isVisibleToAll: true },
                        {
                            supplierVisibility: {
                                some: {
                                    supplierId: supplierId,
                                    deletedAt: null, // exclude soft-deleted visibility entries
                                },
                            },
                        },
                    ],
                },
                include: {
                    variants: true,
                    supplierVisibility: true,
                },
            });

            console.dir(notMyProducts, { depth: null, colors: true });

            // Attach each variant's lowest suggested_price from other suppliers
            const enrichedProducts = await Promise.all(
                notMyProducts.map(async (product) => {
                    const enrichedVariants = await Promise.all(
                        product.variants.map(async (variant) => {
                            const priceData = await prisma.supplierProductVariant.findFirst({
                                where: {
                                    productVariantId: variant.id,
                                    supplierProduct: {
                                        supplierId: { not: supplierId }, // Only other suppliers
                                    },
                                },
                                orderBy: { price: "asc" },
                                select: { price: true },
                            });

                            return {
                                ...variant,
                                lowestOtherSupplierSuggestedPrice: priceData?.price ?? null,
                            };
                        })
                    );

                    return {
                        ...product,
                        variants: enrichedVariants, // Overwrite with enriched variants
                    };
                })
            );

            products = enrichedProducts;
        } else {
            return { status: false, message: "Invalid type parameter", products: [] };
        }

        return { status: true, message: "Products fetched successfully", products: serializeBigInt(products) };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { status: false, message: "Error fetching products", products: [] };
    }
};

export const checkProductForSupplier = async (
    supplierId: number,
    productId: number
) => {
    try {

        const product = await prisma.product.findMany({
            where: {
                id: productId,
                OR: [
                    { isVisibleToAll: true },
                    {
                        supplierVisibility: {
                            some: {
                                supplierId: supplierId,
                                deletedAt: null, // exclude soft-deleted visibility entries
                            },
                        },
                    },
                ],
            },
            include: {
                variants: true,
                supplierVisibility: true,
            },
        });

        if (!product) {
            return {
                status: false,
                message: "Product not found",
                existsInProduct: false,
                existsInSupplierProduct: false,
            };
        }

        // 2. Check if product exists for the given supplier
        const supplierProduct = await prisma.supplierProduct.findFirst({
            where: {
                supplierId,
                productId,
            },
        });

        if (!supplierProduct) {
            return {
                status: true,
                message: "Product exists but is not assigned to the supplier",
                existsInProduct: true,
                existsInSupplierProduct: false,
                product,
            };
        }

        return {
            status: true,
            message: "Product exists and is assigned to the supplier",
            existsInProduct: true,
            existsInSupplierProduct: true,
            product,
            supplierProduct
        };
    } catch (error) {
        console.error("Error checking product for supplier:", error);
        return {
            status: false,
            message: "Internal server error",
            existsInProduct: false,
            existsInSupplierProduct: false,
        };
    }
};

export const checkSupplierProductForSupplier = async (
    supplierId: number,
    supplierProductId: number
) => {
    try {
        // Check if the supplier product exists for the given supplier
        const supplierProduct = await prisma.supplierProduct.findFirst({
            where: {
                id: supplierProductId,
                supplierId,
            },
            include: {
                product: true,
                supplier: true,
                variants: {
                    include: {
                        variant: true
                    }
                },
            }
        });

        if (!supplierProduct) {
            return {
                status: true,
                message: "Supplier product not found or not assigned to the supplier.",
                existsInSupplierProduct: false,
                supplierProduct: null,
            };
        }

        return {
            status: true,
            message: "Supplier product exists and is assigned to the supplier.",
            existsInSupplierProduct: true,
            supplierProduct: serializeBigInt(supplierProduct),
        };
    } catch (error) {
        console.error("❌ Error checking supplier product for supplier:", error);
        return {
            status: false,
            message: "Internal server error while checking supplier product.",
            existsInSupplierProduct: false,
            supplierProduct: null,
        };
    }
};

// 🟢 RESTORE (Restores a soft-deleted product and its variants by setting deletedAt to null)
export const restoreSupplierProduct = async (
    supplierId: number,
    supplierRole: string,
    id: number
) => {
    try {
        const updatedAt = new Date();

        // Step 1: Restore the supplier product
        const restoredSupplierProduct = await prisma.supplierProduct.update({
            where: { id },
            data: {
                deletedBy: null,
                deletedAt: null,
                deletedByRole: null,
                updatedBy: supplierId,
                updatedByRole: supplierRole,
                updatedAt,
            },
        });

        // Step 2: Restore all associated supplierProductVariants
        await prisma.supplierProductVariant.updateMany({
            where: { supplierProductId: id },
            data: {
                deletedBy: null,
                deletedAt: null,
                deletedByRole: null,
                updatedBy: supplierId,
                updatedByRole: supplierRole,
                updatedAt,
            },
        });

        return {
            status: true,
            message: "Supplier product and variants restored successfully.",
            restoredSupplierProduct: serializeBigInt(restoredSupplierProduct),
        };
    } catch (error) {
        console.error("❌ restoreSupplierProduct Error:", error);
        return { status: false, message: "Error restoring supplier product." };
    }
};

export const softDeleteSupplierProduct = async (
    supplierId: number,
    supplierRole: string,
    id: number
) => {
    try {
        const deletedAt = new Date();

        // Step 1: Soft delete supplierProduct
        const updatedSupplierProduct = await prisma.supplierProduct.update({
            where: { id },
            data: {
                deletedBy: supplierId,
                deletedByRole: supplierRole,
                deletedAt,
            },
        });

        // Step 2: Soft delete all related supplierProductVariants
        await prisma.supplierProductVariant.updateMany({
            where: { supplierProductId: id },
            data: {
                deletedBy: supplierId,
                deletedByRole: supplierRole,
                deletedAt,
            },
        });

        return {
            status: true,
            message: "Supplier product and its variants soft deleted successfully.",
            updatedSupplierProduct,
        };
    } catch (error) {
        console.error("❌ softDeleteSupplierProduct Error:", error);
        return { status: false, message: "Error soft deleting supplier product." };
    }
};

// 🔴 DELETE
export const deleteSupplierProduct = async (id: number) => {
    try {
        await prisma.supplierProduct.delete({ where: { id } });
        return { status: true, message: "Supplier Product deleted successfully" };
    } catch (error) {
        console.error("❌ deleteProduct Error:", error);
        return { status: false, message: "Error deleting supplier product" };
    }
};

export const getSupplierProductById = async (id: number) => {
    try {
        const supplierProduct = await prisma.supplierProduct.findFirst({
            where: {
                id,
            },
            select: {
                id: true,
            },
        });

        if (!supplierProduct) {
            return {
                status: false,
                message: "Supplier product not found.",
                product: null,
            };
        }

        return {
            status: true,
            message: "Supplier product ID fetched successfully.",
            supplierProduct: serializeBigInt(supplierProduct),
        };
    } catch (error) {
        console.error("❌ Error in getSupplierProductById:", error);
        return {
            status: false,
            message: "Internal server error.",
            product: null,
        };
    }
};

export const getSupplierProductVariantById = async (id: number) => {
    try {
        const supplierProductVariant = await prisma.supplierProductVariant.findFirst({
            where: {
                id,
            },
            select: {
                id: true,
            },
        });

        if (!supplierProductVariant) {
            return {
                status: false,
                message: "Supplier product variant not found.",
                supplierProductVariant: null,
            };
        }

        return {
            status: true,
            message: "Supplier product variant ID fetched successfully.",
            supplierProductVariant: serializeBigInt(supplierProductVariant),
        };
    } catch (error) {
        console.error("❌ Error in getSupplierProductVariantById:", error);
        return {
            status: false,
            message: "Internal server error.",
            product: null,
        };
    }
};

