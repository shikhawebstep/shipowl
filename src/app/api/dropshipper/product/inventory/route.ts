import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import {
  deleteDropshipperProduct,
  getProductsByFiltersAndStatus,
  getProductsByStatus,
} from '@/app/models/dropshipper/product';
import { getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';
import { getAppConfig } from '@/app/models/app/appConfig';

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
    const urlParams = req.nextUrl.searchParams;
    const categoryId = urlParams.get('category');
    const brandId = urlParams.get('brand');

    const rawStatus = (urlParams.get('status') ?? '').trim().toLowerCase();
    const rawType = (urlParams.get('type') ?? '').trim().toLowerCase();

    type ProductStatus = 'active' | 'inactive' | 'deleted' | 'notDeleted';
    type ProductType = 'all' | 'my' | 'notmy';

    const statusMap: Record<string, ProductStatus> = {
      active: 'active',
      inactive: 'inactive',
      deleted: 'deleted',
      notdeleted: 'notDeleted',
    };

    const validTypes: ProductType[] = ['all', 'my', 'notmy'];
    const status: ProductStatus = statusMap[rawStatus] ?? 'notDeleted';
    const type: ProductType = validTypes.includes(rawType as ProductType) ? (rawType as ProductType) : 'all';

    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json({ status: false, error: 'Invalid or missing dropshipper ID' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const apiVersion = process.env.SHOPIFY_API_VERSION?.trim();
    if (!apiVersion) {
      return NextResponse.json({
        error: 'Missing or empty required environment variables.',
        missing: ['SHOPIFY_API_VERSION'],
      }, { status: 400 });
    }

    let mainDropshipperId = dropshipperId;
    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));
    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const filters: Record<string, number> = {};
    if (categoryId) filters.categoryId = Number(categoryId);
    if (brandId) filters.brandId = Number(brandId);

    const productsResult = (categoryId || brandId)
      ? await getProductsByFiltersAndStatus(type, filters, mainDropshipperId, status)
      : await getProductsByStatus(type, mainDropshipperId, status);

    const originalProducts = productsResult.products ?? [];
    logMessage(`log`, `productsResult.products - `, productsResult.products);

    const deletedProductIds: number[] = [];

    if (type === 'my' && originalProducts.length) {
      for (const product of originalProducts) {
        if (
          !('shopifyProductId' in product) ||
          !('shopifyStore' in product) ||
          !product.shopifyStore?.shop ||
          !product.shopifyStore?.accessToken
        ) {
          continue;
        }

        const shop = product.shopifyStore.shop;
        const token = product.shopifyStore.accessToken;
        const productIdPath = product.shopifyProductId?.split('/').pop();

        if (!shop || !token || !productIdPath || !/^\d+$/.test(productIdPath)) continue;

        const productId = productIdPath;

        try {
          await axios.get(
            `https://${shop}/admin/api/${apiVersion}/products/${productId}.json`,
            {
              headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const errorMsg = typeof error.response?.data?.errors === 'string'
              ? error.response.data.errors
              : JSON.stringify(error.response?.data?.errors || error.message);

            if (errorMsg.toLowerCase() === 'not found') {
              const deleteResult = await deleteDropshipperProduct(product.id);
              if (deleteResult?.status) {
                logMessage('info', `Deleted Shopify product & removed from system: ${product.id}`, { mainDropshipperId });
                deletedProductIds.push(product.id);
              }
            }
          } else {
            logMessage('error', `Unexpected error syncing Shopify product [${productId}]`, { error });
          }
        }
      }
    }

    const finalProducts =
      deletedProductIds.length > 0
        ? originalProducts.filter(p => typeof p.id === 'number' && !deletedProductIds.includes(p.id))
        : originalProducts;

    const shopifyAppsResult = await getShopifyStoresByDropshipperId(mainDropshipperId);
    const appConfigResult = await getAppConfig();

    const shippingCost = appConfigResult?.appConfig?.shippingCost ?? 0;

    return NextResponse.json({
      status: true,
      products: finalProducts,
      shopifyStores: shopifyAppsResult?.shopifyStores ?? [],
      type,
      shippingCost,
    }, { status: 200 });

  } catch (error: any) {
    logMessage('error', 'Error while fetching products', { error: error?.message || error });
    return NextResponse.json({
      status: false,
      error: 'Failed to fetch products due to an internal error',
    }, { status: 500 });
  }
}
