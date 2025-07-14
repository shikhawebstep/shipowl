import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import crypto from 'crypto';
import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { deleteShopifyStoreById, getShopifyStoreByStore } from '@/app/models/dropshipper/shopify';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
    role?: string;
    admin?: MainAdmin;
}

interface UserCheckResult {
    status: boolean;
    message?: string;
    admin?: SupplierStaff;
}

type UploadedFileInfo = {
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    url: string;
};

export async function POST(req: NextRequest) {
    try {
        const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
        const rawBody = await req.text();

        if (!hmacHeader || !rawBody) {
            return NextResponse.json(
                { status: false, message: "Required Shopify signature or data not found." },
                { status: 400 }
            );
        }

        const apiSecret = process.env.NEXT_PUBLIC_SHOPIFY_API_SECRET;
        if (!apiSecret || apiSecret.trim() === '') {
            logMessage('error', 'Missing NEXT_PUBLIC_SHOPIFY_API_SECRET environment variable.');
            return NextResponse.json(
                {
                    status: false,
                    message: 'Configuration error: Missing required Shopify API secret.',
                    missing: ['NEXT_PUBLIC_SHOPIFY_API_SECRET'],
                },
                { status: 500 }
            );
        }

        // Validate webhook authenticity
        const generatedHash = crypto
            .createHmac('sha256', apiSecret)
            .update(rawBody, 'utf8')
            .digest('base64');

        if (generatedHash !== hmacHeader) {
            logMessage('warn', '❌ Webhook HMAC validation failed.');
            return NextResponse.json(
                { status: false, message: 'Unauthorized: Webhook signature does not match.' },
                { status: 401 }
            );
        }

        const body = JSON.parse(rawBody);
        const shop = req.headers.get("x-shopify-shop-domain");

        if (!shop) {
            return NextResponse.json(
                { status: false, message: "Shop domain is missing from the request." },
                { status: 400 }
            );
        }

        logMessage('info', '✅ Shopify webhook verified.', { shop, body });

        const shopifyStoreResult = await getShopifyStoreByStore(shop);

        if (!shopifyStoreResult.status || !shopifyStoreResult.shopifyStore) {
            logMessage('info', `ℹ️ No Shopify store found for domain: ${shop}`);
            return NextResponse.json(
                { status: true, message: "Shopify store not found. No action needed.", shop },
                { status: 200 }
            );
        }

        const shopifyStore = shopifyStoreResult.shopifyStore;

        const shopifyStoreDeleteResult = await deleteShopifyStoreById(shopifyStore.id);

        if (!shopifyStoreDeleteResult.status) {
            logMessage('warn', `⚠️ Failed to delete Shopify store with ID: ${shopifyStore.id}`);
            return NextResponse.json(
                {
                    status: false,
                    message: "Unable to delete the Shopify store. Please try again later.",
                    shop,
                },
                { status: 500 }
            );
        }

        logMessage('info', `✅ Shopify store deleted successfully: ${shopifyStore.id}`);

        return NextResponse.json(
            {
                status: true,
                message: "Shopify store successfully deleted.",
                shop,
            },
            { status: 200 }
        );

    } catch (error) {
        logMessage('error', '❌ Shopify webhook handling failed.', error);
        return NextResponse.json(
            {
                status: false,
                message: "An unexpected error occurred while processing the webhook.",
                error: (error as Error).message,
            },
            { status: 500 }
        );
    }
}