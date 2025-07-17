import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkEmailAvailability, createDropshipper } from '@/app/models/dropshipper/dropshipper';
import { generateRegistrationToken } from '@/utils/auth/authUtils';
import { getTemplate } from '@/app/models/admin/emailConfig/template';
import { sendEmail } from "@/utils/email/sendEmail";
/*
import { updateDropshipperCompany } from '@/app/models/dropshipper/company';
import { updateDropshipperBankAccount } from '@/app/models/dropshipper/bankAccount';
*/

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

/*
interface BankAccount {
  id?: number;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankBranch: string;
  accountType: string;
  ifscCode: string;
  paymentMethod: string;
}
*/

export async function POST(req: NextRequest) {

  try {
    logMessage('debug', 'POST request received for dropshipper updation');

    const requiredFields = ['name', 'email'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: { status: 'boolean' },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || null;
    const extractString = (key: string) => (formData.get(key) as string) || null;
    /*
    const extractJSON = (key: string): Record<string, unknown> | null => {

      const value = extractString(key);
      const cleanedValue = typeof value === 'string' ? value.replace(/[\/\\]/g, '') : value;

      let parsedData;
      if (typeof cleanedValue === 'string') {
        try {
          parsedData = JSON.parse(cleanedValue);
          logMessage('info', "✅ Parsed value: 1", parsedData);
          return parsedData;
        } catch (error) {
          logMessage('warn', 'Failed to parse JSON value:', error);
        }

        try {
          parsedData = JSON.parse(cleanedValue);
          logMessage('info', "✅ Parsed value: 2", parsedData);
          return parsedData;
        } catch (error) {
          logMessage('warn', 'Failed to parse JSON value:', error);
          return null;
        }
      }

      if (typeof cleanedValue === 'object' && cleanedValue !== null) {
        logMessage('info', "✅ Parsed value: 3", cleanedValue);
        return cleanedValue;
      }

      return null;
    };
    */

    const email = extractString('email') || '';
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailability(email);

    if (!checkEmailAvailabilityResult) {
      logMessage('warn', `Email availability check failed: ${checkEmailAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkEmailAvailabilityMessage }, { status: 400 });
    }

    const permanentCountryId = extractNumber('permanentCountry') || 0;
    const permanentStateId = extractNumber('permanentState') || 0;
    const permanentCityId = extractNumber('permanentCity') || 0;

    const isLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(permanentCityId, permanentStateId, permanentCountryId);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectResult);
    if (!isLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    /*
    const rawBankAccounts = extractJSON('bankAccounts');

    console.log(`rawBankAccounts`, rawBankAccounts);
    if (!Array.isArray(rawBankAccounts) || rawBankAccounts.length === 0) {
      logMessage('warn', 'Variants are not valid or empty');
      return NextResponse.json({ status: false, error: 'Variants are not valid or empty' }, { status: 400 });
    }
    const bankAccounts: BankAccount[] = Array.isArray(rawBankAccounts) ? rawBankAccounts as BankAccount[] : [];
    */

    const dropshipperUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper');
    const dropshipperFileFields = [
      'profilePicture'
    ];

    const dropshipperUploadedFiles: Record<string, string> = {};
    for (const field of dropshipperFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: dropshipperUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          dropshipperUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          dropshipperUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const dropshipperPayload = {
      name: extractString('name') || '',
      profilePicture: dropshipperUploadedFiles['profilePicture'],
      email,
      website: extractString('website') || '',
      phoneNumber: extractString('phoneNumber') || '',
      referralCode: extractString('referralCode') || '',
      password: '',
      permanentAddress: extractString('permanentAddress') || '',
      permanentPostalCode: extractString('permanentPostalCode') || '',
      permanentCity: {
        connect: {
          id: permanentCityId,
        },
      },
      permanentState: {
        connect: {
          id: permanentStateId,
        },
      },
      permanentCountry: {
        connect: {
          id: permanentCountryId,
        },
      },
      status: false,
      updatedAt: new Date(),
      updatedBy: 0,
      updatedByRole: '',
    };

    logMessage('info', 'Dropshipper payload updated:', dropshipperPayload);

    const dropshipperCreateResult = await createDropshipper(0, String(''), dropshipperPayload);

    if (!dropshipperCreateResult || !dropshipperCreateResult.status || !dropshipperCreateResult.dropshipper) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(dropshipperUploadedFiles).length > 0) {
        // Iterate over each field in dropshipperUploadedFiles
        for (const field in dropshipperUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = dropshipperUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(dropshipperUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }
      logMessage('error', 'Dropshipper creation failed:', dropshipperCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: dropshipperCreateResult?.message || 'Dropshipper creation failed' }, { status: 500 });
    }

    /*
        const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${dropshipperCreateResult.dropshipper.id}`, 'company');
        const dropshipperCompanyFileFields = [
          'gstDocument',
          'panCardImage',
          'aadharCardImage',
          'additionalDocumentUpload',
          'documentImage'
        ];
    
        const dropshipperCompanyUploadedFiles: Record<string, string> = {};
        for (const field of dropshipperCompanyFileFields) {
          const fileData = await saveFilesFromFormData(formData, field, {
            dir: companyUploadDir,
            pattern: 'slug-unique',
            multiple: true,
          });
    
          if (fileData) {
            logMessage('info', 'uploaded fileData:', fileData);
            if (Array.isArray(fileData)) {
              dropshipperCompanyUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
            } else {
              dropshipperCompanyUploadedFiles[field] = (fileData as UploadedFileInfo).url;
            }
          }
        }
    
        const dropshipperCompanyPayload = {
          admin: { connect: { id: dropshipperCreateResult.dropshipper.id } },
          gstNumber: extractString('gstNumber') || '',
          gstDocument: dropshipperCompanyUploadedFiles['gstDocument'],
          panCardHolderName: extractString('panCardHolderName') || '',
          aadharCardHolderName: extractString('aadharCardHolderName') || '',
          panCardImage: dropshipperCompanyUploadedFiles['panCardImage'],
          aadharCardImage: dropshipperCompanyUploadedFiles['aadharCardImage'],
          updatedAt: new Date(),
          updatedBy: adminId,
          updatedByRole: adminRole,
        };
    
        logMessage('info', 'Dropshipper payload updated:', dropshipperCompanyPayload);
    
        const dropshipperCompanyCreateResult = await updateDropshipperCompany(adminId, String(adminRole), dropshipperCreateResult.dropshipper.id, dropshipperCompanyPayload);
        if (!dropshipperCompanyCreateResult || !dropshipperCompanyCreateResult.status || !dropshipperCompanyCreateResult.dropshipper) {
    
          // Check if there are any uploaded files before attempting to delete
          if (Object.keys(dropshipperCompanyUploadedFiles).length > 0) {
            // Iterate over each field in dropshipperCompanyUploadedFiles
            for (const field in dropshipperCompanyUploadedFiles) {
              // Split the comma-separated URLs into an array of individual file URLs
              const fileUrls = dropshipperCompanyUploadedFiles[field].split(',').map((url) => url.trim());
    
              // Iterate over each file URL in the array
              for (const fileUrl of fileUrls) {
                if (fileUrl) {  // Check if the file URL is valid
                  const filePath = path.join(companyUploadDir, path.basename(fileUrl));
    
                  // Attempt to delete the file
                  await deleteFile(filePath);
                  logMessage('info', `Deleted file: ${filePath}`);
                }
              }
            }
          } else {
            logMessage('info', 'No uploaded files to delete.');
          }
    
          logMessage('error', 'Dropshipper company creation failed', dropshipperCompanyCreateResult?.message);
          return NextResponse.json({ status: false, error: dropshipperCompanyCreateResult?.message || 'Dropshipper company creation failed' }, { status: 500 });
        }
    
        logMessage('debug', 'Dropshipper\'s bank accounts:', bankAccounts);
    
        const dropshipperBankAccountPayload = {
          admin: { connect: { id: dropshipperCreateResult.dropshipper.id } },
          bankAccounts,
          updatedAt: new Date(),
          updatedBy: adminId,
          updatedByRole: adminRole,
        }
    
        const dropshipperBankAccountCreateResult = await updateDropshipperBankAccount(adminId, String(adminRole), dropshipperCreateResult.dropshipper.id, dropshipperBankAccountPayload);
        if (
          !dropshipperBankAccountCreateResult ||
          !dropshipperBankAccountCreateResult.status ||
          !dropshipperBankAccountCreateResult.bankAccounts
        ) {
          logMessage('error', 'Dropshipper company creation failed', dropshipperBankAccountCreateResult?.message);
          return NextResponse.json({
            status: false,
            error: dropshipperBankAccountCreateResult?.message || 'Dropshipper company creation failed'
          }, { status: 500 });
        }
          
        */

    const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = await getTemplate('dropshipper', 'auth', 'registration', true);
    logMessage('debug', 'Email Config:', emailConfig);

    if (!emailStatus || !emailConfig) {
      return NextResponse.json(
        { message: emailMessage || "Failed to fetch email configuration.", status: false },
        { status: 500 }
      );
    }

    const token = generateRegistrationToken(dropshipperCreateResult.dropshipper.id, 'dropshipper');

    // Use index signature to avoid TS error
    const replacements: Record<string, string> = {
      "{{name}}": dropshipperCreateResult.dropshipper.name,
      "{{email}}": dropshipperCreateResult.dropshipper.email,
      "{{verificationLink}}": `https://shipowl.io/dropshipping/auth/register/verify?token=${token}`,
      "{{year}}": new Date().getFullYear().toString(),
      "{{appName}}": "ShipOwl",
    };

    let htmlBody = htmlTemplate?.trim()
      ? htmlTemplate
      : "<p>Dear {{name}},</p><p>Click <a href='{{verificationLink}}'>here</a> to verify your email.</p>";

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
      { status: true, error: dropshipperCreateResult?.message || 'Dropshipper updated Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Dropshipper Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }

}

export const config = {
  api: {
    bodyParser: false,
  },
};