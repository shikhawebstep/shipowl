import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getCategoryById, deleteCategory } from '@/app/models/admin/category';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
        { panel: 'Admin', module: 'Category', action: 'Permanent Delete' },
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

    for (const categoryId of ids) {
      const categoryResult = await getCategoryById(categoryId);
      const categoryName = categoryResult?.category?.name ?? null;

      if (!categoryResult?.status || !categoryResult?.category) {
        notDeleted.push({ id: categoryId, name: categoryName, reason: 'Category not found' });
        continue;
      }

      const deleteResult = await deleteCategory(categoryId);
      if (deleteResult?.status) {
        deleted.push({ id: categoryId, name: categoryName });
      } else {
        notDeleted.push({ id: categoryId, name: categoryName, reason: 'Deletion failed' });
      }
    }

    return NextResponse.json({
      status: true,
      message: 'Category deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch {
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
