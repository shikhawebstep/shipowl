import { NextRequest, NextResponse } from 'next/server';
import { logMessage, formatDate } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getOrderById } from '@/app/models/order/order';
import { orderDisputeCaseOne } from '@/app/models/order/item';
import { getTemplate } from '@/app/models/admin/emailConfig/template';
import { sendEmail } from '@/utils/email/sendEmail';
import { validateFormData } from '@/utils/validateFormData';

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

        const userCheck = await isUserExist(supplierId, String(supplierRole));
        if (!userCheck.status) {
            logMessage('warn', `User verification failed: ${userCheck.message}`);
            return NextResponse.json(
                { error: `User not found or unauthorized: ${userCheck.message}` },
                { status: 404 }
            );
        }

        const formData = await req.formData();
        const validation = validateFormData(formData, {
            requiredFields: ['orders'],
            patternValidations: { orders: 'string' },
        });

        if (!validation.isValid) {
            logMessage('warn', 'Form validation failed', validation.error);
            return NextResponse.json(
                { status: false, error: validation.error, message: validation.message },
                { status: 400 }
            );
        }

        const rawOrderIds = formData.get('orders') as string;
        const validOrderIds = rawOrderIds
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '' && !isNaN(Number(id)))
            .map(Number);

        if (validOrderIds.length === 0) {
            return NextResponse.json(
                { status: false, message: 'No valid order IDs found after validation.' },
                { status: 400 }
            );
        }

        const finalOrders: {
            orderNumber: string;
            awbNumber: string | null;
            rtoDeliveredDate: string | null;
            disputeDate: string | null;
        }[] = [];

        const failedOrders: {
            orderId: number;
            reason: string;
        }[] = [];

        const urlParams = req.nextUrl.searchParams;
        const status = decodeURIComponent(urlParams.get('status') || 'not received');
        const allowedStatuses = ['not received'];

        if (!allowedStatuses.includes(status.toLowerCase())) {
            return NextResponse.json(
                {
                    error: `Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}`,
                },
                { status: 400 }
            );
        }

        for (const orderId of validOrderIds) {
            const orderResult = await getOrderById(orderId);
            if (!orderResult.status || !orderResult.order) {
                const reason = 'Order not found or inaccessible.';
                logMessage('warn', `${reason} Order ID: ${orderId}`);
                failedOrders.push({ orderId, reason });
                continue;
            }

            const payload = {
                orderId,
                status: 'not received',
                disputeCase: 1,
            };

            const result = await orderDisputeCaseOne(payload);
            if (!result.status) {
                const reason = result.message || 'Unknown error while updating dispute.';
                logMessage('error', `❌ Failed to update order item status: ${reason}`);
                failedOrders.push({ orderId, reason });
                continue;
            }

            finalOrders.push({
                orderNumber: orderResult.order.orderNumber,
                awbNumber: orderResult.order.awbNumber,
                rtoDeliveredDate: formatDate(orderResult.order.rtoDeliveredDate, 'DD-MM-YYYY'),
                disputeDate: formatDate(new Date(), 'DD-MM-YYYY'),
            });
        }

        if (finalOrders.length === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'None of the disputes could be processed.',
                    failedOrders,
                },
                { status: 400 }
            );
        }

        // Prepare email
        const {
            status: emailStatus,
            message: emailMessage,
            emailConfig,
            htmlTemplate,
            subject: emailSubject,
        } = await getTemplate('supplier', 'need to raise', 'dispute-1', true);

        if (!emailStatus || !emailConfig) {
            return NextResponse.json(
                { status: false, message: emailMessage || 'Failed to fetch email configuration.' },
                { status: 500 }
            );
        }

        const orderTableRows = finalOrders
            .map(order => `<tr>
          <td>${order.orderNumber}</td>
          <td>${order.awbNumber}</td>
          <td>${order.rtoDeliveredDate || '-'}</td>
          <td>${order.disputeDate}</td>
        </tr>`)
            .join('');

        const replacements: Record<string, string> = {
            '{{orderTableRows}}': orderTableRows,
            '{{year}}': new Date().getFullYear().toString(),
            '{{appName}}': 'ShipOwl',
        };

        let htmlBody = htmlTemplate?.trim()
            ? htmlTemplate
            : '<p>Dear Supplier,</p><p>Your dispute has been registered successfully.</p>';
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
                    message: 'Dispute raised but email notification failed.',
                    emailError: emailResult.error,
                },
                { status: 500 }
            );
        }

        logMessage('info', `✅ Disputes processed: ${finalOrders.length}, ❌ Failed: ${failedOrders.length}`);

        return NextResponse.json(
            {
                status: true,
                message: 'Some or all disputes processed successfully.',
                processed: finalOrders.length,
                failed: failedOrders.length,
                failedOrders,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logMessage('error', `Error in dispute handling: ${errorMessage}`);
        return NextResponse.json(
            {
                status: false,
                error: 'An unexpected error occurred. Please try again later.',
            },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};