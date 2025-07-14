import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getSupplierStaffById, checkEmailAvailabilityForUpdate, updateSupplierStaff, restoreSupplierStaff, softDeleteSupplierStaff } from '@/app/models/supplier/staff';
import { getRolePermissions } from '@/app/models/staffPermission';

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function GET(req: NextRequest) {
  try {
    const supplierStaffId = req.nextUrl.pathname.split('/').pop();

    const supplierId = req.headers.get('x-supplier-id');
    const supplierRole = req.headers.get('x-supplier-role');

    if (!supplierId || isNaN(Number(supplierId))) {
      logMessage('warn', 'Invalid or missing supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid or missing supplier ID' }, { status: 400 });
    }

    const userCheck = await isUserExist(Number(supplierId), String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { supplierId, supplierRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (supplierStaffResult?.status) {
      logMessage('info', 'Supplier found:', supplierStaffResult.supplierStaff);

      const options = {
        panel: 'Supplier',
      };

      const staffPermissionsResult = await getRolePermissions(options);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      return NextResponse.json({ status: true, supplierStaff: supplierStaffResult.supplierStaff, staffPermissions: staffPermissionsResult?.staffPermissions }, { status: 200 });
    }

    logMessage('info', 'Supplier Staff found:', supplierStaffResult.supplierStaff);
    return NextResponse.json({ status: false, message: 'Supplier Staff not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single supplier:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for supplier updation');

    const supplierStaffId = req.nextUrl.pathname.split('/').pop();

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

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (!supplierStaffResult?.status) {
      logMessage('warn', `Supplier Staff not found: ${supplierStaffResult.message}`, { supplierStaffId });
      return NextResponse.json({ error: `Supplier Staff not found: ${supplierStaffResult.message}` }, { status: 404 });
    }

    const requiredFields = ['name', 'email'];
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

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const email = extractString('email') || '';
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, Number(supplierStaffId));

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
      password: '',
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

    const supplierStaffCreateResult = await updateSupplierStaff(Number(supplierStaffId), String(supplierRole), supplierPayload);

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

export async function PATCH(req: NextRequest) {
  try {

    const supplierStaffId = req.nextUrl.pathname.split('/').pop();

    // Get headers
    const supplierIdHeader = req.headers.get("x-supplier-id");
    const supplierRole = req.headers.get("x-supplier-role");

    const supplierId = Number(supplierIdHeader);
    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', 'Invalid or missing supplier ID header', { supplierIdHeader, supplierRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const userCheck = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { supplierId, supplierRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (supplierStaffResult?.status) {
      logMessage('info', 'Supplier found:', supplierStaffResult.supplierStaff);
      return NextResponse.json({ status: true, supplierStaff: supplierStaffResult.supplierStaff }, { status: 200 });
    }

    // Restore the supplier (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreSupplierStaffResult = await restoreSupplierStaff(supplierId, String(supplierRole), Number(supplierStaffId));

    if (restoreSupplierStaffResult?.status) {
      logMessage('info', 'Supplier restored successfully:', restoreSupplierStaffResult.restoredSupplierStaff);
      return NextResponse.json({ status: true, supplier: restoreSupplierStaffResult.restoredSupplierStaff }, { status: 200 });
    }

    logMessage('error', 'Supplier restore failed');
    return NextResponse.json({ status: false, error: 'Supplier restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Supplier restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {

    const supplierStaffId = req.nextUrl.pathname.split('/').pop();

    // Extract supplier ID and role from headers
    const supplierIdHeader = req.headers.get('x-supplier-id');
    const supplierId = Number(supplierIdHeader);
    const supplierRole = req.headers.get('x-supplier-role');

    // Validate supplier ID
    if (!supplierId || isNaN(Number(supplierId))) {
      logMessage('warn', 'Invalid or missing supplier ID', { supplierId });
      return NextResponse.json({ error: 'Supplier ID is missing or invalid' }, { status: 400 });
    }

    // Check if the supplier user exists
    const userCheck = await isUserExist(Number(supplierId), String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `Supplier not found: ${userCheck.message}`, { supplierId, supplierRole });
      return NextResponse.json({ error: `Supplier not found: ${userCheck.message}` }, { status: 404 });
    }

    const supplierStaffResult = await getSupplierStaffById(Number(supplierStaffId));
    if (!supplierStaffResult?.status) {
      logMessage('warn', `Supplier Staff not found: ${supplierStaffResult.message}`, { supplierStaffId });
      return NextResponse.json({ error: `Supplier Staff not found: ${supplierStaffResult.message}` }, { status: 404 });
    }

    const result = await softDeleteSupplierStaff(Number(supplierId), String(supplierRole), Number(supplierStaffId));  // Assuming softDeleteSupplier marks the supplier as deleted
    logMessage('info', `Soft delete request for supplier: ${supplierId}`, { supplierId });

    if (result?.status) {
      logMessage('info', `Supplier soft deleted successfully: ${supplierId}`, { supplierId });
      return NextResponse.json({ status: true, message: `Supplier soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Supplier not found or could not be deleted: ${supplierId}`, { supplierId });
    return NextResponse.json({ status: false, message: 'Supplier not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during supplier deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};