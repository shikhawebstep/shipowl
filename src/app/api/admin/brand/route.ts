import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bwipjs from 'bwip-js';
import fs from 'fs/promises';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { createBrand, getBrandsByStatus } from '@/app/models/admin/brand';
import { fetchLogInfo } from '@/utils/commonUtils';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface AdminStaff {
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
  admin?: AdminStaff;
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
    logMessage('debug', 'POST request received for brand creation');

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
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'brand');
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

    const brandPayload = {
      name,
      description,
      status,
      image,
    };

    logMessage('info', 'Brand payload created:', brandPayload);

    const brandCreateResult = await createBrand(adminId, String(adminRole), brandPayload);

    if (brandCreateResult?.status) {

      // Generate a barcode based on brand name
      const barcodeFileName = `barcode-${Date.now()}.png`;
      const barcodePath = path.join(uploadDir, barcodeFileName);
      const barcodePublicPath = `/uploads/brand/${barcodeFileName}`;

      try {
        const pngBuffer = await bwipjs.toBuffer({
          bcid: 'code128',        // Barcode type
          text: name,             // Brand name as barcode text
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });

        // Save the buffer as a PNG file
        await fs.writeFile(barcodePath, pngBuffer);
        logMessage('info', `Barcode image saved: ${barcodePublicPath}`);
      } catch (barcodeErr) {
        logMessage('error', 'Barcode generation failed:', barcodeErr);
      }

      return NextResponse.json({ status: true, brand: brandCreateResult.brand }, { status: 200 });
    }

    // ❌ Brand creation failed — delete uploaded file(s)
    const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));

    if (isMultipleImages && Array.isArray(fileData)) {
      await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
    } else {
      await deleteFile(deletePath(fileData as UploadedFileInfo));
    }

    logMessage('error', 'Brand creation failed:', brandCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: brandCreateResult?.message || 'Brand creation failed' },
      { status: 500 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Brand Creation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error 5' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching brands');

    const fetchLogInfoResult = await fetchLogInfo('brand', 'view', req);
    logMessage('debug', 'fetchLogInfoResult:', fetchLogInfoResult);

    // Fetch all brands
    const brandsResult = await getBrandsByStatus("notDeleted");

    if (brandsResult?.status) {
      return NextResponse.json(
        { status: true, brands: brandsResult.brands },
        { status: 200 }
      );
    }

    logMessage('warn', 'No brands found');
    return NextResponse.json(
      { status: false, error: "No brands found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching brands:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
