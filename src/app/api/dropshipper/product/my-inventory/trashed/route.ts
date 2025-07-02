import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getProductsByStatus } from '@/app/models/dropshipper/product';

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
    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    const dropshipperId = Number(dropshipperIdHeader);

    logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

    // Validate dropshipperId
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, message: 'Invalid or missing dropshipper ID' },
        { status: 400 }
      );
    }

    // Check if user exists
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

    // Fetch deleted products for this dropshipper
    const productsResult = await getProductsByStatus('my', mainDropshipperId, 'deleted');

    if (productsResult?.status) {
      return NextResponse.json(
        { status: true, message: 'Products fetched successfully', products: productsResult.products },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, message: 'No products found' },
      { status: 404 }
    );

  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, message: 'Internal server error while fetching products' },
      { status: 500 }
    );
  }
}
