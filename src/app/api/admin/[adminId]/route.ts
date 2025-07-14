import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getAdminById, checkEmailAvailabilityForUpdate, updateAdmin, restoreAdmin, softDeleteAdmin } from '@/app/models/admin/admin';

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
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const adminIdNum = Number(adminId);
    if (isNaN(adminIdNum)) {
      logMessage('warn', 'Invalid admin ID', { adminIdNum });
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
    }

    const adminResult = await getAdminById(adminIdNum);
    if (adminResult?.status) {
      logMessage('info', 'Admin found:', adminResult.admin);
      return NextResponse.json({ status: true, admin: adminResult.admin }, { status: 200 });
    }

    logMessage('info', 'Admin found:', adminResult.admin);
    return NextResponse.json({ status: false, message: 'Admin not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single admin:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for admin updation');

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
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, adminId);

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

    const adminUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'admin');
    const adminFileFields = [
      'profilePicture'
    ];

    const adminUploadedFiles: Record<string, string> = {};
    for (const field of adminFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: adminUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          adminUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          adminUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const adminPayload = {
      name: extractString('name') || '',
      profilePicture: adminUploadedFiles['profilePicture'],
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

    logMessage('info', 'Admin payload updated:', adminPayload);

    const adminCreateResult = await updateAdmin(adminId, String(adminRole), adminPayload);

    if (!adminCreateResult || !adminCreateResult.status || !adminCreateResult.admin) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(adminUploadedFiles).length > 0) {
        // Iterate over each field in adminUploadedFiles
        for (const field in adminUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = adminUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(adminUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }
      logMessage('error', 'Admin creation failed:', adminCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: adminCreateResult?.message || 'Admin creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: adminCreateResult?.message || 'Admin updated Successfuly' },
      { status: 200 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Admin Creation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error 2' },
      { status: 500 }
    );
  }

}

export async function PATCH(req: NextRequest) {
  try {

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

    const adminResult = await getAdminById(adminId);
    logMessage('debug', 'Admin fetch result:', adminResult);
    if (!adminResult?.status) {
      logMessage('warn', 'Admin not found', { adminId });
      return NextResponse.json({ status: false, message: 'Admin not found' }, { status: 404 });
    }

    // Restore the admin (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreAdmin(adminId, String(adminRole), adminId);

    if (restoreResult?.status) {
      logMessage('info', 'Admin restored successfully:', restoreResult.restoredAdmin);
      return NextResponse.json({ status: true, admin: restoreResult.restoredAdmin }, { status: 200 });
    }

    logMessage('error', 'Admin restore failed');
    return NextResponse.json({ status: false, error: 'Admin restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Admin restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {

    // Extract admin ID and role from headers
    const adminIdHeader = req.headers.get('x-admin-id');
    const adminId = Number(adminIdHeader);
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

    const adminResult = await getAdminById(adminId);
    if (!adminResult?.status) {
      logMessage('warn', 'Admin not found', { adminId });
      return NextResponse.json({ status: false, message: 'Admin not found' }, { status: 404 });
    }

    const result = await softDeleteAdmin(Number(adminId), String(adminRole), adminId);  // Assuming softDeleteAdmin marks the admin as deleted
    logMessage('info', `Soft delete request for admin: ${adminId}`, { adminId });

    if (result?.status) {
      logMessage('info', `Admin soft deleted successfully: ${adminId}`, { adminId });
      return NextResponse.json({ status: true, message: `Admin soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Admin not found or could not be deleted: ${adminId}`, { adminId });
    return NextResponse.json({ status: false, message: 'Admin not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during admin deletion', { error });
    return NextResponse.json({ status: false, error, messsage: 'Internal server error 3' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
