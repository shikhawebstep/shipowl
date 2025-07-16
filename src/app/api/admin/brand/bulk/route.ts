import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getBrandById, deleteBrand } from '@/app/models/admin/brand';
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
      return NextResponse.json({ status: false, message: `Admin not found` }, { status: 404 });
    }

    if (!['admin', 'supplier', 'dropshipper'].includes(String(adminRole))) {
      const permissionCheck = await checkStaffPermissionStatus(
        { panel: 'Admin', module: 'Brand', action: 'Permanent Delete' },
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

    for (const brandId of ids) {
      const brandResult = await getBrandById(brandId);
      const brandName = brandResult?.brand?.name ?? null;

      if (!brandResult?.status || !brandResult?.brand) {
        notDeleted.push({ id: brandId, name: brandName, reason: 'Brand not found' });
        continue;
      }

      const deleteResult = await deleteBrand(brandId);
      if (deleteResult?.status) {
        deleted.push({ id: brandId, name: brandName });
      } else {
        notDeleted.push({ id: brandId, name: brandName, reason: 'Deletion failed' });
      }
    }

    await ActivityLog(
      {
        module: 'Brand',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: 'Brand deletion completed' },
        response: {
          status: true,
          message: 'Brand deletion completed',
          deleted,
          notDeleted
        },
        status: true
      }, req);

    return NextResponse.json({
      status: true,
      message: 'Brand deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch (error) {
    await ActivityLog(
      {
        module: 'Brand',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Internal server error' },
        status: false
      }, req);
    return NextResponse.json({ status: false, message: error || 'Internal server error' }, { status: 500 });
  }
}
