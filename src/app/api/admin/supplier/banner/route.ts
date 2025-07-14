import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import bwipjs from 'bwip-js';

import { logMessage, fetchLogInfo } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { changeSupplierBanner, getSupplierBanner } from '@/app/models/admin/supplier/banner';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
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
    logMessage('debug', 'POST request received for supplier banner update');

    const adminId = Number(req.headers.get("x-admin-id"));
    const adminRole = req.headers.get("x-admin-role");

    if (!adminId || isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid or missing admin ID" }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));
    if (isStaff) {
      const permissionCheck = await checkStaffPermissionStatus({
        panel: 'Admin',
        module: 'Supplier Banner',
        action: 'Change',
      }, adminId);

      if (!permissionCheck.status) {
        return NextResponse.json(
          { status: false, message: permissionCheck.message || "Permission denied" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    const validation = validateFormData(formData, {
      requiredFields: ['status', 'image'],
      patternValidations: {
        status: 'boolean',
      },
    });

    if (!validation.isValid) {
      return NextResponse.json({ status: false, error: validation.error }, { status: 400 });
    }

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string);

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'brand');
    const fileData = await saveFilesFromFormData(formData, 'image', {
      dir: uploadDir,
      pattern: 'slug-unique',
      multiple: true,
    });

    const image = Array.isArray(fileData)
      ? fileData.map(f => f.url).join(', ')
      : (fileData as UploadedFileInfo).url;

    const bannerPayload = { status, image };

    const bannerResult = await changeSupplierBanner(adminId, String(adminRole), bannerPayload);

    if (!bannerResult?.status) {
      // Cleanup on failure
      const deletePath = (file: UploadedFileInfo) => path.join(uploadDir, path.basename(file.url));
      if (Array.isArray(fileData)) {
        await Promise.all(fileData.map(file => deleteFile(deletePath(file))));
      } else {
        await deleteFile(deletePath(fileData as UploadedFileInfo));
      }

      return NextResponse.json({ status: false, error: bannerResult.message || "Failed to update banner" }, { status: 500 });
    }

    // Optional: Generate a barcode for tracking purposes
    const barcodeFileName = `barcode-${Date.now()}.png`;
    const barcodePath = path.join(uploadDir, barcodeFileName);

    try {
      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: 'SupplierBanner', // Replace with dynamic value if needed
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });

      await fs.writeFile(barcodePath, pngBuffer);
      logMessage('info', `Barcode generated at: ${barcodePath}`);
    } catch (barcodeErr) {
      logMessage('error', 'Failed to generate barcode', barcodeErr);
    }

    return NextResponse.json({ status: true, banner: bannerResult.supplierBanner }, { status: 200 });

  } catch (error) {
    logMessage('error', 'Unexpected error during banner update:', error);
    return NextResponse.json({ status: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for supplier banner');

    await fetchLogInfo('supplier_banner', 'view', req);

    const result = await getSupplierBanner();

    if (result?.status) {
      return NextResponse.json(
        { status: true, banner: result.supplierBanner },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, message: result?.message || "Supplier banner not found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching supplier banner:', error);
    return NextResponse.json(
      { status: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
