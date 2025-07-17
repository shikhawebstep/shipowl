import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getCompanyDeailByDropshipperId, removeCompanyDetailImageByIndex } from '@/app/models/dropshipper/company';

type ImageType = "gstDocument" | "panCardImage" | "aadharCardImage" | "additionalDocumentUpload" | "documentImage";

export async function DELETE(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    logMessage(`debug`, 'URL parts', parts);
    // const dropshipperId = Number(parts[parts.length - 5]);
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

    // Validate dropshipper headers
    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    if (!dropshipperId || isNaN(Number(dropshipperId))) {
      logMessage('warn', 'Missing or invalid dropshipper ID header', { dropshipperId });
      return NextResponse.json({ error: 'Dropshipper ID is missing or invalid' }, { status: 400 });
    }

    // Authenticate dropshipper user
    const userCheck = await isUserExist(Number(dropshipperId), String(dropshipperRole));
    if (!userCheck.status) {
      logMessage('warn', 'Dropshipper authentication failed', { dropshipperId, dropshipperRole });
      return NextResponse.json({ error: `Dropshipper not found: ${userCheck.message}` }, { status: 404 });
    }

    // Validate company existence
    const companyResult = await getCompanyDeailByDropshipperId(dropshipperId);
    if (!companyResult?.status) {
      logMessage('warn', 'Company not found', { companyId });
      return NextResponse.json({ status: false, message: 'Company not found' }, { status: 404 });
    }

    // Perform image removal
    const result = await removeCompanyDetailImageByIndex(companyId, dropshipperId, imageType, imageIndex);

    if (result.status) {
      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Profile',
          action: 'Update',
          data: result,
          response: {
            status: true,
            message: result.message || 'Image removed successfully',
            data: result.companyDetail,
          },
          status: true
        }, req);

      logMessage('info', `Image index ${imageIndex} removed from company ${companyId} by dropshipper ${dropshipperId}`);
      return NextResponse.json({
        status: true,
        message: result.message || 'Image removed successfully',
        data: result.companyDetail,
      }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Profile',
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
        panel: 'Dropshipper',
        module: 'Profile',
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
  return ["gstDocument", "panCardImage", "aadharCardImage", "additionalDocumentUpload", "documentImage"].includes(type);
}
