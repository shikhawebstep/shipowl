import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getBrandById, updateBrand, softDeleteBrand, restoreBrand } from '@/app/models/admin/brand';
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
    // Extract brandId directly from the URL path
    const brandId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Brand ID:', brandId);

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
        module: 'Brand',
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

    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID', { brandId });
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    if (brandResult?.status) {
      logMessage('info', 'Brand found:', brandResult.brand);
      return NextResponse.json({ status: true, brand: brandResult.brand }, { status: 200 });
    }

    logMessage('info', 'Brand found:', brandResult.brand);
    return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single brand:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract brandId directly from the URL path
    const brandId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Brand ID:', brandId);

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
        module: 'Brand',
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

    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID', { brandId });
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    logMessage('debug', 'Brand fetch result:', brandResult);
    if (!brandResult?.status) {
      logMessage('warn', 'Brand not found', { brandIdNum });
      return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
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
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'brand');
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

    const brandPayload = {
      name,
      description,
      status,
      image,
    };

    logMessage('info', 'Brand payload:', brandPayload);

    const brandCreateResult = await updateBrand(adminId, String(adminRole), brandIdNum, brandPayload);

    if (brandCreateResult?.status) {
      logMessage('info', 'Brand updated successfully:', brandCreateResult.brand);
      return NextResponse.json({ status: true, brand: brandCreateResult.brand }, { status: 200 });
    }

    // ❌ Brand creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'Brand update failed', brandCreateResult?.message);
    return NextResponse.json(
      { status: false, error: brandCreateResult?.message || 'Brand creation failed' },
      { status: 500 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', '❌ Brand Updation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error 6' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract brandId directly from the URL path
    const brandId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Brand ID:', brandId);

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
        module: 'Brand',
        action: 'Restore',
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

    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID', { brandId });
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    logMessage('debug', 'Brand fetch result:', brandResult);
    if (!brandResult?.status) {
      logMessage('warn', 'Brand not found', { brandIdNum });
      return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
    }

    // Restore the brand (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreBrand(adminId, String(adminRole), brandIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Brand restored successfully:', restoreResult.restoredBrand);
      return NextResponse.json({ status: true, brand: restoreResult.restoredBrand }, { status: 200 });
    }

    logMessage('error', 'Brand restore failed');
    return NextResponse.json({ status: false, error: 'Brand restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Brand restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract brandId directly from the URL path
    const brandId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete Brand Request:', { brandId });

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
        module: 'Brand',
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

    // Validate brand ID
    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID format', { brandId });
      return NextResponse.json({ error: 'Brand ID is invalid' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    if (!brandResult?.status) {
      logMessage('warn', 'Brand not found', { brandIdNum });
      return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
    }

    const result = await softDeleteBrand(Number(adminId), String(adminRole), brandIdNum);  // Assuming softDeleteBrand marks the brand as deleted
    logMessage('info', `Soft delete request for brand: ${brandIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Brand soft deleted successfully: ${brandIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Brand soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Brand not found or could not be deleted: ${brandIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Brand not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during brand deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error 7' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
