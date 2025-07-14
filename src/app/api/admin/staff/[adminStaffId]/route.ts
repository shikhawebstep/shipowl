import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getAdminStaffById, checkEmailAvailabilityForUpdate, updateAdminStaff, restoreAdminStaff, softDeleteAdminStaff } from '@/app/models/admin/staff';
import { getStaffPermissions } from '@/app/models/staffPermission';
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
    const adminStaffId = req.nextUrl.pathname.split('/').pop();

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

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Sub User',
        action: 'View',
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

    const adminStaffResult = await getAdminStaffById(Number(adminStaffId));
    if (adminStaffResult?.status) {
      logMessage('info', 'Admin found:', adminStaffResult.adminStaff);

      const options = {
        panel: 'Admin',
      };

      const staffPermissionsResult = await getStaffPermissions(options);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      return NextResponse.json({ status: true, adminStaff: adminStaffResult.adminStaff, staffPermissions: staffPermissionsResult?.staffPermissions }, { status: 200 });
    }

    logMessage('info', 'Admin Staff found:', adminStaffResult.adminStaff);
    return NextResponse.json({ status: false, message: 'Admin Staff not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single admin:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for admin updation');

    const adminStaffId = req.nextUrl.pathname.split('/').pop();

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Sub User',
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

    const adminStaffResult = await getAdminStaffById(Number(adminStaffId));
    if (!adminStaffResult?.status) {
      logMessage('warn', `Admin Staff not found: ${adminStaffResult.message}`, { adminStaffId });
      return NextResponse.json({ error: `Admin Staff not found: ${adminStaffResult.message}` }, { status: 404 });
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
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, Number(adminStaffId));

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
      admin: {
        connect: {
          id: adminId,
        },
      },
      name: extractString('name') || '',
      profilePicture: adminUploadedFiles['profilePicture'],
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
      createdBy: adminId,
      createdByRole: adminRole,
    };

    logMessage('info', 'Admin payload created:', adminPayload);

    const adminStaffCreateResult = await updateAdminStaff(Number(adminStaffId), String(adminRole), adminPayload);

    if (!adminStaffCreateResult || !adminStaffCreateResult.status || !adminStaffCreateResult.adminStaff) {
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
      logMessage('error', 'Admin creation failed:', adminStaffCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: adminStaffCreateResult?.message || 'Admin creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: adminStaffCreateResult?.message || 'Admin created Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Admin Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }

}

export async function PATCH(req: NextRequest) {
  try {

    const adminStaffId = req.nextUrl.pathname.split('/').pop();

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
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Sub User',
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

    const adminStaffResult = await getAdminStaffById(Number(adminStaffId));
    if (adminStaffResult?.status) {
      logMessage('info', 'Admin found:', adminStaffResult.adminStaff);
      return NextResponse.json({ status: true, adminStaff: adminStaffResult.adminStaff }, { status: 200 });
    }

    // Restore the admin (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreAdminStaffResult = await restoreAdminStaff(adminId, String(adminRole), Number(adminStaffId));

    if (restoreAdminStaffResult?.status) {
      logMessage('info', 'Admin restored successfully:', restoreAdminStaffResult.restoredAdminStaff);
      return NextResponse.json({ status: true, admin: restoreAdminStaffResult.restoredAdminStaff }, { status: 200 });
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

    const adminStaffId = req.nextUrl.pathname.split('/').pop();

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
    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaffUser) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Sub User',
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

    const adminStaffResult = await getAdminStaffById(Number(adminStaffId));
    if (!adminStaffResult?.status) {
      logMessage('warn', `Admin Staff not found: ${adminStaffResult.message}`, { adminStaffId });
      return NextResponse.json({ error: `Admin Staff not found: ${adminStaffResult.message}` }, { status: 404 });
    }

    const result = await softDeleteAdminStaff(Number(adminId), String(adminRole), Number(adminStaffId));  // Assuming softDeleteAdmin marks the admin as deleted
    logMessage('info', `Soft delete request for admin: ${adminId}`, { adminId });

    if (result?.status) {
      logMessage('info', `Admin soft deleted successfully: ${adminId}`, { adminId });
      return NextResponse.json({ status: true, message: `Admin soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Admin not found or could not be deleted: ${adminId}`, { adminId });
    return NextResponse.json({ status: false, message: 'Admin not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during admin deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};