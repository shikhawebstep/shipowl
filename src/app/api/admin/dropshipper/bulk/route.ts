import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById, deleteDropshipper } from '@/app/models/dropshipper/dropshipper';
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
        { panel: 'Admin', module: 'Dropshipper', action: 'Permanent Delete' },
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

    for (const dropshipperId of ids) {
      const dropshipperResult = await getDropshipperById(dropshipperId);
      const dropshipperName = dropshipperResult?.dropshipper?.name ?? null;

      if (!dropshipperResult?.status || !dropshipperResult?.dropshipper) {
        notDeleted.push({ id: dropshipperId, name: dropshipperName, reason: 'Dropshipper not found' });
        continue;
      }

      const deleteResult = await deleteDropshipper(dropshipperId);
      if (deleteResult?.status) {
        deleted.push({ id: dropshipperId, name: dropshipperName });
      } else {
        notDeleted.push({ id: dropshipperId, name: dropshipperName, reason: 'Deletion failed' });
      }
    }


    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Category',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: 'Dropshipper deletion completed' },
        response: {
          status: true,
          message: 'Dropshipper deletion completed',
          deleted,
          notDeleted
        },
        status: true
      }, req);

    return NextResponse.json({
      status: true,
      message: 'Dropshipper deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Category',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: error || 'Internal server error' },
        status: false
      }, req);

    return NextResponse.json({ status: false, error: error || 'Internal server error' }, { status: 500 });
  }
}
