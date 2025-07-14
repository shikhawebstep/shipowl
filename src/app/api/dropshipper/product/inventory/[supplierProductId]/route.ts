import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkSupplierProductForDropshipper } from '@/app/models/dropshipper/product';
import { getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';
import { getAppConfig } from '@/app/models/app/appConfig';

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
  role?: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: SupplierStaff;
}

export async function GET(req: NextRequest) {
  try {
    // Extract productId directly from the URL path
    const supplierProductId = Number(req.nextUrl.pathname.split('/').pop());

    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Supplier details received', { dropshipperId, dropshipperRole });

    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing supplier ID' },
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

    const productResult = await checkSupplierProductForDropshipper(mainDropshipperId, supplierProductId);
    console.log(`productResult - `, productResult);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 400 });
    }

    const shopifyAppsResult = await getShopifyStoresByDropshipperId(mainDropshipperId);

    const appConfigResult = await getAppConfig();
    const appConfig = appConfigResult.appConfig;
    const shippingCost = appConfig ? appConfig.shippingCost || 0 : 0;


    logMessage('info', 'Product found:', productResult.supplierProduct);
    return NextResponse.json({ status: true, message: 'Product found', supplierProduct: productResult.supplierProduct, otherSuppliers: productResult.otherSuppliers, shopifyStores: shopifyAppsResult?.shopifyStores || [], type: 'notmy', shippingCost }, { status: 200 });
  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch products due to an internal error' },
      { status: 500 }
    );
  }
}
