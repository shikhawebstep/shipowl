import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getSMTPConfig, updateSMTPConfig } from '@/app/models/admin/emailConfig/smtp';
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

    const SMTPConfigResult = await getSMTPConfig();
    if (SMTPConfigResult?.status) {
      logMessage('info', 'SMTPConfig found:', SMTPConfigResult.smtp);
      return NextResponse.json({ status: true, smtp: SMTPConfigResult.smtp }, { status: 200 });
    }

    logMessage('info', 'SMTPConfig found:', SMTPConfigResult.smtp);
    return NextResponse.json({ status: false, message: 'SMTPConfig not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single SMTPConfig:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const formData = await req.formData();

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['smtp_host', 'smtp_secure', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name'],
      patternValidations: {
        smtp_host: 'string',
        smtp_secure: 'boolean',
        smtp_port: 'number',
        smtp_username: 'string',
        smtp_password: 'string',
        from_email: 'string',
        from_name: 'string'
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

    const SMTPConfigPayload = {
      smtp_host: extractString('smtp_host') || '',
      smtp_secure: smtp_secure,
      smtp_port: parseInt(extractString('smtp_port') || '0'), // optional: convert to number if needed
      smtp_username: extractString('smtp_username') || '',
      smtp_password: extractString('smtp_password') || '',
      from_email: extractString('from_email') || '',
      from_name: extractString('from_name') || '',
      updatedBy: adminId,
      updatedAt: new Date(),
      updatedByRole: adminRole || '',
    };

    logMessage('info', 'SMTPConfig payload:', SMTPConfigPayload);

    const SMTPConfigCreateResult = await updateSMTPConfig(adminId, String(adminRole), SMTPConfigPayload);

    if (SMTPConfigCreateResult?.status) {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Mail',
          action: 'Update',
          data: SMTPConfigCreateResult,
          response: { status: true, SMTPConfig: SMTPConfigCreateResult.message },
          status: true
        }, req);

      logMessage('info', 'SMTPConfig updated successfully:', SMTPConfigCreateResult.message);
      return NextResponse.json({ status: true, SMTPConfig: SMTPConfigCreateResult.message }, { status: 200 });
    }

    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Mail',
        action: 'Update',
        data: SMTPConfigCreateResult,
        response: { status: false, error: SMTPConfigCreateResult?.message || 'SMTPConfig creation failed' },
        status: false
      }, req);

    logMessage('error', 'SMTPConfig update failed', SMTPConfigCreateResult?.message);
    return NextResponse.json(
      { status: false, error: SMTPConfigCreateResult?.message || 'SMTPConfig creation failed' },
      { status: 500 }
    );
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Mail',
        action: 'Update',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error, message: 'Internal Server Error 6' },
        status: false
      }, req);

    // Log and handle any unexpected errors
    logMessage('error', '❌ SMTPConfig Updation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
