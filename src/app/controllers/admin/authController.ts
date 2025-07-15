import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { generateToken, generatePasswordResetToken } from '@/utils/auth/authUtils';
import { comparePassword } from '@/utils/hashUtils';
import { verifyToken } from '@/utils/auth/authUtils';
import { getTemplate } from '@/app/models/admin/emailConfig/template';
import { sendEmail } from "@/utils/email/sendEmail";
import bcrypt from 'bcryptjs';
import { logMessage } from '@/utils/commonUtils';
import { getRolePermissionsByStaffId } from '@/app/models/staffPermission';

interface Admin {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

export async function handleLogin(req: NextRequest, adminRole: string, adminStaffRole: string) {
    try {
        const { email, password } = await req.json();

        // Hash the password using bcrypt
        const salt = await bcrypt.genSalt(10); // Generates a salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log(`Hashed Password: ${hashedPassword}`); // Log the hashed password

        // Fetch admin by email and role
        let type = 'main';
        logMessage(`log`, `adminRole - `, adminRole);
        let adminResponse = await adminByUsernameRole(email, adminRole);
        if (!adminResponse.status || !adminResponse.admin) {
            adminResponse = await adminByUsernameRole(email, adminStaffRole);
            type = 'sub';
            if (!adminResponse.status || !adminResponse.admin) {
                return NextResponse.json(
                    { message: adminResponse.message || "Invalid email or password", type, status: false },
                    { status: 401 }
                );
            }
        }

        const admin = adminResponse.admin;

        let adminData = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: type === 'main'
                ? (admin as { role: string }).role
                : (admin as { panel: string }).panel
        };

        console.log(`admin - `, admin);

        // Correct usage of .toLowerCase() as a function
        if (admin.status.toLowerCase() !== 'active') {
            return NextResponse.json(
                { message: "Admin account is not active", status: false },
                { status: 403 }
            );
        }

        // Compare the provided password with the stored hash
        const isPasswordValid = await comparePassword(password, admin.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid email or password 2', status: false }, { status: 401 });
        }

        // Email & account verification checks for supplier
        if (type === 'main' && adminData.role === 'supplier') {
            if ('isEmailVerified' in admin && !admin?.isEmailVerified) {
                return NextResponse.json(
                    { status: false, message: "Email is not verified yet" },
                    { status: 403 }
                );
            }

            if ('isVerified' in admin && !admin?.isVerified) {
                return NextResponse.json(
                    { status: false, message: "Your account has not been verified by admin" },
                    { status: 403 }
                );
            }

            // Safely assign companyName to adminData if it exists
            if ('companyDetail' in admin && admin.companyDetail?.companyName) {
                (adminData as any).companyName = admin.companyDetail.companyName;
            }
        }

        if (type === 'sub' && 'admin' in admin && adminData?.role === 'supplier') {
            const mainAdmin = admin.admin as {
                isEmailVerified: boolean;
                isVerified: boolean;
            };

            if (!mainAdmin.isEmailVerified) {
                return NextResponse.json(
                    { status: false, message: "Main account's email is not verified yet" },
                    { status: 403 }
                );
            }

            if (!mainAdmin.isVerified) {
                return NextResponse.json(
                    { status: false, message: "Main account is not yet verified by admin" },
                    { status: 403 }
                );
            }
        }

        // Generate authentication token
        const token = generateToken(admin.id, adminData.role);
        const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminData.role));

        let assignedPermissions;
        if (isStaffUser && 'admin' in admin) {
            const role = String(adminData.role);
            const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
            const options = {
                panel: formattedRole
            };

            const assignedPermissionsResult = await getRolePermissionsByStaffId(options, admin.id);
            assignedPermissions = assignedPermissionsResult.assignedPermissions;
        }

        return NextResponse.json({
            message: "Login successful",
            token,
            admin: adminData,
            assignedPermissions
        });
    } catch (error) {
        console.error(`Error during login:`, error);
        return NextResponse.json({ message: "Internal Server Error", status: false }, { status: 500 });
    }
}

