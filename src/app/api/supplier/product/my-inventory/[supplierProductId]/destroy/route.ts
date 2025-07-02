import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkSupplierProductForSupplier, deleteSupplierProduct } from '@/app/models/supplier/product';
import { getGlobalPermissionsByFilter } from '@/app/models/admin/globalPermission';

export async function DELETE(req: NextRequest) {
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

    const globalOptions = {
      panel: 'Supplier',
      module: 'Product',
      action: 'Delete',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const productResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    // Permanent delete operation
    const result = await deleteSupplierProduct(supplierProductId);  // Assuming deleteProduct is for permanent deletion
    logMessage('info', `Permanent delete request for product: ${supplierProductId}`, { supplierId });


    if (result?.status) {
      logMessage('info', `Product permanently deleted successfully: ${supplierProductId}`, { supplierId });
      return NextResponse.json({ status: true, message: `Product permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${supplierProductId}`, { supplierId });
    return NextResponse.json({ status: false, message: 'Product not found or deletion failed' }, { status: 404 });

  } catch (error) {
    logMessage('error', '❌ Product restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
