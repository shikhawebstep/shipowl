import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role: string;
    // other optional properties if needed
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
        const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
        const dropshipperRole = req.headers.get('x-dropshipper-role');

        logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

        if (!dropshipperId || isNaN(dropshipperId)) {
            return NextResponse.json(
                { status: false, error: 'Invalid or missing dropshipper ID' },
                { status: 400 }
            );
        }

        let mainDropshipperId = dropshipperId;
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json(
                { status: false, error: `User Not Found: ${userCheck.message}` },
                { status: 404 }
            );
        }

        const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

        if (isStaffUser) {
            mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
        }

        const shopifyAppsResult = await getShopifyStoresByDropshipperId(mainDropshipperId);

        return NextResponse.json(
            { status: true, shopifyStores: shopifyAppsResult?.shopifyStores || [] },
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
