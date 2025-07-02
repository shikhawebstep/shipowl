import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage, formatDate } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { saveFilesFromFormData } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getOrderById } from '@/app/models/order/order';
import { orderDisputeCaseTwo } from '@/app/models/order/item';
import { getEmailConfig } from '@/app/models/admin/emailConfig';
import { sendEmail } from '@/utils/email/sendEmail';

interface UploadedFile {
    url: string;
}

export async function POST(req: NextRequest) {
    try {
        // Extract and validate supplier ID and role headers
        const supplierIdHeader = req.headers.get('x-supplier-id');
        const supplierRole = req.headers.get('x-supplier-role');
        const supplierId = Number(supplierIdHeader);

        if (!supplierIdHeader || isNaN(supplierId)) {
            logMessage('warn', `Invalid or missing supplier ID: ${supplierIdHeader}`);
            return NextResponse.json(
                { error: 'Supplier ID is missing or invalid. Please provide a valid supplier ID.' },
                { status: 400 }
            );
        }

        // Verify user existence
        const userCheck = await isUserExist(supplierId, String(supplierRole));
        if (!userCheck.status) {
            logMessage('warn', `User verification failed: ${userCheck.message}`);
            return NextResponse.json(
                { error: `User not found or unauthorized: ${userCheck.message}` },
                { status: 404 }
            );
        }

        // TODO: Replace hardcoded IDs with dynamic values as needed
        const parts = req.nextUrl.pathname.split('/');
        const orderId = Number(parts[parts.length - 2]);

        // Fetch order and order itemW
        const orderResult = await getOrderById(orderId);

        if (!orderResult.status || !orderResult.order) {
            logMessage('warn', `Order not found or inaccessible. Order ID: ${orderId}`);
            return NextResponse.json(
                { status: false, message: 'Order not found or you do not have permission to access it.' },
                { status: 404 }
            );
        }

        /*
            const order = orderResult.order;
            const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (order.rtoDelivered && order.rtoDeliveredDate) {
                const rtoDeliveredTime = new Date(order.rtoDeliveredDate).getTime();
                const now = Date.now();

                if (now - rtoDeliveredTime > ONE_DAY_MS) {
                    logMessage('warn', `Dispute period expired for order item ID: ${orderId}`);
                    return NextResponse.json(
                        { status: false, message: 'Dispute period of 24 hours has expired; you cannot dispute now.' },
                        { status: 400 }
                    );
                }
            }
        */

        // Validate input
        const formData = await req.formData();
        const validation = validateFormData(formData, {
            requiredFields: ['status'],
            patternValidations: {
                status: 'string',
            },
        });

        if (!validation.isValid) {
            logMessage('warn', 'Form validation failed', validation.error);
            return NextResponse.json(
                { status: false, error: validation.error, message: validation.message },
                { status: 400 }
            );
        }

        const status = formData.get('status') as string;

        const allowedStatuses = ['received', 'not received', 'wrong item received'];

        if (!status || !allowedStatuses.includes(status.toLowerCase())) {
            logMessage('warn', `Invalid status received: ${status}`);
            return NextResponse.json(
                {
                    error: `Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}.`,
                },
                { status: 400 }
            );
        }

        // Handle media uploads if status is "wrong item received"
        let uploadedMedia: Record<string, string> = {};

        if (status.toLowerCase() === 'wrong item received') {

            const packingFiles = await saveFilesFromFormData(formData, 'packingGallery', {
                dir: path.join(process.cwd(), 'tmp', 'uploads', 'order', orderResult.order.orderNumber, 'packing-gallery'),
                pattern: 'slug-unique',
                multiple: true,
            });

            const unboxingFiles = await saveFilesFromFormData(formData, 'unboxingGallery', {
                dir: path.join(process.cwd(), 'tmp', 'uploads', 'order', orderResult.order.orderNumber, 'unboxing-gallery'),
                pattern: 'slug-unique',
                multiple: true,
            });

            if (
                !Array.isArray(packingFiles) ||
                !Array.isArray(unboxingFiles) ||
                (Array.isArray(packingFiles) && packingFiles.length === 0) ||
                (Array.isArray(unboxingFiles) && unboxingFiles.length === 0)
            ) {
                return NextResponse.json(
                    {
                        error: 'Media upload required.',
                        message:
                            'Please upload files for both packingGallery and unboxingGallery when status is "wrong item received".',
                    },
                    { status: 400 }
                );
            }

            uploadedMedia = {
                packingGallery: packingFiles.map((file: UploadedFile) => file.url).join(','),
                unboxingGallery: unboxingFiles.map((file: UploadedFile) => file.url).join(','),
            };

            logMessage('info', 'Packing and unboxing media URLs recorded successfully.');
        }

        // Prepare payload for update
        const orderItemRTOPayload = {
            orderId,
            status,
            uploadedMedia,
        };

        const result = await orderDisputeCaseTwo(orderItemRTOPayload);

        if (!result.status) {
            logMessage('error', `Failed to update order item status: ${result.message}`);
            return NextResponse.json(
                { error: `Failed to update order item status: ${result.message}` },
                { status: 400 }
            );
        }

        // Finalized dispute data
        const finalOrders = [
            {
                orderNumber: orderResult.order.orderNumber,
                awbNumber: orderResult.order.awbNumber,
                rtoDeliveredDate: formatDate(orderResult.order.rtoDeliveredDate, "DD-MM-YYYY"),
                disputeDate: formatDate(new Date().toISOString().slice(0, 10), "DD-MM-YYYY")
            }
        ];

        const {
            status: emailStatus,
            message: emailMessage,
            emailConfig,
            htmlTemplate,
            subject: emailSubject
        } = await getEmailConfig("supplier", "need to raise", "dispute-2", true);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { message: emailMessage || "Failed to fetch email configuration.", status: false },
                { status: 500 }
            );
        }

        // Generate HTML table rows
        const orderTableRows = finalOrders.map(order => {
            return `<tr>
                        <td>${order.orderNumber}</td>
                        <td>${order.awbNumber}</td>
                        <td>${order.rtoDeliveredDate || '-'}</td>
                        <td>${order.disputeDate}</td>
                    </tr>`;
        }).join('');

        const replacements: Record<string, string> = {
            "{{orderTableRows}}": orderTableRows,
            "{{year}}": new Date().getFullYear().toString(),
            "{{appName}}": "Shipping OWL",
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : "<p>Dear Supplier,</p><p>Your dispute has been registered successfully.</p>";

        let subject = emailSubject;

        Object.entries(replacements).forEach(([key, value]) => {
            htmlBody = htmlBody.replace(new RegExp(key, 'g'), value);
            subject = subject.replace(new RegExp(key, 'g'), value);
        });

        logMessage(`table`, `uploadedMedia: `, uploadedMedia);

        // 1. Create packaging attachments
        const packagingAttachments = (uploadedMedia.packingGallery || '')
            .split(',')
            .map(path => path.trim())
            .filter(path => !!path)
            .map((filePath, index) => {
                const ext = path.extname(filePath); // crude but works
                return {
                    name: `Packaging Gallery ${index + 1}${ext}`,
                    path: filePath,
                };
            });

        // 2. Create unboxing attachments
        const unboxingAttachments = (uploadedMedia.unboxingGallery || '')
            .split(',')
            .map(path => path.trim())
            .filter(path => !!path)
            .map((filePath, index) => {
                const ext = path.extname(filePath); // crude but works
                return {
                    name: `Unboxing Gallery ${index + 1}${ext}`,
                    path: filePath,
                };
            });

        // 3. Combine all valid attachments
        const allAttachments = [...packagingAttachments, ...unboxingAttachments];

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
            attachments: allAttachments
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
                    message: "Dispute raised but email notification failed.",
                    status: false,
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        logMessage('info', `Order status updated successfully for orderId: ${orderId}`);

        return NextResponse.json(
            {
                status: true,
                message: 'Order item status updated successfully.',
            },
            { status: 200 }
        );
    } catch (error) {
        logMessage('error', `Error updating order item status: ${error}`);
        return NextResponse.json(
            { status: false, message: error || 'An unexpected error occurred while processing your request. Please try again later.' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};