export async function handleVerifyLogin(req: NextRequest, adminRole: string, adminStaffRole: string) {
    try {
        // Extract token from Authorization header
        const token = req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ message: 'No token provided', status: false }, { status: 401 });
        }

        // Use adminByToken to verify token and fetch admin details
        const { status, message, admin } = await adminByToken(token, adminRole, adminStaffRole);

        if (!status) {
            return NextResponse.json({ message: message || "Invalid email or password 3", status: false }, { status: 401 });
        }

        return NextResponse.json({ message: "Token is valid", admin, status: true });
    } catch (error) {
        console.error(`error - `, error);
        return NextResponse.json({ message: "Internal Server Error", status: false }, { status: 500 });
    }
}

export async function handleForgetPassword(
    req: NextRequest,
    panel: string,
    adminRole: string,
    adminStaffRole: string
) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required.", status: false },
                { status: 400 }
            );
        }

        // Fetch admin by email and role
        let type = 'main';
        let adminResponse = await adminByUsernameRole(email, adminRole);
        if (!adminResponse.status || !adminResponse.admin) {
            adminResponse = await adminByUsernameRole(email, adminStaffRole);
            type = 'sub';
            if (!adminResponse.status || !adminResponse.admin) {
                return NextResponse.json(
                    { message: adminResponse.message || "No account found with this email.", type, status: false },
                    { status: 401 }
                );
            }
        }

        const admin = adminResponse.admin;

        let adminData = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: type === 'main'
                ? (admin as { role: string }).role
                : (admin as { panel: string }).panel
        };

        const token = generatePasswordResetToken(admin.id, adminData.role);
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update token and expiry in database
        const updateData = {
            pr_token: token,
            pr_expires_at: expiry,
        };

        if (adminData.role === adminRole) {
            await prisma.admin.update({ where: { id: admin.id }, data: updateData });
        } else {
            await prisma.adminStaff.update({ where: { id: admin.id }, data: updateData });
        }

        // Optional: Send email
        // await sendPasswordResetEmail(admin.email, token);
        const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = await getTemplate("admin", "auth", "forget-password", true);
        logMessage('debug', 'Email Config:', emailConfig);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { message: emailMessage || "Failed to fetch email configuration.", status: false },
                { status: 500 }
            );
        }

        let urlPanel;
        if (panel == 'dropshipper') {
            urlPanel = `https://shipowl.io/dropshipping/auth/password/reset?token=${token}`;
        } else {
            urlPanel = `https://shipowl.io/${panel}/auth/password/reset?token=${token}`;
        }

        // Use index signature to avoid TS error
        const replacements: Record<string, string> = {
            "{{name}}": admin.name,
            "{{email}}": admin.email,
            "{{resetUrl}}": urlPanel,
            "{{year}}": new Date().getFullYear().toString(),
            "{{appName}}": "Shipping OWL",
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : "<p>Dear {{name}},</p><p>Click <a href='{{resetUrl}}'>here</a> to reset your password.</p>";

        Object.keys(replacements).forEach((key) => {
            htmlBody = htmlBody.replace(new RegExp(key, "g"), replacements[key]);
        });

        logMessage('debug', 'HTML Body:', htmlBody);

        let subject = emailSubject;
        Object.keys(replacements).forEach((key) => {
            subject = subject.replace(new RegExp(key, "g"), replacements[key]);
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

        console.log(`mailData - `, mailData);

        const emailResult = await sendEmail(emailConfig, mailData);

        if (!emailResult.status) {
            return NextResponse.json(
                {
                    message: "Reset token created but failed to send email. Please try again.",
                    status: false,
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: "Password reset link has been sent to your email.",
                status: true,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Forgot password error:", error);
        return NextResponse.json(
            { message: "Something went wrong. Please try again later.", status: false },
            { status: 500 }
        );
    }
}

export async function handleResetPassword(
    req: NextRequest,
    adminRole: string,
    adminStaffRole: string
) {
    try {
        const { token, password } = await req.json();

        // Check if token is provided
        if (!token) {
            return NextResponse.json(
                { message: "Token is required.", status: false },
                { status: 400 }
            );
        }

        // Verify token and fetch admin details using adminByToken function
        const { status: tokenStatus, message: tokenMessage, admin } = await adminByToken(token, adminRole, adminStaffRole);

        if (!tokenStatus || !admin) {
            return NextResponse.json(
                { status: false, message: tokenMessage || "Invalid token or role." },
                { status: 401 }
            );
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

        // Prepare the update data
        const updateData = {
            pr_token: null,
            pr_expires_at: null,
            pr_last_reset: new Date(),
            password: hashedPassword,
        };

        // Update the admin or admin staff record based on the role
        if (admin.role === adminRole) {
            await prisma.admin.update({
                where: { id: admin.id },
                data: updateData,
            });
        } else {
            await prisma.adminStaff.update({
                where: { id: admin.id },
                data: updateData,
            });
        }

        const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = await getTemplate("admin", "auth", "reset-password", true);
        logMessage('debug', 'Email Config:', emailConfig);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { message: emailMessage || "Failed to fetch email configuration.", status: false },
                { status: 500 }
            );
        }

        // Use index signature to avoid TS error
        const replacements: Record<string, string> = {
            "{{name}}": admin.name,
            "{{email}}": admin.email,
            "{{year}}": new Date().getFullYear().toString(),
            "{{appName}}": "Shipping OWL",
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : "<p>Dear {{name}},</p><p>Your password has been reset successfully.</p>";

        // Replace placeholders in the HTML template
        Object.keys(replacements).forEach((key) => {
            htmlBody = htmlBody.replace(new RegExp(key, "g"), replacements[key]);
        });

        let subject = emailSubject;
        Object.keys(replacements).forEach((key) => {
            subject = subject.replace(new RegExp(key, "g"), replacements[key]);
        });

        logMessage('debug', 'HTML Body:', htmlBody);
        logMessage('debug', 'emailConfig:', emailConfig);

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

        // Send email notification
        const emailResult = await sendEmail(emailConfig, mailData);

        if (!emailResult.status) {
            return NextResponse.json(
                {
                    message: "Password reset successful, but failed to send email notification.",
                    status: false,
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        // Return success response
        return NextResponse.json(
            {
                message: "Password reset successful. A notification has been sent to your email.",
                status: true,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Password reset error:", error);
        return NextResponse.json(
            { message: "An error occurred while resetting the password. Please try again later.", status: false },
            { status: 500 }
        );
    }
}

export async function handleVerifyStatus(
    req: NextRequest,
    adminRole: string,
    adminStaffRole: string
) {
    try {
        const { token } = await req.json();

        // Check if token is provided
        if (!token) {
            return NextResponse.json(
                { message: "Token is required.", status: false },
                { status: 400 }
            );
        }

        // Verify token and fetch admin details using adminByToken function
        const { status: tokenStatus, message: tokenMessage, admin } = await adminByToken(token, adminRole, adminStaffRole);

        if (!tokenStatus || !admin) {
            return NextResponse.json(
                { status: false, message: tokenMessage || "Invalid token or role." },
                { status: 401 }
            );
        }

        let loginLink;

        // Update the admin or admin staff record based on the role
        if (adminRole == 'supplier') {
            // Prepare the update data
            const updateAdminData = {
                isEmailVerified: true,
                emailVerifiedAt: new Date()
            };

            const updateStaffData = {
                status: 'active'
            };

            if (admin.role === adminRole) {
                await prisma.admin.update({
                    where: { id: admin.id },
                    data: updateAdminData,
                });
            } else {
                await prisma.adminStaff.update({
                    where: { id: admin.id },
                    data: updateStaffData,
                });
            }
            loginLink = `https://shipowl.io/supplier/auth/login`;
        } else if (adminRole == 'dropshipper') {
            // Prepare the update data
            const updateData = {
                status: 'active'
            };

            if (admin.role === adminRole) {
                await prisma.admin.update({
                    where: { id: admin.id },
                    data: updateData,
                });
            } else {
                await prisma.adminStaff.update({
                    where: { id: admin.id },
                    data: updateData,
                });
            }
            loginLink = `https://shipowl.io/dropshipping/auth/login`;

        } else {
            return NextResponse.json(
                { status: false, message: "Role is not supproted for this action" },
                { status: 500 }
            );
        }

        const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = await getTemplate(adminRole, 'auth', 'verify', true);
        logMessage('debug', 'Email Config:', emailConfig);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { message: emailMessage || "Failed to fetch email configuration.", status: false },
                { status: 500 }
            );
        }

        // Use index signature to avoid TS error
        const replacements: Record<string, string> = {
            "{{name}}": admin.name,
            "{{email}}": admin.email,
            "{{year}}": new Date().getFullYear().toString(),
            "{{loginLink}}": loginLink,
            "{{appName}}": "Shipping OWL",
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : "<p>Dear {{name}},</p><p>Your account has been verified successfully.</p>";

        // Replace placeholders in the HTML template
        Object.keys(replacements).forEach((key) => {
            htmlBody = htmlBody.replace(new RegExp(key, "g"), replacements[key]);
        });

        let subject = emailSubject;
        Object.keys(replacements).forEach((key) => {
            subject = subject.replace(new RegExp(key, "g"), replacements[key]);
        });

        logMessage('debug', 'HTML Body:', htmlBody);

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

        // Send email notification
        const emailResult = await sendEmail(emailConfig, mailData);

        if (!emailResult.status) {
            return NextResponse.json(
                {
                    message: "Account Verified successful, but failed to send email notification.",
                    status: false,
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        // Return success response
        return NextResponse.json(
            {
                message: "Account Verified successful. A notification has been sent to your email.",
                status: true,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Account Verified error:", error);
        return NextResponse.json(
            { message: "An error occurred while verifing the account. Please try again later.", status: false },
            { status: 500 }
        );
    }
}

export async function adminByUsernameRole(username: string, panel: string) {
    try {
        console.log("Function called: adminByUsernameRole");
        console.log("Input username:", username);
        console.log("Input panel:", panel);

        const adminRoleStr = String(panel); // Ensure it's a string
        const adminModel = ["admin", "dropshipper", "supplier"].includes(adminRoleStr) ? "admin" : "adminStaff";
        console.log("Resolved adminModel:", adminModel);

        let admin;

        if (adminModel === "admin") {
            console.log("Fetching from: prisma.admin");
            admin = await prisma.admin.findFirst({
                where: { email: username, role: panel },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    isEmailVerified: true,
                    companyDetail: {
                        select: {
                            companyName: true
                        }
                    }
                },
            });
            console.log("Admin result from prisma.admin:", admin);
        } else {
            console.log("Fetching from: prisma.adminStaff");
            admin = await prisma.adminStaff.findFirst({
                where: { email: username, panel: panel },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    role: true,
                    panel: true,
                    status: true,
                    admin: true
                },
            });
            console.log("Admin result from prisma.adminStaff:", admin);
        }

        if (!admin) {
            console.warn("No admin found for provided credentials.");
            return { status: false, message: "User with the provided ID does not exist" };
        }

        console.log("Admin fetched successfully.");
        return { status: true, admin };
    } catch (error) {
        console.error("Error fetching admin:", error);
        return { status: false, message: "Internal Server Error" };
    }
}

export async function adminByToken(
    token: string,
    adminRole: string,
    adminStaffRole: string
) {
    try {
        // Verify token and extract admin details
        const { payload, status, message } = await verifyToken(token);

        if (!status || !payload || typeof payload.adminId !== 'number') {
            return {
                status: false,
                message: message || "Unauthorized access. Invalid token."
            };
        }

        // Ensure adminRole is a string
        const payloadAdminRole = String(payload.adminRole);

        if (![adminRole, adminStaffRole].includes(payloadAdminRole)) {
            return {
                status: false,
                message: "Access denied. Invalid panel."
            };
        }

        // Determine model based on role
        const isMainAdmin = ["admin", "dropshipper", "supplier"].includes(payloadAdminRole);
        const adminModel = isMainAdmin ? "admin" : "adminStaff";

        let rawAdmin: any;

        if (adminModel === "admin") {
            rawAdmin = await prisma.admin.findUnique({
                where: { id: payload.adminId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    role: true
                }
            });
        } else {
            rawAdmin = await prisma.adminStaff.findUnique({
                where: { id: payload.adminId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    role: {
                        select: {
                            name: true
                        }
                    }
                }
            });
        }

        if (!rawAdmin) {
            return {
                status: false,
                message: "Invalid admin credentials or account not found."
            };
        }

        // Map to match Admin type
        const admin: Admin = {
            id: rawAdmin.id,
            name: rawAdmin.name,
            email: rawAdmin.email,
            createdAt: rawAdmin.createdAt,
            role: rawAdmin.role?.name || ''
        };

        return {
            status: true,
            message: "Token is valid",
            admin
        };
    } catch (error) {
        console.error("Error fetching admin:", error);
        return {
            status: false,
            message: "Internal Server Error"
        };
    }
}