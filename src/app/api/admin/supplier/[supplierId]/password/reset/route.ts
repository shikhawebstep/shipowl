import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/utils/email/sendEmail';
import bcrypt from 'bcryptjs';
import { logMessage } from '@/utils/commonUtils';
import { getSupplierById } from '@/app/models/supplier/supplier';
import { isUserExist } from '@/utils/auth/authUtils';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getEmailConfig } from '@/app/models/admin/emailConfig';

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role: string;
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

export async function POST(req: NextRequest) {
    try {
        const adminIdHeader = req.headers.get('x-admin-id');
        const adminRole = req.headers.get('x-admin-role');

        logMessage('info', 'Admin headers received', { adminIdHeader, adminRole });

        const adminId = Number(adminIdHeader);
        if (!adminIdHeader || isNaN(adminId)) {
            logMessage('warn', 'Invalid admin ID', { adminIdHeader });
            return NextResponse.json({ status: false, error: 'Invalid or missing admin ID' }, { status: 400 });
        }

        const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
        if (!userCheck.status) {
            logMessage('warn', 'User not found', { adminId, adminRole });
            return NextResponse.json({ status: false, error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));
        if (isStaff) {
            const permissionCheck = await checkStaffPermissionStatus(
                { panel: 'Admin', module: 'Supplier', action: 'Password Change' },
                adminId
            );

            logMessage('info', 'Staff permission check result', permissionCheck);

            if (!permissionCheck.status) {
                return NextResponse.json(
                    {
                        status: false,
                        message: permissionCheck.message || 'You do not have permission to perform this action.',
                    },
                    { status: 403 }
                );
            }
        }

        const { password } = await req.json();

        const parts = req.nextUrl.pathname.split('/');
        const supplierId = Number(parts[parts.length - 3]);

        const supplierResult = await getSupplierById(supplierId);
        if (!supplierResult?.status || !supplierResult.supplier) {
            logMessage('warn', 'Supplier not found', { supplierId });
            return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
        }

        const supplier = supplierResult.supplier;

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

        await prisma.admin.update({
            where: { id: supplier.id },
            data: {
                pr_token: null,
                pr_expires_at: null,
                pr_last_reset: new Date(),
                password: hashedPassword,
            },
        });

        const {
            status: emailStatus,
            message: emailMessage,
            emailConfig,
            htmlTemplate,
            subject: emailSubject
        } = await getEmailConfig('admin', 'supplier', 'password-change', true);

        logMessage('debug', 'Email Config:', emailConfig);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { status: false, message: emailMessage || 'Failed to fetch email configuration.' },
                { status: 500 }
            );
        }

        const replacements: Record<string, string> = {
            '{{name}}': supplier.name,
            '{{email}}': supplier.email,
            '{{password}}': password,
            '{{year}}': new Date().getFullYear().toString(),
            '{{appName}}': 'Shipping OWL',
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : '<p>Dear {{supplierName}},</p><p>Your password has been successfully changed by the admin.</p>';

        for (const key in replacements) {
            htmlBody = htmlBody.replace(new RegExp(key, 'g'), replacements[key]);
        }

        let subject = emailSubject || 'Password Change Notification';
        for (const key in replacements) {
            subject = subject.replace(new RegExp(key, 'g'), replacements[key]);
        }

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
            return NextResponse.json(
                {
                    status: false,
                    message: 'Password changed successfully, but failed to send email notification.',
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                status: true,
                message: 'Password changed successfully. A confirmation email has been sent.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Password change error:', error);
        return NextResponse.json(
            {
                status: false,
                error,
                message: 'An unexpected error occurred while changing the password. Please try again later.',
            },
            { status: 500 }
        );
    }
}
