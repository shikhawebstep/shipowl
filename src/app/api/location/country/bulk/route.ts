import { NextRequest, NextResponse } from 'next/server';
import { isUserExist } from "@/utils/auth/authUtils";
import { getCountryById, deleteCountry } from '@/app/models/location/country';
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
        { panel: 'Admin', module: 'Country', action: 'Permanent Delete' },
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

    for (const countryId of ids) {
      const countryResult = await getCountryById(countryId);
      const countryName = countryResult?.country?.name ?? null;

      if (!countryResult?.status || !countryResult?.country) {
        notDeleted.push({ id: countryId, name: countryName, reason: 'Country not found' });
        continue;
      }

      const deleteResult = await deleteCountry(countryId);
      if (deleteResult?.status) {
        deleted.push({ id: countryId, name: countryName });
      } else {
        notDeleted.push({ id: countryId, name: countryName, reason: 'Deletion failed' });
      }
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Country (Location)',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: 'Country deletion completed' },
        response: {
          status: true,
          message: 'Country deletion completed',
          deleted,
          notDeleted
        },
        status: true
      }, req);

    return NextResponse.json({
      status: true,
      message: 'Country deletion completed',
      deleted,
      notDeleted
    }, { status: 200 });

  } catch (error) {

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Country (Location)',
        action: 'Permanent Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
