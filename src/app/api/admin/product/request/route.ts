import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { createProductRequest, getProductRequestsByStatus } from '@/app/models/admin/product/productRequest';
import { getCategoryById } from '@/app/models/admin/category';

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
  role?: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: SupplierStaff;
}

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for productRequest creation');

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isMultipleImages = true; // Set true to allow multiple image uploads

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name', 'category'],
      patternValidations: {
        status: 'boolean',
        category: 'number'
      },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    // Extract fields
    const name = formData.get('name') as string;
    const categoryId = Number(formData.get('category'));
    const expectedPrice = Number(formData.get('expectedPrice'));
    const expectedDailyOrders = formData.get('expectedDailyOrders') as string;
    const url = formData.get('url') as string;

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    if (isNaN(categoryId) || isNaN(expectedPrice)) {
      logMessage('warn', 'Invalid categoryId or expectedPrice', { categoryId, expectedPrice });
      return NextResponse.json({ error: 'Invalid category and expected price' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryId);
    logMessage('debug', 'Category fetch result:', categoryResult);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryId });
      return NextResponse.json({ status: false, message: 'category not found' }, { status: 404 });
    }

    // File upload
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'productRequest');
    const fileData = await saveFilesFromFormData(formData, 'image', {
      dir: uploadDir,
      pattern: 'slug-unique',
      multiple: isMultipleImages,
    });

    let image = '';

    if (fileData) {
      logMessage('info', 'uploaded fileData:', fileData);
      image = isMultipleImages
        ? (fileData as UploadedFileInfo[]).map(file => file.url).join(', ')
        : (fileData as UploadedFileInfo).url;
    }

    const productRequestPayload = {
      name,
      category: {
        connect: {
          id: categoryId,
        },
      },
      expectedPrice,
      expectedDailyOrders,
      url,
      status,
      image,
    };

    logMessage('info', 'ProductRequest payload created:', productRequestPayload);

    const productRequestCreateResult = await createProductRequest(adminId, String(adminRole), productRequestPayload);

    if (productRequestCreateResult?.status) {
      return NextResponse.json({ status: true, productRequest: productRequestCreateResult.productRequest }, { status: 200 });
    }

    // ❌ ProductRequest creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'ProductRequest creation failed:', productRequestCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: productRequestCreateResult?.message || 'ProductRequest creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'ProductRequest Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching productRequests');

    // Retrieve x-admin-id and x-admin-role from request headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    // Fetch all productRequests
    const productRequestsResult = await getProductRequestsByStatus("notDeleted");

    if (productRequestsResult?.status) {
      return NextResponse.json(
        { status: true, productRequests: productRequestsResult.productRequests },
        { status: 200 }
      );
    }

    logMessage('warn', 'No product requests found');
    return NextResponse.json(
      { status: false, error: "No product requests found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching productRequests:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch productRequests" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};