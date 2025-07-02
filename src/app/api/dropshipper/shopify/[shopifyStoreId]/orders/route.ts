import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getShopifyStoreByIdForDropshipper, getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';
import { fetchShopifyStoreOrders } from '@/utils/order/fetchShopifyStoreOrders';

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface SupplierStaff {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    admin?: MainAdmin;
}

interface UserCheckResult {
    status: boolean;
    message?: string;
    admin?: SupplierStaff;
}

export async function GET(req: NextRequest) {
    try {
        const parts = req.nextUrl.pathname.split('/');
        const shopifyStoreId = Number(parts.at(-2)); // Second last segment

        if (isNaN(shopifyStoreId)) {
            logMessage('warn', 'Invalid Shopify store ID format', { shopifyStoreId });
            return NextResponse.json({ status: false, error: 'Invalid Shopify store ID' }, { status: 400 });
        }

        const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
        const dropshipperRole = req.headers.get('x-dropshipper-role');

        const dropshipperId = Number(dropshipperIdHeader);
        if (!dropshipperId || isNaN(dropshipperId)) {
            return NextResponse.json({ status: false, error: 'Missing or invalid dropshipper ID' }, { status: 400 });
        }

        logMessage('info', 'Dropshipper headers received', { dropshipperId, dropshipperRole });

        // User validation
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json({ status: false, error: `User not found: ${userCheck.message}` }, { status: 404 });
        }

        // Handle staff case (non-admin/dropshipper/supplier)
        const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));
        const mainDropshipperId = isStaffUser ? userCheck.admin?.admin?.id ?? dropshipperId : dropshipperId;

        // Get Shopify store details
        const storeResult = await getShopifyStoreByIdForDropshipper(shopifyStoreId, mainDropshipperId);
        if (!storeResult.status || !storeResult.shopifyStore) {
            return NextResponse.json(
                { status: false, message: storeResult.message },
                { status: 400 }
            );
        }

        const shopifyStore = storeResult.shopifyStore;
        if (!shopifyStore.shop || !shopifyStore.accessToken) {
            return NextResponse.json(
                { status: false, error: 'Missing shop or access token in Shopify store data' },
                { status: 400 }
            );
        }

        // Fetch orders from Shopify
        const ordersResult = await fetchShopifyStoreOrders(shopifyStore.shop, shopifyStore.accessToken);
        if (!ordersResult.status) {
            return NextResponse.json({ status: false, error: ordersResult.message }, { status: 400 });
        }

        // Fetch all stores under the dropshipper
        const storesResult = await getShopifyStoresByDropshipperId(mainDropshipperId);
        if (!storesResult.status) {
            return NextResponse.json(
                { status: false, error: 'Unable to retrieve Shopify stores for this dropshipper' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                status: true,
                fetchedOrders: ordersResult.orders || [], // Optional: attach orders
            },
            { status: 200 }
        );

    } catch (error) {
        logMessage('error', 'Error while fetching products', { error });
        return NextResponse.json(
            { status: false, error: 'Failed to fetch products due to an internal error' },
            { status: 500 }
        );
    }
}
