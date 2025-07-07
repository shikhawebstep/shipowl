import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from '@/utils/commonUtils';
import { getProductDescriptionById } from '@/app/models/admin/product/product';

/**
 * GET /api/product/[id]/description
 * Fetches the product description by product ID.
 */
export async function GET(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const productId = parts[parts.length - 2]; // Assumes URL like /product/123/description

    logMessage('debug', 'Fetch Product Description Request', { productId });

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID', { productId });
      return NextResponse.json({ status: false, message: 'Invalid product ID' }, { status: 400 });
    }

    const descriptionResult = await getProductDescriptionById(productIdNum);

    if (!descriptionResult?.status) {
      logMessage('warn', 'Product description not found', { productIdNum });
      return NextResponse.json({ status: false, message: 'Product description not found' }, { status: 404 });
    }

    logMessage('info', 'Product description fetched successfully', { productIdNum });
    return NextResponse.json({
      status: true,
      message: 'Product description retrieved successfully',
      product: descriptionResult.product,
    });

  } catch (error) {
    logMessage('error', 'Error fetching product description', error);
    return NextResponse.json({
      status: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
