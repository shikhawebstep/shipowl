import prisma from "@/lib/prisma";

interface ShopifyStore {
    // === Primary Keys and Relations ===
    admin: {
        connect: { id: number };
    };
    id?: bigint; // Optional: ID of the dropshipperShopifyStore (if exists)
    createdBy?: number;
    createdByRole?: string | null;
    updatedBy?: number;
    updatedByRole?: string | null;
    deletedBy?: number;
    deletedByRole?: string | null;

    // === Shopify Store Identifiers ===
    shop: string;
    accessToken?: string;

    // === Store Metadata ===
    email?: string;
    logo?: string,
    name?: string;              // corresponds to shopName in Prisma
    planName?: string;
    countryName?: string;       // corresponds to country in Prisma
    shopOwner?: string;
    domain?: string;
    myshopifyDomain?: string;   // corresponds to myshopifyDomain in Prisma
    province?: string;
    city?: string;
    phone?: string;
    currency?: string;
    moneyFormat?: string;
    ianaTimezone?: string;      // corresponds to timezone in Prisma
    shopCreatedAt?: string;     // corresponds to createdAtShop in Prisma

    // === Status Flags ===
    verificationStatus?: boolean;
    status?: boolean;

    // === Timestamps ===
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
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

export async function isShopUsedAndVerified(shop: string) {
    try {
        // Find the shop regardless of verification status
        const existingStore = await prisma.shopifyStore.findFirst({
            where: {
                shop: shop
            },
            include: {
                admin: true
            }
        });

        if (existingStore) {
            return {
                status: true,                        // shop exists
                verified: !!existingStore.verificationStatus,  // true if verified, else false
                shopifyStore: existingStore,
                message: existingStore.verificationStatus
                    ? 'Shop is used and verified.'
                    : 'Shop is used but not verified.'
            };
        } else {
            return {
                status: false,
                verified: false,
                shopifyStore: null,
                message: 'Shop not found.'
            };
        }

    } catch (error) {
        console.error(`Error checking if shop is used and verified:`, error);
        return {
            status: false,
            verified: false,
            shopifyStore: null,
            message: 'An error occurred while checking the shop.'
        };
    }
}

export async function createDropshipperShopifyStore(dropshipperId: number, dropshipperRole: string, dropshipperShopifyStore: ShopifyStore) {
    try {
        const { admin, shop, createdAt, createdBy, createdByRole } = dropshipperShopifyStore;

        // 🚫 Check if the shop is already used and verified
        const isAlreadyUsed = await isShopUsedAndVerified(shop);
        if (isAlreadyUsed.status) {
            if (isAlreadyUsed.shopifyStore?.adminId !== admin.connect.id) {
                return { status: true, message: "This Shopify store is already registered and verified." };
            } else {
                if (isAlreadyUsed.verified) {
                    return { status: false, message: "This Shopify store is already registered and verified." };
                } else {
                    await deleteShopIfNotVerified(shop);
                }
            }
        }

        const statusRaw = false;
        const verificationStatusRaw = false;

        // Convert statusRaw to a boolean using the includes check
        const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
        const verificationStatus = ['true', '1', true, 1, 'active', 'yes'].includes(verificationStatusRaw as string | number | boolean);

        const newShopifyStore = await prisma.shopifyStore.create({
            data: {
                admin,
                shop,
                status,
                verificationStatus,
                createdAt,
                createdBy,
                createdByRole
            },
        });

        return { status: true, dropshipperShopifyStore: serializeBigInt(newShopifyStore) };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function verifyDropshipperShopifyStore(dropshipperId: number, dropshipperRole: string, dropshipperShopifyStore: ShopifyStore) {
    try {
        const {
            shop,
            accessToken,
            email,
            shopOwner,
            name,
            domain,
            myshopifyDomain,
            planName,
            countryName,
            province,
            city,
            phone,
            currency,
            moneyFormat,
            ianaTimezone,
            shopCreatedAt,
        } = dropshipperShopifyStore;

        const existing = await isShopUsedAndVerified(shop);

        // 🚫 Stop if already verified
        if (existing.status && existing.shopifyStore && existing.verified) {
            return { status: true, message: "Shop already verified and connected." };
        }

        if (!existing.shopifyStore) {
            return { status: false, message: "Shopify store not found." };
        }

        // ✅ Update the accessToken and mark verified
        await prisma.shopifyStore.update({
            where: { id: Number(existing.shopifyStore.id) },
            data: {
                accessToken,
                verificationStatus: true,
                email,
                shopOwner,
                name,
                domain,
                myshopifyDomain,
                planName,
                country: countryName,
                province,
                city,
                phone,
                currency,
                moneyFormat,
                timezone: ianaTimezone,
                createdAtShop: shopCreatedAt
            }
        });

        return { status: true };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function getShopifyStoreById(storeId: number) {
    try {
        const store = await prisma.shopifyStore.findUnique({
            where: { id: storeId },
            include: { admin: true }
        });

        if (!store) {
            return {
                status: false,
                message: 'Shopify store not found.',
                shopifyStore: null
            };
        }

        return {
            status: true,
            message: 'Shopify store found.',
            shopifyStore: serializeBigInt(store)
        };
    } catch (error) {
        console.error(`Error fetching Shopify store by ID:`, error);
        return {
            status: false,
            message: 'Internal Server Error',
            shopifyStore: null
        };
    }
}

export async function getShopifyStoreByStore(shop: string) {
    try {
        const store = await prisma.shopifyStore.findUnique({
            where: { shop },
            include: { admin: true }
        });

        if (!store) {
            return {
                status: false,
                message: 'Shopify store not found.',
                shopifyStore: null
            };
        }

        return {
            status: true,
            message: 'Shopify store found.',
            shopifyStore: serializeBigInt(store)
        };
    } catch (error) {
        console.error(`Error fetching Shopify store by ID:`, error);
        return {
            status: false,
            message: 'Internal Server Error',
            shopifyStore: null
        };
    }
}

export async function updateDropshipperShopifyStore(dropshipperId: number, dropshipperRole: string, shopifyStoreId: number, dropshipperShopifyStore: {
    name: string;
    logo: string;
    updatedBy?: number | null;
    updatedAt?: Date;
    updatedByRole?: string | null;
}) {
    try {
        const {
            name,
            logo
        } = dropshipperShopifyStore;

        const shopifyStoreResult = await getShopifyStoreByIdForDropshipper(shopifyStoreId, dropshipperId);
        if (!shopifyStoreResult?.status || !shopifyStoreResult.shopifyStore) {
            return {
                status: false,
                message: shopifyStoreResult.message
            };
        }

        // ✅ Update the accessToken and mark verified
        const shopifyStore = await prisma.shopifyStore.update({
            where: { id: Number(shopifyStoreResult.shopifyStore.id) },
            data: {
                name,
                logo
            }
        });

        return { status: true, message: 'updated', shopifyStore };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function deleteShopIfNotVerified(shop: string) {
    try {
        // Find the shop record regardless of verification status
        const existingStore = await prisma.shopifyStore.findFirst({
            where: { shop: shop }
        });

        if (!existingStore) {
            return {
                status: false,
                message: 'Shop not found.'
            };
        }

        // Check verification status
        if (existingStore.verificationStatus) {
            return {
                status: false,
                message: 'Shop is verified and will not be deleted.'
            };
        }

        // Delete the shop because it is not verified
        await prisma.shopifyStore.delete({
            where: { id: existingStore.id }
        });

        return {
            status: true,
            message: 'Shop was found but not verified, so it was deleted.'
        };
    } catch (error) {
        console.error(`Error deleting shop if not verified:`, error);
        return {
            status: false,
            message: 'An error occurred while trying to delete the shop.'
        };
    }
}

export async function getShopifyStoresByDropshipperId(dropshipperId: number, status: string = 'verified') {
    try {
        let whereCondition = {};

        switch (status) {
            case "verified":
                whereCondition = { verificationStatus: true };
                break;
            case "unverified":
                whereCondition = { verificationStatus: false };
                break;
            case "all":
                break;
            default:
                break;
        }

        const stores = await prisma.shopifyStore.findMany({
            where: whereCondition,
            include: {
                admin: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!stores || stores.length === 0) {
            return {
                status: false,
                message: 'No Shopify stores found for this dropshipper.',
                shopifyStores: []
            };
        }

        return {
            status: true,
            shopifyStores: serializeBigInt(stores),
            message: `${stores.length} store(s) found for this dropshipper.`
        };

    } catch (error) {
        console.error('Error fetching Shopify stores by dropshipperId:', error);
        return {
            status: false,
            shopifyStores: [],
            message: 'Internal Server Error'
        };
    }
}

export async function getShopifyStoreByIdForDropshipper(storeId: number, dropshipperId: number) {
    try {
        console.log(`storeId - `, storeId);
        console.log(`dropshipperId - `, dropshipperId);

        // First, check if the store exists
        const store = await prisma.shopifyStore.findUnique({
            where: { id: storeId },
            include: { admin: true }
        });

        if (!store) {
            return {
                status: false,
                message: 'Shopify store not found.',
                shopifyStore: null
            };
        }

        // Check if the store belongs to the given dropshipper
        if (store.adminId !== dropshipperId) {
            return {
                status: false,
                message: 'This Shopify store is linked to another user.',
                shopifyStore: null
            };
        }

        return {
            status: true,
            shopifyStore: serializeBigInt(store),
            message: 'Shopify store found.'
        };

    } catch (error) {
        console.error(`Error fetching Shopify store by ID:`, error);
        return {
            status: false,
            shopifyStore: null,
            message: 'Internal Server Error'
        };
    }
}

export async function deleteShopifyStoreById(storeId: number) {
    try {
        console.log(`storeId -`, storeId);

        // Check if the store exists
        const shopifyStoreResult = await getShopifyStoreById(storeId);

        if (!shopifyStoreResult.status || !shopifyStoreResult.shopifyStore) {
            return {
                status: false,
                message: shopifyStoreResult.message || 'Shopify store not found.',
                shopifyStore: null
            };
        }

        // Delete the Shopify store
        await prisma.shopifyStore.delete({
            where: { id: storeId }
        });

        return {
            status: true,
            message: 'Shopify store deleted.',
            shopifyStore: shopifyStoreResult.shopifyStore
        };

    } catch (error) {
        console.error(`Error deleting Shopify store by ID:`, error);
        return {
            status: false,
            shopifyStore: null,
            message: 'Internal Server Error'
        };
    }
}

