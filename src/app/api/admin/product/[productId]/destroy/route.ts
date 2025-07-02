import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductById, deleteProduct } from '@/app/models/admin/product/product';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const productId = parts[parts.length - 2]; // Get the second-to-last segment

    logMessage('debug', 'Delete Product Request:', { productId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'Permanent Delete',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }
    // Validate product ID
    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID format', { productId });
      return NextResponse.json({ error: 'Product ID is invalid' }, { status: 400 });
    }

    const productResult = await getProductById(productIdNum);
    if (!productResult?.status) {
      logMessage('warn', 'Product not found', { productIdNum });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    // Permanent delete operation
    const result = await deleteProduct(productIdNum);  // Assuming deleteProduct is for permanent deletion
    logMessage('info', `Permanent delete request for product: ${productIdNum}`, { adminId });


    if (result?.status) {
      logMessage('info', `Product permanently deleted successfully: ${productIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Product permanently deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${productIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Product not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during product deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

