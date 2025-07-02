import { NextRequest, NextResponse } from 'next/server';
import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import {
  getSupplierById,
  updateSupplierVerifyStatus,
} from '@/app/models/supplier/supplier';
import { getEmailConfig } from '@/app/models/admin/emailConfig';
import { sendEmail } from "@/utils/email/sendEmail";
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

export async function PATCH(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const supplierId = parts[parts.length - 2]; // Get the supplier ID from the path
    const statusRaw = req.nextUrl.searchParams.get('status');

    logMessage('debug', 'PATCH Request - Supplier ID & Status:', { supplierId, statusRaw });

    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID', { adminIdHeader, adminRole });
      return NextResponse.json({ error: "Admin ID is missing or invalid" }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', 'Admin user not found', { adminId, adminRole });
      return NextResponse.json({ error: `Admin user not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

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

    const supplierIdNum = Number(supplierId);
    if (isNaN(supplierIdNum)) {
      logMessage('warn', 'Invalid supplier ID', { supplierId });
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplierResult = await getSupplierById(supplierIdNum);
    if (!supplierResult?.supplier) {
      logMessage('warn', 'Supplier not found', { supplierId: supplierIdNum });
      return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    }

    if (supplierResult.supplier.isVerified !== null && supplierResult.supplier.isVerified !== undefined) {
      return NextResponse.json(
        { status: false, message: 'Verification status already set' },
        { status: 400 }
      );
    }

    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);
    const updateResult = await updateSupplierVerifyStatus(adminId, String(adminRole), supplierIdNum, status);

    if (!updateResult?.status) {
      logMessage('warn', 'Failed to update supplier status', { supplierId: supplierIdNum });
      return NextResponse.json({ status: false, message: 'Failed to update supplier status' }, { status: 500 });
    }

    const emailConfigResult = await getEmailConfig('supplier', 'auth', 'status-update', true);
    const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = emailConfigResult;

    if (!emailStatus || !emailConfig) {
      logMessage('error', 'Email config fetch failed', { emailMessage });
      return NextResponse.json({ status: false, message: emailMessage || "Failed to fetch email configuration." }, { status: 500 });
    }

    const replacements: Record<string, string> = {
      "{{name}}": supplierResult.supplier.name || '',
      "{{email}}": supplierResult.supplier.email || '',
      "{{status}}": status ? 'Verified' : 'Rejected',
      "{{statusColor}}": status ? 'green' : 'red',
      "{{year}}": new Date().getFullYear().toString(),
      "{{appName}}": "Shipping OWL",
    };

    let htmlBody = htmlTemplate?.trim() || "<p>Dear {{name}},</p><p>Your account status is now {{status}}.</p>";
    let subject = emailSubject;

    Object.keys(replacements).forEach(key => {
      htmlBody = htmlBody.replace(new RegExp(key, 'g'), replacements[key]);
      subject = subject.replace(new RegExp(key, 'g'), replacements[key]);
    });

    const mailData = {
      recipient: [
        ...(emailConfig.to ?? [])
      ],
      cc: [
        ...(emailConfig.cc ?? [])
      ],
      bcc: [
        ...(emailConfig.bcc ?? [])
      ],
      subject,
      htmlBody,
      attachments: [],
    };

    // Step 2: Function to apply replacements in strings
    const replacePlaceholders = (text: string) => {
            if (typeof text !== "string") return text;
      return Object.keys(replacements).reduce((result, key) => {
        return result.replace(new RegExp(key, "g"), replacements[key]);
      }, text);
    };

    // Step 3: Apply replacements to recipient/cc/bcc fields
    if (Array.isArray(mailData.recipient) && mailData.recipient.length > 0) {
      mailData.recipient = mailData.recipient.map(({ name, email }) => ({
        name: replacePlaceholders(name),
        email: replacePlaceholders(email),
      }));
    }

    if (Array.isArray(mailData.cc) && mailData.cc.length > 0) {
      mailData.cc = mailData.cc.map(({ name, email }) => ({
        name: replacePlaceholders(name),
        email: replacePlaceholders(email),
      }));
    }

    if (Array.isArray(mailData.bcc) && mailData.bcc.length > 0) {
      mailData.bcc = mailData.bcc.map(({ name, email }) => ({
        name: replacePlaceholders(name),
        email: replacePlaceholders(email),
      }));
    }

    const emailResult = await sendEmail(emailConfig, mailData);

    if (!emailResult.status) {
      logMessage('error', 'Email sending failed', emailResult.error);
      return NextResponse.json({
        status: false,
        message: "Supplier status updated, but failed to send email notification.",
        emailError: emailResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      message: `Supplier status updated to ${status ? 'Active' : 'Inactive'}`,
    });
  } catch (error) {
    logMessage('error', 'Unexpected error in supplier PATCH route:', error);
    return NextResponse.json(
      { status: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
