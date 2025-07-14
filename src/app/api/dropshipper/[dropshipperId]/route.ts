import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getDropshipperById, checkEmailAvailabilityForUpdate, updateDropshipper, restoreDropshipper, softDeleteDropshipper } from '@/app/models/dropshipper/dropshipper';
import { updateDropshipperCompany } from '@/app/models/dropshipper/company';

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
    // Extract dropshipperId directly from the URL path
    const dropshipperId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Dropshipper ID:', dropshipperId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    if (dropshipperResult?.status) {
      logMessage('info', 'Dropshipper found:', dropshipperResult.dropshipper);
      return NextResponse.json({ status: true, dropshipper: dropshipperResult.dropshipper }, { status: 200 });
    }

    logMessage('info', 'Dropshipper found:', dropshipperResult.dropshipper);
    return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single dropshipper:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for dropshipper updation');

    // Extract dropshipperId directly from the URL path
    const dropshipperId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Dropshipper ID:', dropshipperId);

    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    logMessage('debug', 'Dropshipper fetch result:', dropshipperResult);
    if (!dropshipperResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperIdNum });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
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
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, dropshipperIdNum);

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

    const dropshipperUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper');
    const dropshipperFileFields = [
      'profilePicture'
    ];

    const dropshipperUploadedFiles: Record<string, string> = {};
    for (const field of dropshipperFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: dropshipperUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          dropshipperUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          dropshipperUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const dropshipperPayload = {
      name: extractString('name') || '',
      profilePicture: dropshipperUploadedFiles['profilePicture'],
      email,
      website: extractString('website') || '',
      phoneNumber: extractString('phoneNumber') || '',
      referralCode: extractString('referralCode') || '',
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
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Dropshipper payload updated:', dropshipperPayload);

    const dropshipperCreateResult = await updateDropshipper(adminId, String(adminRole), dropshipperIdNum, dropshipperPayload);

    if (!dropshipperCreateResult || !dropshipperCreateResult.status || !dropshipperCreateResult.dropshipper) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(dropshipperUploadedFiles).length > 0) {
        // Iterate over each field in dropshipperUploadedFiles
        for (const field in dropshipperUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = dropshipperUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(dropshipperUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }
      logMessage('error', 'Dropshipper creation failed:', dropshipperCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: dropshipperCreateResult?.message || 'Dropshipper creation failed' }, { status: 500 });
    }

    const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${dropshipperCreateResult.dropshipper.id}`, 'company');
    const dropshipperCompanyFileFields = [
      'gstDocument',
      'panCardImage',
      'aadharCardImage',
      'additionalDocumentUpload',
      'documentImage'
    ];

    const dropshipperCompanyUploadedFiles: Record<string, string> = {};
    for (const field of dropshipperCompanyFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: companyUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          dropshipperCompanyUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          dropshipperCompanyUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const dropshipperCompanyPayload = {
      admin: { connect: { id: dropshipperCreateResult.dropshipper.id } },
      gstNumber: extractString('gstNumber') || '',
      gstDocument: dropshipperCompanyUploadedFiles['gstDocument'],
      panCardHolderName: extractString('panCardHolderName') || '',
      aadharCardHolderName: extractString('aadharCardHolderName') || '',
      panCardImage: dropshipperCompanyUploadedFiles['panCardImage'],
      aadharCardImage: dropshipperCompanyUploadedFiles['aadharCardImage'],
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Dropshipper payload updated:', dropshipperCompanyPayload);

    const dropshipperCompanyCreateResult = await updateDropshipperCompany(adminId, String(adminRole), dropshipperIdNum, dropshipperCompanyPayload);
    if (!dropshipperCompanyCreateResult || !dropshipperCompanyCreateResult.status || !dropshipperCompanyCreateResult.dropshipper) {

      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(dropshipperCompanyUploadedFiles).length > 0) {
        // Iterate over each field in dropshipperCompanyUploadedFiles
        for (const field in dropshipperCompanyUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = dropshipperCompanyUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(companyUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }

      logMessage('error', 'Dropshipper company creation failed', dropshipperCompanyCreateResult?.message);
      return NextResponse.json({ status: false, error: dropshipperCompanyCreateResult?.message || 'Dropshipper company creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: dropshipperCreateResult?.message || 'Dropshipper updated Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Dropshipper Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }

}

export async function PATCH(req: NextRequest) {
  try {
    // Extract dropshipperId directly from the URL path
    const dropshipperId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Dropshipper ID:', dropshipperId);

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

    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    logMessage('debug', 'Dropshipper fetch result:', dropshipperResult);
    if (!dropshipperResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperIdNum });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    // Restore the dropshipper (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreDropshipper(adminId, String(adminRole), dropshipperIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Dropshipper restored successfully:', restoreResult.restoredDropshipper);
      return NextResponse.json({ status: true, dropshipper: restoreResult.restoredDropshipper }, { status: 200 });
    }

    logMessage('error', 'Dropshipper restore failed');
    return NextResponse.json({ status: false, error: 'Dropshipper restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Dropshipper restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract dropshipperId directly from the URL path
    const dropshipperId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete Dropshipper Request:', { dropshipperId });

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

    // Validate dropshipper ID
    const dropshipperIdNum = Number(dropshipperId);
    if (isNaN(dropshipperIdNum)) {
      logMessage('warn', 'Invalid dropshipper ID format', { dropshipperId });
      return NextResponse.json({ error: 'Dropshipper ID is invalid' }, { status: 400 });
    }

    const dropshipperResult = await getDropshipperById(dropshipperIdNum);
    if (!dropshipperResult?.status) {
      logMessage('warn', 'Dropshipper not found', { dropshipperIdNum });
      return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    }

    const result = await softDeleteDropshipper(Number(adminId), String(adminRole), dropshipperIdNum);  // Assuming softDeleteDropshipper marks the dropshipper as deleted
    logMessage('info', `Soft delete request for dropshipper: ${dropshipperIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Dropshipper soft deleted successfully: ${dropshipperIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Dropshipper soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Dropshipper not found or could not be deleted: ${dropshipperIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Dropshipper not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during dropshipper deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};