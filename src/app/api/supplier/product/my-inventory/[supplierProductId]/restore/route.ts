import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkSupplierProductForSupplier, restoreSupplierProduct } from '@/app/models/supplier/product';

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierProductId = Number(parts[parts.length - 2]);
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

    const productResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    // Restore the product (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreSupplierProduct(supplierId, String(supplierRole), supplierProductId);

    if (restoreResult?.status) {
      logMessage('info', 'Product restored successfully:', restoreResult.restoredSupplierProduct);
      return NextResponse.json({ status: true, product: restoreResult.restoredSupplierProduct }, { status: 200 });
    }

    logMessage('error', 'Product restore failed');
    return NextResponse.json({ status: false, error: 'Product restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Product restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
