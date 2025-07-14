import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { getSupplierById, checkEmailAvailabilityForUpdate, checkUsernameAvailabilityForUpdate, updateSupplier, restoreSupplier, softDeleteSupplier } from '@/app/models/supplier/supplier';
import { updateSupplierCompany } from '@/app/models/supplier/company';
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
    // Extract supplierId directly from the URL path
    const supplierId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Supplier ID:', supplierId);

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Supplier',
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

    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    if (supplierResult?.status) {
      logMessage('info', 'Supplier found:', supplierResult.supplier);
      return NextResponse.json({ status: true, supplier: supplierResult.supplier }, { status: 200 });
    }

    logMessage('info', 'Supplier found:', supplierResult.supplier);
    return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single supplier:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for supplier creation');

    // Extract supplierId directly from the URL path
    const supplierId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Supplier ID:', supplierId);

    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    logMessage('debug', 'Supplier fetch result:', supplierResult);
    if (!supplierResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
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

    const requiredFields = ['name', 'username', 'email'];
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

    const extractDate = (key: string, outputFormat: string): string | null => {
      const value = extractString(key);
      if (!value) return null;

      // Define regular expressions for different date formats
      const regexPatterns = [
        { format: 'DD-MM-YYYY', regex: /^(\d{2})-(\d{2})-(\d{4})$/ },
        { format: 'YYYY-MM-DD', regex: /^(\d{4})-(\d{2})-(\d{2})$/ },
        { format: 'DD/MM/YYYY', regex: /^(\d{2})\/(\d{2})\/(\d{4})$/ },
        { format: 'YYYY/MM/DD', regex: /^(\d{4})\/(\d{2})\/(\d{2})$/ }
      ];

      let parsedDate: Date | null = null;

      // Try to match the input value to the known formats
      for (const { format, regex } of regexPatterns) {
        const match = value.match(regex);
        if (match) {
          const [, day, month, year] = match;
          // Convert matched values into a Date object
          parsedDate = new Date(`${year}-${month}-${day}`);
          logMessage('info', `✅ Parsed date from "${value}" using format "${format}"`);
          break;
        }
      }

      // If no valid date was parsed, return null
      if (!parsedDate) {
        logMessage('warn', `Failed to parse date for "${value}"`);
        return null;
      }

      // Helper function to format the date in a specific output format
      const formatDate = (date: Date, format: string): string => {
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };

        const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

        switch (format) {
          case 'DD-MM-YYYY':
            return formattedDate.replace(/\//g, '-');
          case 'YYYY-MM-DD':
            return formattedDate.split('/').reverse().join('-');
          default:
            return formattedDate;
        }
      };

      // Return the formatted date in the desired output format
      return formatDate(parsedDate, outputFormat);
    };

    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const email = extractString('email') || '';
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailabilityForUpdate(email, supplierIdNum);

    if (!checkEmailAvailabilityResult) {
      logMessage('warn', `Email availability check failed: ${checkEmailAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkEmailAvailabilityMessage }, { status: 400 });
    }

    const username = extractString('username') || '';
    const { status: checkUsernameAvailabilityResult, message: checkUsernameAvailabilityMessage } = await checkUsernameAvailabilityForUpdate(username, supplierIdNum);

    if (!checkUsernameAvailabilityResult) {
      logMessage('warn', `Username availability check failed: ${checkUsernameAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkUsernameAvailabilityMessage }, { status: 400 });
    }

    const permanentCountryId = extractNumber('permanentCountry') || 0;
    const permanentStateId = extractNumber('permanentState') || 0;
    const permanentCityId = extractNumber('permanentCity') || 0;

    const billingCountryId = extractNumber('billingCountry') || 0;
    const billingStateId = extractNumber('billingState') || 0;
    const billingCityId = extractNumber('billingCity') || 0;

    const isLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(permanentCityId, permanentStateId, permanentCountryId);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectResult);
    if (!isLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    const isLocationHierarchyCorrectBillingResult = await isLocationHierarchyCorrect(permanentCityId, permanentStateId, permanentCountryId);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectBillingResult);
    if (!isLocationHierarchyCorrectBillingResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectBillingResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectBillingResult.message || 'Location hierarchy is incorrect' },
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
      name: extractString('name') || '',
      profilePicture: supplierUploadedFiles['profilePicture'],
      username,
      email,
      password: '',
      dateOfBirth: extractDate('dateOfBirth', 'YYYY-MM-DD') || '',
      currentAddress: extractString('currentAddress') || '',
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

    logMessage('info', 'Supplier payload updated:', supplierPayload);

    const supplierCreateResult = await updateSupplier(adminId, String(adminRole), supplierIdNum, supplierPayload);

    if (!supplierCreateResult || !supplierCreateResult.status || !supplierCreateResult.supplier) {
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
      logMessage('error', 'Supplier creation failed:', supplierCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: supplierCreateResult?.message || 'Supplier creation failed' }, { status: 500 });
    }

    const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier', `${supplierCreateResult.supplier.id}`, 'company');
    const supplierCompanyFileFields = [
      'gstDocument',
      'companyPanCardImage',
      'panCardImage',
      'aadharCardImage',
      'additionalDocumentUpload',
      'documentImage'
    ];

    const supplierCompanyUploadedFiles: Record<string, string> = {};
    for (const field of supplierCompanyFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: companyUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          supplierCompanyUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          supplierCompanyUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const supplierCompanyPayload = {
      admin: { connect: { id: supplierCreateResult.supplier.id } },
      companyName: extractString('companyName') || '',
      brandName: extractString('brandName') || '',
      brandShortName: extractString('brandShortName') || '',
      billingAddress: extractString('billingAddress') || '',
      billingPincode: extractString('billingPincode') || '',
      billingCountry: {
        connect: {
          id: billingCountryId,
        },
      },
      billingState: {
        connect: {
          id: billingStateId,
        },
      },
      billingCity: {
        connect: {
          id: billingCityId,
        },
      },
      businessType: extractString('businessType') || '',
      clientEntryType: extractString('clientEntryType') || '',
      gstNumber: extractString('gstNumber') || '',
      gstDocument: supplierCompanyUploadedFiles['gstDocument'],
      companyPanNumber: extractString('companyPanNumber') || '',
      companyPanCardName: extractString('companyPanCardName') || '',
      companyPanCardImage: supplierCompanyUploadedFiles['companyPanCardImage'],
      aadharNumber: extractString('aadharNumber') || '',
      panCardHolderName: extractString('panCardHolderName') || '',
      aadharCardHolderName: extractString('aadharCardHolderName') || '',
      panCardImage: supplierCompanyUploadedFiles['panCardImage'],
      aadharCardImage: supplierCompanyUploadedFiles['aadharCardImage'],
      additionalDocumentUpload: supplierCompanyUploadedFiles['additionalDocumentUpload'] || '',
      documentId: extractString('gstNumber') || '',
      documentName: extractString('companyPanNumber') || '',
      documentImage: supplierCompanyUploadedFiles['documentImage'],
      updatedAt: new Date(),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Supplier payload updated:', supplierCompanyPayload);

    const supplierCompanyCreateResult = await updateSupplierCompany(adminId, String(adminRole), supplierIdNum, supplierCompanyPayload);
    if (!supplierCompanyCreateResult || !supplierCompanyCreateResult.status || !supplierCompanyCreateResult.supplier) {

      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(supplierCompanyUploadedFiles).length > 0) {
        // Iterate over each field in supplierCompanyUploadedFiles
        for (const field in supplierCompanyUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = supplierCompanyUploadedFiles[field].split(',').map((url) => url.trim());

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

      logMessage('error', 'Supplier company creation failed', supplierCompanyCreateResult?.message);
      return NextResponse.json({ status: false, error: supplierCompanyCreateResult?.message || 'Supplier company creation failed' }, { status: 500 });
    }

    return NextResponse.json(
      { status: true, error: supplierCreateResult?.message || 'Supplier updated Successfuly' },
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
    // Extract supplierId directly from the URL path
    const supplierId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Supplier ID:', supplierId);

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
        action: 'restore',
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

    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    logMessage('debug', 'Supplier fetch result:', supplierResult);
    if (!supplierResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    // Restore the supplier (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreSupplier(adminId, String(adminRole), supplierIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Supplier restored successfully:', restoreResult.restoredSupplier);
      return NextResponse.json({ status: true, supplier: restoreResult.restoredSupplier }, { status: 200 });
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
    // Extract supplierId directly from the URL path
    const supplierId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete Supplier Request:', { supplierId });

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
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

    // Validate supplier ID
    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID format', { supplierId });
      return NextResponse.json({ error: 'Supplier ID is invalid' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    if (!supplierResult?.status) {
      logMessage('warn', 'Supplier not found', { supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    const result = await softDeleteSupplier(Number(adminId), String(adminRole), supplierIdNum);  // Assuming softDeleteSupplier marks the supplier as deleted
    logMessage('info', `Soft delete request for supplier: ${supplierIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Supplier soft deleted successfully: ${supplierIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Supplier soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Supplier not found or could not be deleted: ${supplierIdNum}`, { adminId });
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