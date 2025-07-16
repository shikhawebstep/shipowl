import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getTemplateById, updateTemplate } from '@/app/models/admin/emailConfig/template';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  // other optional properties if needed
}

interface AdminStaff {
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
  admin?: AdminStaff;
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
    // Extract templateId directly from the URL path
    const templateId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Template ID:', templateId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    //  let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      //  mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Mail',
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

    const templateIdNum = Number(templateId);
    if (isNaN(templateIdNum)) {
      logMessage('warn', 'Invalid template ID', { templateId });
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const templateResult = await getTemplateById(templateIdNum);
    if (templateResult?.status) {
      logMessage('info', 'Template found:', templateResult.mail);
      return NextResponse.json({ status: true, template: templateResult.mail }, { status: 200 });
    }

    logMessage('info', 'Template found:', templateResult.mail);
    return NextResponse.json({ status: false, message: 'Template not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single template:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract templateId directly from the URL path
    const templateId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Template ID:', templateId);

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

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Mail',
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

    const templateIdNum = Number(templateId);
    if (isNaN(templateIdNum)) {
      logMessage('warn', 'Invalid template ID', { templateId });
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const templateResult = await getTemplateById(templateIdNum);
    logMessage('debug', 'Template fetch result:', templateResult);
    if (!templateResult?.status) {
      logMessage('warn', 'Template not found', { templateIdNum });
      return NextResponse.json({ status: false, message: 'Template not found' }, { status: 404 });
    }

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['subject', 'html_template', 'status', 'to', 'cc', 'bcc'],
      patternValidations: {
        subject: 'string',
        html_template: 'string',
        status: 'boolean',
        to: 'string',
        cc: 'string',
        bcc: 'string'
      },
    });

    logMessage('debug', 'Form data received:', formData);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const extractString = (key: string) => (formData.get(key) as string) || null;
    const parseJsonArray = (field: string): { name: string; email: string }[] => {
      try {
        const val = formData.get(field);
        if (!val) return [];

        const parsed = JSON.parse(val.toString());
        if (!Array.isArray(parsed)) throw new Error('Not an array');

        // Ensure every object has 'name' and 'email'
        const validated = parsed.filter((item) =>
          item && typeof item === 'object' &&
          typeof item.name === 'string' &&
          typeof item.email === 'string'
        );

        return validated;
      } catch (err) {
        logMessage('warn', `Invalid JSON for field "${field}"`, err);
        return [];
      }
    };

    // Extract fields
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const smtp_secure_raw = formData.get('status')?.toString().toLowerCase();
    const smtp_secure = ['true', '1', true, 1, 'active', 'yes'].includes(smtp_secure_raw as string | number | boolean);

    const templatePayload = {
      subject: extractString('subject') || '',
      html_template: extractString('html_template') || '',
      to: JSON.stringify(parseJsonArray('to')),
      cc: JSON.stringify(parseJsonArray('cc')),
      bcc: JSON.stringify(parseJsonArray('bcc')),
      status,
      updatedBy: adminId,
      updatedAt: new Date(),
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'Template payload:', templatePayload);

    const templateCreateResult = await updateTemplate(adminId, String(adminRole), templateIdNum, templatePayload);

    if (templateCreateResult?.status) {
      logMessage('info', 'Template updated successfully:', templateCreateResult.mail);
      return NextResponse.json({ status: true, template: templateCreateResult.mail }, { status: 200 });
    }

    logMessage('error', 'Template update failed', templateCreateResult?.message);
    return NextResponse.json(
      { status: false, error: templateCreateResult?.message || 'Template creation failed' },
      { status: 500 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', '❌ Template Updation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error 6' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
