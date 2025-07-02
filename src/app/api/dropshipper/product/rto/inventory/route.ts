import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getRTOInventories } from "@/app/models/dropshipper/rtoInventory"; // <-- make sure this function exists

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
  role: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: SupplierStaff;
}

export async function GET(req: NextRequest) {
  try {
    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Received dropshipper info for RTO fetch', { dropshipperId, dropshipperRole });

    // Validate dropshipper ID
    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing dropshipper ID.' },
        { status: 400 }
      );
    }

    // Validate dropshipper existence
    let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    // Fetch RTO Inventory
    const inventoryResult = await getRTOInventories(mainDropshipperId);

    if (inventoryResult?.status && inventoryResult.inventories?.length > 0) {
      return NextResponse.json(
        { status: true, inventories: inventoryResult.inventories },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No RTO inventory found.' },
      { status: 404 }
    );

  } catch (error) {
    logMessage('error', 'Failed to fetch RTO inventory', { error });
    return NextResponse.json(
      { status: false, error: 'Internal server error while fetching RTO inventory.' },
      { status: 500 }
    );
  }
}
