import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductsByFiltersAndStatus, getProductsByStatus } from '@/app/models/supplier/product';

export async function GET(req: NextRequest) {
  try {
    const urlParams = req.nextUrl.searchParams;
    const categoryId = urlParams.get('category');
    const brandId = urlParams.get('brand');

    const rawStatus = (urlParams.get('status') ?? '').trim().toLowerCase();
    const rawType = (urlParams.get('type') ?? '').trim().toLowerCase();

    // Inline enum definitions
    type ProductStatus = 'active' | 'inactive' | 'deleted' | 'notDeleted';
    type ProductType = 'all' | 'my' | 'notmy';

    const statusMap: Record<string, ProductStatus> = {
      active: 'active',
      inactive: 'inactive',
      deleted: 'deleted',
      notdeleted: 'notDeleted'
    };

    const validTypes: ProductType[] = ['all', 'my', 'notmy'];

    const status: ProductStatus = statusMap[rawStatus] ?? 'active';
    const type: ProductType = validTypes.includes(rawType as ProductType) ? (rawType as ProductType) : 'all';

    const supplierId = Number(req.headers.get('x-supplier-id'));
    const supplierRole = req.headers.get('x-supplier-role');

    logMessage('info', 'Supplier details received', { supplierId, supplierRole });

    if (!supplierId || isNaN(supplierId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing supplier ID' },
        { status: 400 }
      );
    }

    const userExistence = await isUserExist(supplierId, String(supplierRole));
    if (!userExistence.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    const filters: Record<string, number> = {};
    if (categoryId) filters.categoryId = Number(categoryId);
    if (brandId) filters.brandId = Number(brandId);

    const productsResult = (categoryId || brandId)
      ? await getProductsByFiltersAndStatus(type, filters, supplierId, status)
      : await getProductsByStatus(type, supplierId, status);

    return NextResponse.json(
      { status: true, products: productsResult?.products, type },
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