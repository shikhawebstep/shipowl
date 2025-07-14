import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkDropshipperProductForDropshipper, deleteDropshipperProduct } from '@/app/models/dropshipper/product';
import { getGlobalPermissionsByFilter } from '@/app/models/admin/globalPermission';

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

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const dropshipperProductId = Number(parts[parts.length - 2]);
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

    const globalOptions = {
      panel: 'Dropshipper',
      module: 'Product',
      action: 'Delete',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const productResult = await checkDropshipperProductForDropshipper(mainDropshipperId, dropshipperProductId);
    if (!productResult?.status || !productResult.existsInDropshipperProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    // Permanent delete operation
    const result = await deleteDropshipperProduct(dropshipperProductId);  // Assuming deleteProduct is for permanent deletion
    logMessage('info', `Permanent delete request for product: ${dropshipperProductId}`, { mainDropshipperId });


    if (result?.status) {
      logMessage('info', `Product permanently deleted successfully: ${dropshipperProductId}`, { mainDropshipperId });
      return NextResponse.json({ status: true, message: `Product permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${dropshipperProductId}`, { mainDropshipperId });
    return NextResponse.json({ status: false, message: 'Product not found or deletion failed' }, { status: 404 });

  } catch (error) {
    logMessage('error', '❌ Product restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
