import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getProductById, removeProductVariantImageByIndex, getProductVariantById } from '@/app/models/admin/product/product';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const productId = Number(parts[parts.length - 5]);
    const variantId = Number(parts[parts.length - 3]);
    const imageIndex = Number(parts[parts.length - 1]);

    logMessage('debug', `Attempting to delete image (${imageIndex}) from product (${productId})`);

    // Validate admin headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Missing or invalid admin ID header', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    const type = req.nextUrl.searchParams.get('type');

    logMessage('debug', `Attempting to delete image at index ${imageIndex} from product ${productId}, type: ${type}`);

    if (!type) {
      logMessage('warn', 'Missing or invalid type parameter in request', { adminId, adminRole });
      return NextResponse.json({ error: 'Type parameter is missing or invalid' }, { status: 400 });
    }

    // Authenticate admin user
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', 'Admin authentication failed', { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'Update',
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

    // Validate product existence
    const productResult = await getProductById(productId);
    if (!productResult?.status) {
      logMessage('warn', 'Product not found', { productId });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    const productVariantIdResult = await getProductVariantById(variantId);
    if (!productVariantIdResult?.status) {
      logMessage('warn', 'Product Variant not found', { variantId });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    // Perform image removal
    const result = await removeProductVariantImageByIndex(variantId, imageIndex);

    if (result.status) {
      logMessage('info', `Image index ${imageIndex} removed from product variant ${productId} by admin ${adminId}`);
      return NextResponse.json({
        status: true,
        message: 'Image removed successfully',
        data: result.product,
      }, { status: 200 });
    }

    logMessage('warn', `Image removal failed: ${result.message}`, { productId, imageIndex });
    return NextResponse.json({
      status: false,
      message: result.message || 'Image removal failed',
    }, { status: 400 });

  } catch (error) {
    logMessage('error', 'Unexpected error during image deletion', { error });
    return NextResponse.json({
      status: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
