import { NextRequest, NextResponse } from 'next/server';

import { logMessage, formatDate } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getOrderById } from '@/app/models/order/order';
import { orderDisputeCaseOne } from '@/app/models/order/item';
import { getTemplate } from '@/app/models/admin/emailConfig/template';
import { sendEmail } from '@/utils/email/sendEmail';

export async function POST(req: NextRequest) {
    try {
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

        // Validate user
        const userCheck = await isUserExist(supplierId, String(supplierRole));
        if (!userCheck.status) {
            logMessage('warn', `User verification failed: ${userCheck.message}`);
            return NextResponse.json(
                { error: `User not found or unauthorized: ${userCheck.message}` },
                { status: 404 }
            );
        }

        // Extract order ID from URL
        const parts = req.nextUrl.pathname.split('/');
        const orderId = Number(parts[parts.length - 2]);

        // Fetch order
        const orderResult = await getOrderById(orderId);
        if (!orderResult.status || !orderResult.order) {
            logMessage('warn', `Order not found or inaccessible. Order ID: ${orderId}`);
            return NextResponse.json(
                { status: false, message: 'Order not found or you do not have permission to access it.' },
                { status: 404 }
            );
        }

        const urlParams = req.nextUrl.searchParams;
        const status = decodeURIComponent(urlParams.get('status') || 'not received');
        const allowedStatuses = ['not received'];

        if (!status || !allowedStatuses.includes(status.toLowerCase())) {
            logMessage('warn', `Invalid status received: ${status}`);
            return NextResponse.json(
                {
                    error: `Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}.`,
                },
                { status: 400 }
            );
        }

        const orderItemRTOPayload = {
            orderId,
            status: 'not received',
            disputeCase: 1
        };

        const result = await orderDisputeCaseOne(orderItemRTOPayload);
        if (!result.status) {
            logMessage('error', `Failed to update order item status: ${result.message}`);
            return NextResponse.json(
                { message: result.message || `Failed to update order item status: ${result.message}` },
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
        } = await getTemplate("supplier", "need to raise", "dispute-1", true);

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
            attachments: []
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

        logMessage('info', `Order status updated and email sent successfully for orderId: ${orderId}`);

        return NextResponse.json(
            {
                status: true,
                message: 'Order item status updated and email sent successfully.',
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logMessage('error', `Error in dispute handling: ${errorMessage}`);
        return NextResponse.json(
            { status: false, error: 'An unexpected error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
