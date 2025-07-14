import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { deleteShopifyStoreById, getShopifyStoreByIdForDropshipper, updateDropshipperShopifyStore } from '@/app/models/dropshipper/shopify';
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

export async function PUT(req: NextRequest) {
    try {
        const shopifyStoreId = req.nextUrl.pathname.split('/').pop();
        logMessage('debug', 'Requested ShopifyStore ID:', shopifyStoreId);

        const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
        const dropshipperRole = req.headers.get("x-dropshipper-role");

        const dropshipperId = Number(dropshipperIdHeader);
        if (!dropshipperIdHeader || isNaN(dropshipperId)) {
            return NextResponse.json({ error: "User ID is missing or invalid" }, { status: 400 });
        }

        // Validate user
        let mainDropshipperId = dropshipperId;
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));
        if (isStaff) {
            mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;

            const permissionCheck = await checkStaffPermissionStatus({
                panel: 'Dropshipper',
                module: 'Shopify',
                action: 'Update',
            }, dropshipperId);

            if (!permissionCheck.status) {
                return NextResponse.json(
                    { status: false, message: permissionCheck.message || "Permission denied." },
                    { status: 403 }
                );
            }
        }

        const shopifyStoreIdNum = Number(shopifyStoreId);
        if (isNaN(shopifyStoreIdNum)) {
            return NextResponse.json({ error: 'Invalid ShopifyStore ID' }, { status: 400 });
        }

        const shopifyStoreResult = await getShopifyStoreByIdForDropshipper(shopifyStoreIdNum, mainDropshipperId);
        if (!shopifyStoreResult?.status || !shopifyStoreResult.shopifyStore) {
            return NextResponse.json({ status: false, message: 'ShopifyStore not found' }, { status: 404 });
        }

        const shopifyStore = shopifyStoreResult.shopifyStore;

        const formData = await req.formData();
        const validation = validateFormData(formData, {
            requiredFields: ['name'],
            patternValidations: { name: 'string' },
        });

        if (!validation.isValid) {
            return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
        }

        const name = formData.get('name') as string;
        const isMultipleImages = false;

        const uploadDir = path.join(
            process.cwd(),
            'tmp', 'uploads', 'dropshipper', `${userCheck.admin?.id ?? dropshipperId}`, 'shopify-store', 'logo'
        );

        // Delete old logo if exists
        if (shopifyStore?.logo) {
            const oldLogoPath = path.join(uploadDir, path.basename(shopifyStore.logo));
            await deleteFile(oldLogoPath);
        }

        const fileData = await saveFilesFromFormData(formData, 'logo', {
            dir: uploadDir,
            pattern: 'slug-unique',
            multiple: isMultipleImages,
        });

        let logo = '';
        if (fileData) {
            logo = isMultipleImages
                ? (fileData as UploadedFileInfo[]).map(file => file.url).join(', ')
                : (fileData as UploadedFileInfo).url;
        }

        const shopifyStorePayload = {
            name,
            logo,
            updatedBy: dropshipperId,
            updatedByRole: dropshipperRole,
            updatedAt: new Date(),
        };

        logMessage('info', 'ShopifyStore payload:', shopifyStorePayload);

        const updateResult = await updateDropshipperShopifyStore(
            dropshipperId,
            String(dropshipperRole),
            shopifyStoreIdNum,
            shopifyStorePayload
        );

        if (updateResult?.status) {
            return NextResponse.json(
                { status: true, shopifyStore: updateResult.shopifyStore },
                { status: 200 }
            );
        }

        // Delete newly uploaded file(s) on failure
        const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));
        if (isMultipleImages && Array.isArray(fileData)) {
            await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
        } else {
            await deleteFile(deletePath(fileData as UploadedFileInfo));
        }

        return NextResponse.json(
            { status: false, error: updateResult?.message || 'ShopifyStore update failed' },
            { status: 500 }
        );

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
        logMessage('error', 'ShopifyStore Update Error:', errorMessage);
        return NextResponse.json({ status: false, error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Extract supplierProductId directly from the URL path
        const parts = req.nextUrl.pathname.split('/');
        const shopifyStoreId = Number(parts.at(-2)); // Second last segment

        if (isNaN(shopifyStoreId)) {
            logMessage('warn', 'Invalid Shopify store ID format', { shopifyStoreId });
            return NextResponse.json({ status: false, error: 'Invalid Shopify store ID' }, { status: 400 });
        }

        const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
        const dropshipperRole = req.headers.get("x-dropshipper-role");

        const dropshipperId = Number(dropshipperIdHeader);
        if (!dropshipperIdHeader || isNaN(dropshipperId)) {
            return NextResponse.json({ error: "User ID is missing or invalid" }, { status: 400 });
        }

        // Validate user
        let mainDropshipperId = dropshipperId;
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));
        if (isStaff) {
            mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;

            const permissionCheck = await checkStaffPermissionStatus({
                panel: 'Dropshipper',
                module: 'Shopify',
                action: 'Update',
            }, dropshipperId);

            if (!permissionCheck.status) {
                return NextResponse.json(
                    { status: false, message: permissionCheck.message || "Permission denied." },
                    { status: 403 }
                );
            }
        }

        const shopifyStoreIdNum = Number(shopifyStoreId);
        if (isNaN(shopifyStoreIdNum)) {
            return NextResponse.json({ error: 'Invalid ShopifyStore ID' }, { status: 400 });
        }

        const shopifyStoreResult = await getShopifyStoreByIdForDropshipper(shopifyStoreIdNum, mainDropshipperId);
        if (!shopifyStoreResult?.status || !shopifyStoreResult.shopifyStore) {
            return NextResponse.json({ status: false, message: 'ShopifyStore not found' }, { status: 404 });
        }

        const shopifyStore = shopifyStoreResult.shopifyStore;

        const deleteShopifyStoreResult = await deleteShopifyStoreById(shopifyStoreId);

        if (!deleteShopifyStoreResult.status) {
            logMessage('error', 'Error during shopify store deletion', { message: deleteShopifyStoreResult.message });
            return NextResponse.json({ status: false, error: deleteShopifyStoreResult.message }, { status: 500 });
        }

        return NextResponse.json({ status: true, error: deleteShopifyStoreResult.message }, { status: 500 });

    } catch (error) {
        logMessage('error', 'Error during product deletion', { error });
        return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};