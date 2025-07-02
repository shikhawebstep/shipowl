import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getBankAccountChangeRequestByAdminId, getSupplierBankAccountBySupplierId, requestSupplierBankAccountChange } from '@/app/models/supplier/bankAccount';

type UploadedFileInfo = {
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    url: string;
};

export async function POST(req: NextRequest) {
    try {
        logMessage('debug', 'POST request received for supplier bank account update');

        // Extract headers
        const supplierIdHeader = req.headers.get('x-supplier-id');
        const supplierRole = req.headers.get('x-supplier-role');
        const supplierId = Number(supplierIdHeader);

        // Validate supplierId
        if (!supplierIdHeader || isNaN(supplierId)) {
            logMessage('warn', `Invalid supplierIdHeader: ${supplierIdHeader}`);
            return NextResponse.json({ error: 'Invalid or missing supplierIdHeader' }, { status: 400 });
        }

        // Validate user existence
        const userCheck = await isUserExist(supplierId, String(supplierRole));
        if (!userCheck.status) {
            logMessage('warn', `User not found: ${userCheck.message}`);
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
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
        const currentBankAccountChangeRequest = await getBankAccountChangeRequestByAdminId(supplierId);
        if (currentBankAccountChangeRequest.status) {
            return NextResponse.json({
                status: false,
                message: 'A bank account change request already exists for this supplier.',
            }, { status: 400 });
        }

        // Extract form data
        const extractString = (key: string) => (formData.get(key) as string) || null;

        // Define file upload directory and fields
        const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier', `${supplierId}`, 'company');
        const supplierBankAccountFileFields = ['cancelledChequeImage'];

        // Handle file uploads
        const supplierBankAccountUploadedFiles: Record<string, string> = {};
        for (const field of supplierBankAccountFileFields) {
            const fileData = await saveFilesFromFormData(formData, field, {
                dir: companyUploadDir,
                pattern: 'slug-unique',
                multiple: true,
            });

            if (fileData) {
                logMessage('info', `Uploaded ${field} file data:`, fileData);
                if (Array.isArray(fileData)) {
                    supplierBankAccountUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
                } else {
                    supplierBankAccountUploadedFiles[field] = (fileData as UploadedFileInfo).url;
                }
            }
        }

        // Fetch the existing bank account details for the supplier
        const { bankAccount } = await getSupplierBankAccountBySupplierId(supplierId);

        const supplierBankAccountPayload = {
            admin: { connect: { id: supplierId } },
            bankAccount: bankAccount ? { connect: { id: bankAccount.id } } : null,
            accountHolderName: extractString('accountHolderName') || '',
            accountNumber: extractString('accountNumber') || '',
            bankName: extractString('bankName') || '',
            bankBranch: extractString('bankBranch') || '',
            accountType: extractString('accountType') || '',
            ifscCode: extractString('ifscCode') || '',
            cancelledChequeImage: supplierBankAccountUploadedFiles['cancelledChequeImage'],
            updatedAt: new Date(),
            updatedBy: supplierId,
            updatedByRole: supplierRole,
        };

        logMessage('info', 'Supplier payload for bank account change request:', supplierBankAccountPayload);

        // Create or update bank account change request
        const supplierBankAccountChangeRequestResult = await requestSupplierBankAccountChange(supplierId, String(supplierRole), supplierBankAccountPayload);

        if (!supplierBankAccountChangeRequestResult.status) {
            // Delete uploaded files if request creation fails
            if (Object.keys(supplierBankAccountUploadedFiles).length > 0) {
                for (const field in supplierBankAccountUploadedFiles) {
                    const fileUrls = supplierBankAccountUploadedFiles[field].split(',').map(url => url.trim());
                    for (const fileUrl of fileUrls) {
                        if (fileUrl) {
                            const filePath = path.join(companyUploadDir, path.basename(fileUrl));
                            await deleteFile(filePath);
                            logMessage('info', `Deleted file: ${filePath}`);
                        }
                    }
                }
            }

            logMessage('error', 'Failed to create/update supplier bank account change request', supplierBankAccountChangeRequestResult?.message);
            return NextResponse.json({ status: false, error: supplierBankAccountChangeRequestResult?.message || 'Failed to create/update supplier bank account change request' }, { status: 500 });
        }

        return NextResponse.json({
            status: true,
            message: supplierBankAccountChangeRequestResult?.message || 'Supplier bank account change request processed successfully.',
        }, { status: 200 });

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
        logMessage('error', 'Error during supplier bank account change request process:', errorMessage);
        return NextResponse.json({ status: false, error: errorMessage }, { status: 500 });
    }
}

export const config = {
  api: {
    bodyParser: false,
  },
};