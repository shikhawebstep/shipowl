import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getCourierCompanyById, deleteCourierCompany } from '@/app/models/courierCompany';
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
        { panel: 'Admin', module: 'CourierCompany', action: 'Permanent Delete' },
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

    for (const courierCompanyId of ids) {
      const courierCompanyResult = await getCourierCompanyById(courierCompanyId);
      const courierCompanyName = courierCompanyResult?.courierCompany?.name ?? null;

      if (!courierCompanyResult?.status || !courierCompanyResult?.courierCompany) {
        notDeleted.push({ id: courierCompanyId, name: courierCompanyName, reason: 'CourierCompany not found' });
        continue;
      }

      const deleteResult = await deleteCourierCompany(courierCompanyId);
      if (deleteResult?.status) {
        deleted.push({ id: courierCompanyId, name: courierCompanyName });
      } else {
        notDeleted.push({ id: courierCompanyId, name: courierCompanyName, reason: 'Deletion failed' });
      }
    }

    return NextResponse.json({
      status: true,
      message: 'CourierCompany deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch {
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
