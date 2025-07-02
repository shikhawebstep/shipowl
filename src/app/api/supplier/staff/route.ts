import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bcrypt from 'bcryptjs';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkEmailAvailability, createSupplierStaff, getSupplierStaffsByStatus } from '@/app/models/supplier/staff';

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for supplier creation');

    const supplierIdHeader = req.headers.get('x-supplier-id');
    const supplierRole = req.headers.get('x-supplier-role');
    const supplierId = Number(supplierIdHeader);

    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierIdHeader: ${supplierIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const requiredFields = ['name', 'email', 'password'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: { status: 'boolean' },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || null;
    const extractString = (key: string) => (formData.get(key) as string) || null;

    const statusRaw = extractString('status')?.toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const email = extractString('email') || '';
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailability(email);

    if (!checkEmailAvailabilityResult) {
      logMessage('warn', `Email availability check failed: ${checkEmailAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkEmailAvailabilityMessage }, { status: 400 });
    }

    const permanentCountryId = extractNumber('permanentCountry') || 0;
    const permanentStateId = extractNumber('permanentState') || 0;
    const permanentCityId = extractNumber('permanentCity') || 0;

    const isLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(permanentCityId, permanentStateId, permanentCountryId);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectResult);
    if (!isLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    const password = extractString('password') || '';
    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10); // Generates a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    const supplierUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier');
    const supplierFileFields = [
      'profilePicture'
    ];

    const supplierUploadedFiles: Record<string, string> = {};
    for (const field of supplierFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: supplierUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          supplierUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          supplierUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const supplierPayload = {
      admin: {
        connect: {
          id: supplierId,
        },
      },
      name: extractString('name') || '',
      profilePicture: supplierUploadedFiles['profilePicture'],
      email,
      phoneNumber: extractString('phoneNumber') || '',
      permissions: extractString('permissions') || '',
      password: hashedPassword,
      permanentAddress: extractString('permanentAddress') || '',
      permanentPostalCode: extractString('permanentPostalCode') || '',
      permanentCity: {
        connect: {
          id: permanentCityId,
        },
      },
      permanentState: {
        connect: {
          id: permanentStateId,
        },
      },
      permanentCountry: {
        connect: {
          id: permanentCountryId,
        },
      },
      status,
      createdAt: new Date(),
      createdBy: supplierId,
      createdByRole: supplierRole,
    };

    logMessage('info', 'Supplier payload created:', supplierPayload);

    const supplierStaffCreateResult = await createSupplierStaff(supplierId, String(supplierRole), supplierPayload);

    if (!supplierStaffCreateResult || !supplierStaffCreateResult.status || !supplierStaffCreateResult.supplierStaff) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(supplierUploadedFiles).length > 0) {
        // Iterate over each field in supplierUploadedFiles
        for (const field in supplierUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = supplierUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(supplierUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }
      logMessage('error', 'Supplier creation failed:', supplierStaffCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: supplierStaffCreateResult?.message || 'Supplier creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: supplierStaffCreateResult?.message || 'Supplier created Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Supplier Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching suppliers');

    // Retrieve x-supplier-id and x-supplier-role from request headers
    const supplierIdHeader = req.headers.get("x-supplier-id");
    const supplierRole = req.headers.get("x-supplier-role");

    logMessage('info', 'Supplier ID and Role:', { supplierIdHeader, supplierRole });
    const supplierId = Number(supplierIdHeader);
    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierIdHeader: ${supplierIdHeader}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const result = await isUserExist(supplierId, String(supplierRole));
    if (!result.status) {
      logMessage('warn', `User not found: ${result.message}`);
      return NextResponse.json(
        { status: false, error: `User Not Found: ${result.message}` },
        { status: 404 }
      );
    }

    // Fetch all suppliers
    const suppliersResult = await getSupplierStaffsByStatus("notDeleted");

    if (suppliersResult?.status) {
      return NextResponse.json(
        { status: true, suppliers: suppliersResult.supplierStaffs },
        { status: 200 }
      );
    }

    logMessage('warn', 'No suppliers found');
    return NextResponse.json(
      { status: false, error: "No suppliers found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching suppliers:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};