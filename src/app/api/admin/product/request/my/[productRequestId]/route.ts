import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getProductRequestById, updateProductRequest, softDeleteProductRequest, restoreProductRequest } from '@/app/models/admin/product/myProductRequest';
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

export async function GET(req: NextRequest) {
  try {
    // Extract productRequestId directly from the URL path
    const productRequestId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested ProductRequest ID:', productRequestId);

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

    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequestID', { productRequestId });
      return NextResponse.json({ error: 'Invalid productRequestID' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(Number(adminId), String(adminRole), productRequestIdNum);
    if (productRequestResult?.status) {
      logMessage('info', 'ProductRequest found:', productRequestResult.productRequest);
      return NextResponse.json({ status: true, productRequest: productRequestResult.productRequest }, { status: 200 });
    }

    logMessage('info', 'ProductRequest found:', productRequestResult.productRequest);
    return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error fetching productRequests:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch productRequests" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract productRequestId directly from the URL path
    const productRequestId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested ProductRequest ID:', productRequestId);

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequestID', { productRequestId });
      return NextResponse.json({ error: 'Invalid productRequestID' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(Number(adminId), String(adminRole), productRequestIdNum);
    logMessage('debug', 'ProductRequest fetch result:', productRequestResult);
    if (!productRequestResult?.status) {
      logMessage('warn', 'ProductRequest not found', { productRequestIdNum });
      return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
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

    logMessage('debug', 'File upload result:', fileData);
    let image = '';

    if (fileData) {
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

    logMessage('info', 'ProductRequest payload:', productRequestPayload);

    const productRequestCreateResult = await updateProductRequest(adminId, String(adminRole), productRequestIdNum, productRequestPayload);

    if (productRequestCreateResult?.status) {
      logMessage('info', 'ProductRequest updated successfully:', productRequestCreateResult.productRequest);
      return NextResponse.json({ status: true, productRequest: productRequestCreateResult.productRequest }, { status: 200 });
    }

    // ❌ ProductRequest creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'ProductRequest update failed', productRequestCreateResult?.message);
    return NextResponse.json(
      { status: false, error: productRequestCreateResult?.message || 'ProductRequest creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', '❌ ProductRequest Updation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract productRequestId directly from the URL path
    const productRequestId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested ProductRequest ID:', productRequestId);

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequestID', { productRequestId });
      return NextResponse.json({ error: 'Invalid productRequestID' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(Number(adminId), String(adminRole), productRequestIdNum);
    logMessage('debug', 'ProductRequest fetch result:', productRequestResult);
    if (!productRequestResult?.status) {
      logMessage('warn', 'ProductRequest not found', { productRequestIdNum });
      return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
    }

    // Restore the productRequest(i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreProductRequest(adminId, String(adminRole), productRequestIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'ProductRequest restored successfully:', restoreResult.restoredProductRequest);
      return NextResponse.json({ status: true, productRequest: restoreResult.restoredProductRequest }, { status: 200 });
    }

    logMessage('error', 'ProductRequest restore failed');
    return NextResponse.json({ status: false, error: 'ProductRequest restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ ProductRequest restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract productRequestId directly from the URL path
    const productRequestId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete ProductRequest Request:', { productRequestId });

    // Extract admin ID and role from headers
    const adminId = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate productRequestID
    const productRequestIdNum = Number(productRequestId);
    if (isNaN(productRequestIdNum)) {
      logMessage('warn', 'Invalid productRequestID format', { productRequestId });
      return NextResponse.json({ error: 'ProductRequest ID is invalid' }, { status: 400 });
    }

    const productRequestResult = await getProductRequestById(Number(adminId), String(adminRole), productRequestIdNum);
    if (!productRequestResult?.status) {
      logMessage('warn', 'ProductRequest not found', { productRequestIdNum });
      return NextResponse.json({ status: false, message: 'ProductRequest not found' }, { status: 404 });
    }

    const result = await softDeleteProductRequest(Number(adminId), String(adminRole), productRequestIdNum);  // Assuming softDeleteProductRequest marks the productRequestas deleted
    logMessage('info', `Soft delete request for productRequest: ${productRequestIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `ProductRequest soft deleted successfully: ${productRequestIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `ProductRequest soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `ProductRequest not found or could not be deleted: ${productRequestIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'ProductRequest not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during productRequestdeletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};