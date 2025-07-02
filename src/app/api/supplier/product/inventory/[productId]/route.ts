import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductById } from '@/app/models/admin/product/product';

export async function GET(req: NextRequest) {
  try {
    const productId = Number(req.nextUrl.pathname.split('/').pop());

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID', { productId });
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

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

    const productResult = await getProductById(productIdNum);
    if (productResult?.status) {
      logMessage('info', 'Product found:', productResult.product);
      return NextResponse.json({ status: true, product: productResult.product }, { status: 200 });
    }

    logMessage('info', 'Product found:', productResult.product);
    return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });

  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch products due to an internal error' },
      { status: 500 }
    );
  }
}