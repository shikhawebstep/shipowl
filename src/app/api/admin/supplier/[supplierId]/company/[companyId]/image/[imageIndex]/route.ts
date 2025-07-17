import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getCompanyDeailBySupplierId, removeCompanyDetailImageByIndex } from '@/app/models/supplier/company';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

type ImageType = "panCardImage" | "companyPanCardImage" | "gstDocument" | "additionalDocumentUpload" | "documentImage" | "aadharCardImage" | "profilePicture";

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    logMessage(`debug`, 'URL parts', parts);
    const supplierId = Number(parts[parts.length - 5]);
    const companyId = Number(parts[parts.length - 3]);
    const imageIndex = Number(parts[parts.length - 1]);

    // Extract the query parameter 'type'
    const imageType = req.nextUrl.searchParams.get('type');

    // Ensure imageType is valid
    if (!imageType || !isValidImageType(imageType)) {
      logMessage('warn', 'Invalid or missing image type', { imageType });
      return NextResponse.json({ error: 'Invalid or missing image type' }, { status: 400 });
    }

    logMessage('debug', `Attempting to delete image (${imageIndex}) from company (${companyId})`);

    // Validate admin headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Missing or invalid admin ID header', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Authenticate admin user
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', 'Admin authentication failed', { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Supplier',
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

    // Validate company existence
    const companyResult = await getCompanyDeailBySupplierId(supplierId);
    if (!companyResult?.status) {
      logMessage('warn', 'Company not found', { companyId });
      return NextResponse.json({ status: false, message: 'Company not found' }, { status: 404 });
    }

    // Perform image removal
    const result = await removeCompanyDetailImageByIndex(companyId, supplierId, imageType, imageIndex);

    if (result.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Supplier',
          action: 'Update',
          data: result,
          response: {
            status: true,
            message: result.message || 'Image removed successfully',
            data: result.companyDetail,
          },
          status: false
        }, req);

      logMessage('info', `Image index ${imageIndex} removed from company ${companyId} by admin ${adminId}`);
      return NextResponse.json({
        status: true,
        message: result.message || 'Image removed successfully',
        data: result.companyDetail,
      }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Supplier',
        action: 'Update',
        data: result,
        response: {
          status: false,
          message: result.message || 'Image removal failed',
        },
        status: false
      }, req);

    logMessage('warn', `Image removal failed: ${result.message}`, { companyId, imageIndex });
    return NextResponse.json({
      status: false,
      message: result.message || 'Image removal failed',
    }, { status: 400 });

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Supplier',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Unexpected error during image deletion', { error });
    return NextResponse.json({
      status: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// Helper function to check if imageType is valid
function isValidImageType(type: string): type is ImageType {
  return ["panCardImage", "companyPanCardImage", "gstDocument", "additionalDocumentUpload", "documentImage", "aadharCardImage", "profilePicture"].includes(type);
}
