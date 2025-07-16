import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductById, removeProductImageByIndex } from '@/app/models/admin/product/product';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { ActivityLog } from '@/utils/commonUtils';

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const productId = Number(parts[parts.length - 3]);

    const body = await req.json();
    const indexes = body.indexes?.split(',').map((i: string) => Number(i.trim())).filter((i: number) => !isNaN(i)) || [];
    const type = body.type;

    if (!['package_weight_image', 'package_length_image', 'package_width_image', 'package_height_image', 'gallery'].includes(type)) {
      return NextResponse.json({ status: false, message: 'Invalid image type' }, { status: 400 });
    }

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(adminId)) {
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
    }

    const user = await isUserExist(adminId, String(adminRole));
    if (!user.status) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (!['admin', 'supplier', 'dropshipper'].includes(String(adminRole))) {
      const permission = await checkStaffPermissionStatus({ panel: 'Admin', module: 'Product', action: 'Update' }, adminId);
      if (!permission.status) {
        return NextResponse.json({ status: false, message: permission.message || "No permission" }, { status: 403 });
      }
    }

    const product = await getProductById(productId);
    if (!product?.status || !product.product) {
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    const deleted = [];
    const notDeleted = [];

    for (const imageIndex of indexes) {
      const result = await removeProductImageByIndex(productId, type, imageIndex);
      if (result?.status) {
        deleted.push({ index: imageIndex });
      } else {
        notDeleted.push({ index: imageIndex, reason: result?.message || 'Unknown error' });
      }
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Product',
        action: 'Update',
        data: { oneLineSimpleMessage: 'Image removal process completed' },
        response: {
          status: true,
          message: 'Image removal process completed',
          deleted,
          notDeleted
        },
        status: true
      }, req);

    return NextResponse.json({
      status: true,
      message: 'Image removal process completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Product',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Internal server error' },
        status: false
      }, req);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
