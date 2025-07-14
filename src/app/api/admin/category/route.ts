import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { createCategory, getCategoriesByStatus } from '@/app/models/admin/category';
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

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for category creation');

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Category',
        action: 'Create',
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

    const isMultipleImages = true; // Set true to allow multiple image uploads

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name'],
      patternValidations: {
        status: 'boolean',
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

    let image = '';

    if (fileData) {
      logMessage('info', 'uploaded fileData:', fileData);
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

    logMessage('info', 'Category payload created:', categoryPayload);

    const categoryCreateResult = await createCategory(adminId, String(adminRole), categoryPayload);

    if (categoryCreateResult?.status) {
      return NextResponse.json({ status: true, category: categoryCreateResult.category }, { status: 200 });
    }

    // ❌ Category creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'Category creation failed:', categoryCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: categoryCreateResult?.message || 'Category creation failed' },
      { status: 500 }
    );
  } catch (error) {
    logMessage('error', 'Category Creation Error:', error);
    return NextResponse.json({ status: false, error, message: 'Internal server error 9' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching categories', req);

    // Fetch all categories
    const categoriesResult = await getCategoriesByStatus("notDeleted");

    if (categoriesResult?.status) {
      return NextResponse.json(
        { status: true, categories: categoriesResult.categories },
        { status: 200 }
      );
    }

    logMessage('warn', 'No categories found');
    return NextResponse.json(
      { status: false, error: "No categories found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching categories:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
