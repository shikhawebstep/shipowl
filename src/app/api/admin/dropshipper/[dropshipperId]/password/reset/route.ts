import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/utils/email/sendEmail';
import bcrypt from 'bcryptjs';
import { ActivityLog, logMessage } from '@/utils/commonUtils';
import { getDropshipperById } from '@/app/models/dropshipper/dropshipper';
import { isUserExist } from '@/utils/auth/authUtils';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getTemplate } from '@/app/models/admin/emailConfig/template';

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface DropshipperStaff {
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
    admin?: DropshipperStaff;
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

        const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));
        if (isStaff) {
            const permissionCheck = await checkStaffPermissionStatus(
                { panel: 'Admin', module: 'Dropshipper', action: 'Password Change' },
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
        const dropshipperId = Number(parts[parts.length - 3]);

        const dropshipperResult = await getDropshipperById(dropshipperId);
        if (!dropshipperResult?.status || !dropshipperResult.dropshipper) {
            logMessage('warn', 'Dropshipper not found', { dropshipperId });
            return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
        }

        const dropshipper = dropshipperResult.dropshipper;

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

        await prisma.admin.update({
            where: { id: dropshipper.id },
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
        } = await getTemplate('admin', 'dropshipper', 'password-change', true);

        logMessage('debug', 'Email Config:', emailConfig);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { status: false, message: emailMessage || 'Failed to fetch email configuration.' },
                { status: 500 }
            );
        }

        const replacements: Record<string, string> = {
            '{{name}}': dropshipper.name,
            '{{email}}': dropshipper.email,
            '{{password}}': password,
            '{{year}}': new Date().getFullYear().toString(),
            '{{appName}}': 'ShipOwl',
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : '<p>Dear {{name}},</p><p>Your password has been successfully changed by the admin.</p>';

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
            await ActivityLog(
                {
                    panel: 'Admin',
                    module: 'Dropshipper',
                    action: 'Password Reset',
                    data: emailResult,
                    response: {
                        status: true,
                        message: 'Password changed successfully. A confirmation email has been sent.',
                    },
                    status: false
                }, req);

            return NextResponse.json(
                {
                    status: false,
                    message: 'Password changed successfully, but failed to send email notification.',
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        await ActivityLog(
            {
                panel: 'Admin',
                module: 'Dropshipper',
                action: 'Password Reset',
                data: emailResult,
                response: {
                    status: true,
                    message: 'Password changed successfully. A confirmation email has been sent.',
                },
                status: true
            }, req);

        return NextResponse.json(
            {
                status: true,
                message: 'Password changed successfully. A confirmation email has been sent.',
            },
            { status: 200 }
        );
    } catch (error) {
        await ActivityLog(
            {
                panel: 'Admin',
                module: 'Dropshipper',
                action: 'Password Reset',
                data: { oneLineSimpleMessage: error || 'Internal Server Error' },
                response: {
                    status: false,
                    error,
                    message: 'An unexpected error occurred while changing the password. Please try again later.',
                },
                status: false
            }, req);

        logMessage(`error`, `Password change error:`, error);
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
