import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getEmailConfigById, updateEmailConfig } from '@/app/models/admin/emailConfig';
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
  role: string;
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
    // Extract emailConfigId directly from the URL path
    const emailConfigId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested EmailConfig ID:', emailConfigId);

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

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

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

    const emailConfigIdNum = Number(emailConfigId);
    if (isNaN(emailConfigIdNum)) {
      logMessage('warn', 'Invalid emailConfig ID', { emailConfigId });
      return NextResponse.json({ error: 'Invalid emailConfig ID' }, { status: 400 });
    }

    const emailConfigResult = await getEmailConfigById(emailConfigIdNum);
    if (emailConfigResult?.status) {
      logMessage('info', 'EmailConfig found:', emailConfigResult.mail);
      return NextResponse.json({ status: true, emailConfig: emailConfigResult.mail }, { status: 200 });
    }

    logMessage('info', 'EmailConfig found:', emailConfigResult.mail);
    return NextResponse.json({ status: false, message: 'EmailConfig not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single emailConfig:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract emailConfigId directly from the URL path
    const emailConfigId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested EmailConfig ID:', emailConfigId);

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

    const emailConfigIdNum = Number(emailConfigId);
    if (isNaN(emailConfigIdNum)) {
      logMessage('warn', 'Invalid emailConfig ID', { emailConfigId });
      return NextResponse.json({ error: 'Invalid emailConfig ID' }, { status: 400 });
    }

    const emailConfigResult = await getEmailConfigById(emailConfigIdNum);
    logMessage('debug', 'EmailConfig fetch result:', emailConfigResult);
    if (!emailConfigResult?.status) {
      logMessage('warn', 'EmailConfig not found', { emailConfigIdNum });
      return NextResponse.json({ status: false, message: 'EmailConfig not found' }, { status: 404 });
    }

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['subject', 'html_template', 'smtp_host', 'smtp_secure', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name', 'status', 'to', 'cc', 'bcc'],
      patternValidations: {
        subject: 'string',
        html_template: 'string',
        smtp_host: 'string',
        smtp_secure: 'boolean',
        smtp_port: 'number',
        smtp_username: 'string',
        smtp_password: 'string',
        from_email: 'string',
        from_name: 'string',
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

    const emailConfigPayload = {
      subject: extractString('subject') || '',
      html_template: extractString('html_template') || '',
      smtp_host: extractString('smtp_host') || '',
      smtp_secure: smtp_secure,
      smtp_port: parseInt(extractString('smtp_port') || '0'), // optional: convert to number if needed
      smtp_username: extractString('smtp_username') || '',
      smtp_password: extractString('smtp_password') || '',
      from_email: extractString('from_email') || '',
      from_name: extractString('from_name') || '',
      to: JSON.stringify(parseJsonArray('to')),
      cc: JSON.stringify(parseJsonArray('cc')),
      bcc: JSON.stringify(parseJsonArray('bcc')),
      status,
      updatedBy: adminId,
      updatedAt: new Date(),
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'EmailConfig payload:', emailConfigPayload);

    const emailConfigCreateResult = await updateEmailConfig(adminId, String(adminRole), emailConfigIdNum, emailConfigPayload);

    if (emailConfigCreateResult?.status) {
      logMessage('info', 'EmailConfig updated successfully:', emailConfigCreateResult.mail);
      return NextResponse.json({ status: true, emailConfig: emailConfigCreateResult.mail }, { status: 200 });
    }

    logMessage('error', 'EmailConfig update failed', emailConfigCreateResult?.message);
    return NextResponse.json(
      { status: false, error: emailConfigCreateResult?.message || 'EmailConfig creation failed' },
      { status: 500 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', '❌ EmailConfig Updation Error:', error);
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
