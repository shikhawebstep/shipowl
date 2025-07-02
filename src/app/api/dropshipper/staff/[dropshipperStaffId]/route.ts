import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getDropshipperStaffById, checkEmailAvailabilityForUpdate, updateDropshipperStaff, restoreDropshipperStaff, softDeleteDropshipperStaff } from '@/app/models/dropshipper/staff';
import { getStaffPermissions } from '@/app/models/staffPermission';

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

export async function GET(req: NextRequest) {
  try {
    const dropshipperStaffId = req.nextUrl.pathname.split('/').pop();

    const dropshipperId = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    if (!dropshipperId || isNaN(Number(dropshipperId))) {
      logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Invalid or missing dropshipper ID' }, { status: 400 });
    }

    const userCheck = await isUserExist(Number(dropshipperId), String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (dropshipperStaffResult?.status) {
      logMessage('info', 'Dropshipper found:', dropshipperStaffResult.dropshipperStaff);

      const options = {
        panel: 'Dropshipper',
      };

      const staffPermissionsResult = await getStaffPermissions(options);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      return NextResponse.json({ status: true, dropshipperStaff: dropshipperStaffResult.dropshipperStaff, staffPermissions: staffPermissionsResult?.staffPermissions }, { status: 200 });
    }

    logMessage('info', 'Dropshipper Staff found:', dropshipperStaffResult.dropshipperStaff);
    return NextResponse.json({ status: false, message: 'Dropshipper Staff not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single dropshipper:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for dropshipper updation');

    const dropshipperStaffId = req.nextUrl.pathname.split('/').pop();

    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');
    const dropshipperId = Number(dropshipperIdHeader);

    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', `Invalid dropshipperIdHeader: ${dropshipperIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (!dropshipperStaffResult?.status) {
      logMessage('warn', `Dropshipper Staff not found: ${dropshipperStaffResult.message}`, { dropshipperStaffId });
      return NextResponse.json({ error: `Dropshipper Staff not found: ${dropshipperStaffResult.message}` }, { status: 404 });
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
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, Number(dropshipperStaffId));

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
      admin: {
        connect: {
          id: dropshipperId,
        },
      },
      name: extractString('name') || '',
      profilePicture: dropshipperUploadedFiles['profilePicture'],
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
      createdBy: dropshipperId,
      createdByRole: dropshipperRole,
    };

    logMessage('info', 'Dropshipper payload created:', dropshipperPayload);

    const dropshipperStaffCreateResult = await updateDropshipperStaff(Number(dropshipperStaffId), String(dropshipperRole), dropshipperPayload);

    if (!dropshipperStaffCreateResult || !dropshipperStaffCreateResult.status || !dropshipperStaffCreateResult.dropshipperStaff) {
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
      logMessage('error', 'Dropshipper creation failed:', dropshipperStaffCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: dropshipperStaffCreateResult?.message || 'Dropshipper creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: dropshipperStaffCreateResult?.message || 'Dropshipper created Successfuly' },
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

    const dropshipperStaffId = req.nextUrl.pathname.split('/').pop();

    // Get headers
    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', 'Invalid or missing dropshipper ID header', { dropshipperIdHeader, dropshipperRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if dropshipper exists
    const userCheck = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (dropshipperStaffResult?.status) {
      logMessage('info', 'Dropshipper found:', dropshipperStaffResult.dropshipperStaff);
      return NextResponse.json({ status: true, dropshipperStaff: dropshipperStaffResult.dropshipperStaff }, { status: 200 });
    }

    // Restore the dropshipper (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreDropshipperStaffResult = await restoreDropshipperStaff(dropshipperId, String(dropshipperRole), Number(dropshipperStaffId));

    if (restoreDropshipperStaffResult?.status) {
      logMessage('info', 'Dropshipper restored successfully:', restoreDropshipperStaffResult.restoredDropshipperStaff);
      return NextResponse.json({ status: true, dropshipper: restoreDropshipperStaffResult.restoredDropshipperStaff }, { status: 200 });
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

    const dropshipperStaffId = req.nextUrl.pathname.split('/').pop();

    // Extract dropshipper ID and role from headers
    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperId = Number(dropshipperIdHeader);
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    // Validate dropshipper ID
    if (!dropshipperId || isNaN(Number(dropshipperId))) {
      logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperId });
      return NextResponse.json({ error: 'Dropshipper ID is missing or invalid' }, { status: 400 });
    }

    // Check if the dropshipper user exists
    const userCheck = await isUserExist(Number(dropshipperId), String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', `Dropshipper not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `Dropshipper not found: ${userCheck.message}` }, { status: 404 });
    }

    const dropshipperStaffResult = await getDropshipperStaffById(Number(dropshipperStaffId));
    if (!dropshipperStaffResult?.status) {
      logMessage('warn', `Dropshipper Staff not found: ${dropshipperStaffResult.message}`, { dropshipperStaffId });
      return NextResponse.json({ error: `Dropshipper Staff not found: ${dropshipperStaffResult.message}` }, { status: 404 });
    }

    const result = await softDeleteDropshipperStaff(Number(dropshipperId), String(dropshipperRole), Number(dropshipperStaffId));  // Assuming softDeleteDropshipper marks the dropshipper as deleted
    logMessage('info', `Soft delete request for dropshipper: ${dropshipperId}`, { dropshipperId });

    if (result?.status) {
      logMessage('info', `Dropshipper soft deleted successfully: ${dropshipperId}`, { dropshipperId });
      return NextResponse.json({ status: true, message: `Dropshipper soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Dropshipper not found or could not be deleted: ${dropshipperId}`, { dropshipperId });
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