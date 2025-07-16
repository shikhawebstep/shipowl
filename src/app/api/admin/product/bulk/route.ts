import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getProductById, deleteProduct } from '@/app/models/admin/product/product';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { ActivityLog } from '@/utils/commonUtils';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = body.ids?.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id)) || [];

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(adminId)) {
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
    }

    const userCheck = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json({ error: `Admin not found` }, { status: 404 });
    }

    if (!['admin', 'supplier', 'dropshipper'].includes(String(adminRole))) {
      const permissionCheck = await checkStaffPermissionStatus(
        { panel: 'Admin', module: 'Product', action: 'Permanent Delete' },
        adminId
      );
      if (!permissionCheck.status) {
        return NextResponse.json({
          status: false,
          message: permissionCheck.message || "No permission"
        }, { status: 403 });
      }
    }

    const deleted = [];
    const notDeleted = [];

    for (const productId of ids) {
      const productResult = await getProductById(productId);
      const productName = productResult?.product?.name ?? null;

      if (!productResult?.status || !productResult?.product) {
        notDeleted.push({ id: productId, name: productName, reason: 'Product not found' });
        continue;
      }

      const deleteResult = await deleteProduct(productId);
      if (deleteResult?.status) {
        deleted.push({ id: productId, name: productName });
      } else {
        notDeleted.push({ id: productId, name: productName, reason: 'Deletion failed' });
      }
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Product',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: 'Product deletion completed' },
        response: {
          status: true,
          message: 'Product deletion completed',
          deleted,
          notDeleted
        },
        status: false
      }, req);

    return NextResponse.json({
      status: true,
      message: 'Product deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch (error) {

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Product',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
