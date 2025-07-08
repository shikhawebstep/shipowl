import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import {
    getShopifyStoreById,
    assignStoreToDropshipper
} from '@/app/models/dropshipper/shopify';

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

export async function POST(req: NextRequest) {
    try {
        const pathParts = req.nextUrl.pathname.split('/');
        const storeId = Number(pathParts.at(-2)); // e.g., /api/shopify/store/{storeId}/assign

        if (isNaN(storeId)) {
            logMessage('warn', 'Invalid Shopify store ID format', { storeId });
            return NextResponse.json({ status: false, error: 'Invalid Shopify store ID' }, { status: 400 });
        }

        const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
        const dropshipperRole = req.headers.get('x-dropshipper-role');

        const dropshipperId = Number(dropshipperIdHeader);
        if (!dropshipperId || isNaN(dropshipperId)) {
            return NextResponse.json({ status: false, error: 'Missing or invalid dropshipper ID' }, { status: 400 });
        }

        logMessage('info', 'Received dropshipper details', { dropshipperId, dropshipperRole });

        // ✅ Validate user (admin or staff)
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json({ status: false, error: `User not found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));
        const effectiveDropshipperId = isStaff
            ? userCheck.admin?.admin?.id ?? dropshipperId
            : dropshipperId;

        // ✅ Get Shopify store details
        const storeResult = await getShopifyStoreById(storeId);
        if (!storeResult.status || !storeResult.shopifyStore) {
            return NextResponse.json(
                { status: false, message: storeResult.message || 'Shopify store not found.' },
                { status: 404 }
            );
        }

        const shopifyStore = storeResult.shopifyStore;

        if (shopifyStore.adminId) {
            return NextResponse.json(
                { status: false, message: 'This store is already assigned to another dropshipper.' },
                { status: 409 }
            );
        }

        // ✅ Assign store to dropshipper
        const assignResult = await assignStoreToDropshipper(storeId, effectiveDropshipperId);
        if (!assignResult.status) {
            return NextResponse.json(
                { status: false, message: assignResult.message || 'Failed to assign store.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                status: true,
                message: 'Shopify store successfully assigned to dropshipper.',
                shopifyStore: assignResult.shopifyStore
            },
            { status: 200 }
        );

    } catch (error) {
        logMessage('error', 'Unexpected error while assigning Shopify store', { error });
        return NextResponse.json(
            { status: false, error: 'Internal server error while assigning Shopify store.' },
            { status: 500 }
        );
    }
}
