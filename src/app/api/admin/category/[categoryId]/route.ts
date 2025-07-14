import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getCategoryById, updateCategory, softDeleteCategory, restoreCategory } from '@/app/models/admin/category';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
    // Extract categoryId directly from the URL path
    const categoryId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Category ID:', categoryId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    //  let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      //  mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Category',
        action: 'Update',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID', { categoryId });
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    if (categoryResult?.status) {
      logMessage('info', 'Category found:', categoryResult.category);
      return NextResponse.json({ status: true, category: categoryResult.category }, { status: 200 });
    }

    logMessage('info', 'Category found:', categoryResult.category);
    return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single category:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract categoryId directly from the URL path
    const categoryId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Category ID:', categoryId);

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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Category',
        action: 'Update',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID', { categoryId });
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    logMessage('debug', 'Category fetch result:', categoryResult);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryIdNum });
      return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
    }

    const isMultipleImages = true; // Set true to allow multiple image uploads

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name'],
      patternValidations: {
        status: 'boolean',
      },
    });

    logMessage('debug', 'Form data received:', formData);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    // Extract fields
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    // File upload
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'category');
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

    const categoryPayload = {
      name,
      description,
      status,
      image,
    };

    logMessage('info', 'Category payload:', categoryPayload);

    const categoryCreateResult = await updateCategory(adminId, String(adminRole), categoryIdNum, categoryPayload);

    if (categoryCreateResult?.status) {
      logMessage('info', 'Category updated successfully:', categoryCreateResult.category);
      return NextResponse.json({ status: true, category: categoryCreateResult.category }, { status: 200 });
    }

    // ❌ Category creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'Category update failed', categoryCreateResult?.message);
    return NextResponse.json(
      { status: false, error: categoryCreateResult?.message || 'Category creation failed' },
      { status: 500 }
    );
  } catch (error) {
    logMessage('error', '❌ Category Updation Error:', error);
    return NextResponse.json({ status: false, error, message: 'Internal server error 10' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract categoryId directly from the URL path
    const categoryId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Category ID:', categoryId);

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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Category',
        action: 'restore',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID', { categoryId });
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    logMessage('debug', 'Category fetch result:', categoryResult);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryIdNum });
      return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
    }

    // Restore the category (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreCategory(adminId, String(adminRole), categoryIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Category restored successfully:', restoreResult.restoredCategory);
      return NextResponse.json({ status: true, category: restoreResult.restoredCategory }, { status: 200 });
    }

    logMessage('error', 'Category restore failed');
    return NextResponse.json({ status: false, error: 'Category restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Category restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract categoryId directly from the URL path
    const categoryId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete Category Request:', { categoryId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Category',
        action: 'Soft Delete',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    // Validate category ID
    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      logMessage('warn', 'Invalid category ID format', { categoryId });
      return NextResponse.json({ error: 'Category ID is invalid' }, { status: 400 });
    }

    const categoryResult = await getCategoryById(categoryIdNum);
    if (!categoryResult?.status) {
      logMessage('warn', 'Category not found', { categoryIdNum });
      return NextResponse.json({ status: false, message: 'Category not found' }, { status: 404 });
    }

    const result = await softDeleteCategory(Number(adminId), String(adminRole), categoryIdNum);  // Assuming softDeleteCategory marks the category as deleted
    logMessage('info', `Soft delete request for category: ${categoryIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Category soft deleted successfully: ${categoryIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Category soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Category not found or could not be deleted: ${categoryIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Category not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during category deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 11' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
