import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductsByFiltersAndStatus, getProductsByStatus } from '@/app/models/dropshipper/product';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface DropshipperStaff {
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
  admin?: DropshipperStaff;
}

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

    const status: ProductStatus = statusMap[rawStatus] ?? 'notDeleted';
    const type: ProductType = validTypes.includes(rawType as ProductType) ? (rawType as ProductType) : 'all';

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

    const filters: Record<string, number> = {};
    if (categoryId) filters.categoryId = Number(categoryId);
    if (brandId) filters.brandId = Number(brandId);

    const productsResult = (categoryId || brandId)
      ? await getProductsByFiltersAndStatus(type, filters, mainDropshipperId, status)
      : await getProductsByStatus(type, mainDropshipperId, status);

    if (productsResult?.status) {
      return NextResponse.json(
        { status: true, products: productsResult.products },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No products found' },
      { status: 404 }
    );

  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch products due to an internal error' },
      { status: 500 }
    );
  }
}