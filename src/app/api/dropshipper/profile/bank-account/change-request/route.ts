import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getBankAccountChangeRequestByAdminId, getDropshipperBankAccountByDropshipperId, requestDropshipperBankAccountChange } from '@/app/models/dropshipper/bankAccount';

type UploadedFileInfo = {
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    url: string;
};

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
        logMessage('debug', 'POST request received for dropshipper bank account update');

        // Extract headers
        const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
        const dropshipperRole = req.headers.get('x-dropshipper-role');
        const dropshipperId = Number(dropshipperIdHeader);

        // Validate dropshipperId
        if (!dropshipperIdHeader || isNaN(dropshipperId)) {
            logMessage('warn', `Invalid dropshipperIdHeader: ${dropshipperIdHeader}`);
            return NextResponse.json({ error: 'Invalid or missing dropshipperIdHeader' }, { status: 400 });
        }

        // Validate user existence
        let mainDropshipperId = dropshipperId;
        const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
        if (!userCheck.status) {
            return NextResponse.json(
                { status: false, error: `User Not Found: ${userCheck.message}` },
                { status: 404 }
            );
        }

        const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

        if (isStaffUser) {
            mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
        }

        // Validate form data
        const requiredFields = ['accountHolderName', 'accountNumber', 'bankName', 'bankBranch', 'accountType', 'ifscCode'];
        const formData = await req.formData();
        const validation = validateFormData(formData, { requiredFields });

        if (!validation.isValid) {
            logMessage('warn', 'Form validation failed', validation.error);
            return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
        }

        // Check if a bank account change request already exists
        const currentBankAccountChangeRequest = await getBankAccountChangeRequestByAdminId(mainDropshipperId);
        if (currentBankAccountChangeRequest.status) {
            return NextResponse.json({
                status: false,
                message: 'A bank account change request already exists for this dropshipper.',
            }, { status: 400 });
        }

        // Extract form data
        const extractString = (key: string) => (formData.get(key) as string) || null;

        // Define file upload directory and fields
        const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${mainDropshipperId}`, 'company');
        const dropshipperBankAccountFileFields = ['cancelledChequeImage'];

        // Handle file uploads
        const dropshipperBankAccountUploadedFiles: Record<string, string> = {};
        for (const field of dropshipperBankAccountFileFields) {
            const fileData = await saveFilesFromFormData(formData, field, {
                dir: companyUploadDir,
                pattern: 'slug-unique',
                multiple: true,
            });

            if (fileData) {
                logMessage('info', `Uploaded ${field} file data:`, fileData);
                if (Array.isArray(fileData)) {
                    dropshipperBankAccountUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
                } else {
                    dropshipperBankAccountUploadedFiles[field] = (fileData as UploadedFileInfo).url;
                }
            }
        }

        // Fetch the existing bank account details for the dropshipper
        const { bankAccount } = await getDropshipperBankAccountByDropshipperId(mainDropshipperId);

        const dropshipperBankAccountPayload = {
            admin: { connect: { id: mainDropshipperId } },
            bankAccount: bankAccount ? { connect: { id: bankAccount.id } } : null,
            accountHolderName: extractString('accountHolderName') || '',
            accountNumber: extractString('accountNumber') || '',
            bankName: extractString('bankName') || '',
            bankBranch: extractString('bankBranch') || '',
            accountType: extractString('accountType') || '',
            ifscCode: extractString('ifscCode') || '',
            cancelledChequeImage: dropshipperBankAccountUploadedFiles['cancelledChequeImage'],
            updatedAt: new Date(),
            updatedBy: mainDropshipperId,
            updatedByRole: dropshipperRole,
        };

        logMessage('info', 'Dropshipper payload for bank account change request:', dropshipperBankAccountPayload);

        // Create or update bank account change request
        const dropshipperBankAccountChangeRequestResult = await requestDropshipperBankAccountChange(mainDropshipperId, String(dropshipperRole), dropshipperBankAccountPayload);

        if (!dropshipperBankAccountChangeRequestResult.status) {
            // Delete uploaded files if request creation fails
            if (Object.keys(dropshipperBankAccountUploadedFiles).length > 0) {
                for (const field in dropshipperBankAccountUploadedFiles) {
                    const fileUrls = dropshipperBankAccountUploadedFiles[field].split(',').map(url => url.trim());
                    for (const fileUrl of fileUrls) {
                        if (fileUrl) {
                            const filePath = path.join(companyUploadDir, path.basename(fileUrl));
                            await deleteFile(filePath);
                            logMessage('info', `Deleted file: ${filePath}`);
                        }
                    }
                }
            }

            await ActivityLog(
                {
                    panel: 'Dropshipper',
                    module: 'Bank Account Change Request',
                    action: 'Apply',
                    data: dropshipperBankAccountChangeRequestResult,
                    response: { status: false, error: dropshipperBankAccountChangeRequestResult?.message || 'Failed to create/update dropshipper bank account change request' },
                    status: false
                }, req);
            logMessage('error', 'Failed to create/update dropshipper bank account change request', dropshipperBankAccountChangeRequestResult?.message);
            return NextResponse.json({ status: false, error: dropshipperBankAccountChangeRequestResult?.message || 'Failed to create/update dropshipper bank account change request' }, { status: 500 });
        }

        await ActivityLog(
            {
                panel: 'Dropshipper',
                module: 'Bank Account Change Request',
                action: 'Apply',
                data: dropshipperBankAccountChangeRequestResult,
                response: {
                    status: true,
                    message: dropshipperBankAccountChangeRequestResult?.message || 'Dropshipper bank account change request processed successfully.',
                },
                status: true
            }, req);
        return NextResponse.json({
            status: true,
            message: dropshipperBankAccountChangeRequestResult?.message || 'Dropshipper bank account change request processed successfully.',
        }, { status: 200 });

    } catch (error) {
        await ActivityLog(
            {
                panel: 'Dropshipper',
                module: 'Bank Account Change Request',
                action: 'Apply',
                data: { oneLineSimpleMessage: error || 'Internal Server Error' },
                response: { status: false, error: 'Server error' },
                status: false
            }, req);
        logMessage('error', 'Error during dropshipper bank account change request process:', error);
        return NextResponse.json({ status: false, error }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};