import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getProductsByStatus } from '@/app/models/supplier/product';

export async function GET(req: NextRequest) {
  try {
    const supplierIdHeader = req.headers.get('x-supplier-id');
    const supplierRole = req.headers.get('x-supplier-role');

    const supplierId = Number(supplierIdHeader);

    logMessage('info', 'Supplier details received', { supplierId, supplierRole });

    // Validate supplierId
    if (!supplierIdHeader || isNaN(supplierId)) {
      return NextResponse.json(
        { status: false, message: 'Invalid or missing supplier ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExistence = await isUserExist(supplierId, String(supplierRole));
    if (!userExistence.status) {
      return NextResponse.json(
        { status: false, message: `User not found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    // Fetch deleted products for this supplier
    const productsResult = await getProductsByStatus('my', supplierId, 'deleted');

    if (productsResult?.status) {
      return NextResponse.json(
        { status: true, message: 'Products fetched successfully', products: productsResult.products },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, message: 'No products found' },
      { status: 404 }
    );

  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, message: 'Internal server error while fetching products' },
      { status: 500 }
    );
  }
}
