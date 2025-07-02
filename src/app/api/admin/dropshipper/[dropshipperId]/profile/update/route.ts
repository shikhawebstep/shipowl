import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkEmailAvailabilityForUpdate, updateDropshipper } from '@/app/models/dropshipper/dropshipper';
import { updateDropshipperCompany } from '@/app/models/dropshipper/company';
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
  role: string;
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

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for dropshipper updation');

    const parts = req.nextUrl.pathname.split('/');
    const dropshipperId = Number(parts[parts.length - 3]); // Get the second-to-last segment

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminId || isNaN(adminId)) {
      logMessage('warn', `Invalid adminId: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Dropshipper',
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
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, dropshipperId);

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

    const dropshipperCreateResult = await updateDropshipper(adminId, String(adminRole), dropshipperId, dropshipperPayload);

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

    const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${dropshipperId}`, 'company');
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
      admin: { connect: { id: dropshipperId } },
      gstNumber: extractString('gstNumber') || '',
      gstDocument: dropshipperCompanyUploadedFiles['gstDocument'],
      panCardHolderName: extractString('panCardHolderName') || '',
      aadharCardHolderName: extractString('aadharCardHolderName') || '',
      panCardImage: dropshipperCompanyUploadedFiles['panCardImage'],
      aadharCardImage: dropshipperCompanyUploadedFiles['aadharCardImage'],
      updatedAt: new Date(),
      updatedBy: dropshipperId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Dropshipper payload updated:', dropshipperCompanyPayload);

    const dropshipperCompanyCreateResult = await updateDropshipperCompany(adminId, String(adminRole), dropshipperId, dropshipperCompanyPayload);
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

export const config = {
  api: {
    bodyParser: false,
  },
};
