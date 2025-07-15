import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bcrypt from 'bcryptjs';

import { logMessage } from "@/utils/commonUtils";
/*
import { isUserExist } from "@/utils/auth/authUtils";
*/
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkEmailAvailability, checkUsernameAvailability, createSupplier } from '@/app/models/supplier/supplier';
import { getTemplate } from '@/app/models/admin/emailConfig/template';
import { sendEmail } from "@/utils/email/sendEmail";
import { generateRegistrationToken } from '@/utils/auth/authUtils';
/*
import { createSupplierCompany } from '@/app/models/supplier/company';
import { createSupplierBankAccount } from '@/app/models/supplier/bankAccount';
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
  cancelledChequeImage: string;
}
*/

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for supplier creation');

    const requiredFields = ['name', 'username', 'email', 'password'];
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

    const extractDate = (key: string, outputFormat: string): string | null => {
      const value = extractString(key);
      if (!value) return null;

      // Define regular expressions for different date formats
      const regexPatterns = [
        { format: 'DD-MM-YYYY', regex: /^(\d{2})-(\d{2})-(\d{4})$/ },
        { format: 'YYYY-MM-DD', regex: /^(\d{4})-(\d{2})-(\d{2})$/ },
        { format: 'DD/MM/YYYY', regex: /^(\d{2})\/(\d{2})\/(\d{4})$/ },
        { format: 'YYYY/MM/DD', regex: /^(\d{4})\/(\d{2})\/(\d{2})$/ }
      ];

      let parsedDate: Date | null = null;

      // Try to match the input value to the known formats
      for (const { format, regex } of regexPatterns) {
        const match = value.match(regex);
        if (match) {
          const [, day, month, year] = match;
          // Convert matched values into a Date object
          parsedDate = new Date(`${year}-${month}-${day}`);
          logMessage('info', `✅ Parsed date from "${value}" using format "${format}"`);
          break;
        }
      }

      // If no valid date was parsed, return null
      if (!parsedDate) {
        logMessage('warn', `Failed to parse date for "${value}"`);
        return null;
      }

      // Helper function to format the date in a specific output format
      const formatDate = (date: Date, format: string): string => {
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };

        const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

        switch (format) {
          case 'DD-MM-YYYY':
            return formattedDate.replace(/\//g, '-');
          case 'YYYY-MM-DD':
            return formattedDate.split('/').reverse().join('-');
          default:
            return formattedDate;
        }
      };

      // Return the formatted date in the desired output format
      return formatDate(parsedDate, outputFormat);
    };

    const email = extractString('email') || '';
    const { status: checkEmailAvailabilityResult, message: checkEmailAvailabilityMessage } = await checkEmailAvailability(email);

    if (!checkEmailAvailabilityResult) {
      logMessage('warn', `Email availability check failed: ${checkEmailAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkEmailAvailabilityMessage }, { status: 400 });
    }

    const username = extractString('username') || '';
    const { status: checkUsernameAvailabilityResult, message: checkUsernameAvailabilityMessage } = await checkUsernameAvailability(username);

    if (!checkUsernameAvailabilityResult) {
      logMessage('warn', `Username availability check failed: ${checkUsernameAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkUsernameAvailabilityMessage }, { status: 400 });
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

    const password = extractString('password') || '';
    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10); // Generates a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    const supplierUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier');
    const supplierFileFields = [
      'profilePicture'
    ];

    const supplierUploadedFiles: Record<string, string> = {};
    for (const field of supplierFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: supplierUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          supplierUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          supplierUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const supplierPayload = {
      name: extractString('name') || '',
      profilePicture: supplierUploadedFiles['profilePicture'],
      username,
      email,
      password: hashedPassword,
      dateOfBirth: extractDate('dateOfBirth', 'YYYY-MM-DD') || '',
      currentAddress: extractString('currentAddress') || '',
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
      createdAt: new Date(),
      createdBy: 0,
      createdByRole: '',
    };

    logMessage('info', 'Supplier payload created:', supplierPayload);

    const supplierCreateResult = await createSupplier(0, String(''), supplierPayload);

    if (!supplierCreateResult || !supplierCreateResult.status || !supplierCreateResult.supplier) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(supplierUploadedFiles).length > 0) {
        // Iterate over each field in supplierUploadedFiles
        for (const field in supplierUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = supplierUploadedFiles[field].split(',').map((url) => url.trim());

          // Iterate over each file URL in the array
          for (const fileUrl of fileUrls) {
            if (fileUrl) {  // Check if the file URL is valid
              const filePath = path.join(supplierUploadDir, path.basename(fileUrl));

              // Attempt to delete the file
              await deleteFile(filePath);
              logMessage('info', `Deleted file: ${filePath}`);
            }
          }
        }
      } else {
        logMessage('info', 'No uploaded files to delete.');
      }
      logMessage('error', 'Supplier creation failed:', supplierCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: supplierCreateResult?.message || 'Supplier creation failed' }, { status: 500 });
    }

    /*
    const companyUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier', `${supplierCreateResult.supplier.id}`, 'company');
    const supplierCompanyFileFields = [
      'gstDocument',
      'panCardImage',
      'aadharCardImage',
      'additionalDocumentUpload',
      'documentImage'
    ];

    const supplierCompanyUploadedFiles: Record<string, string> = {};
    for (const field of supplierCompanyFileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: companyUploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          supplierCompanyUploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          supplierCompanyUploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    const supplierCompanyPayload = {
      admin: { connect: { id: supplierCreateResult.supplier.id } },
      companyName: extractString('companyName') || '',
      brandName: extractString('brandName') || '',
      brandShortName: extractString('brandShortName') || '',
      billingAddress: extractString('billingAddress') || '',
      billingPincode: extractString('billingPincode') || '',
      billingState: extractString('billingState') || '',
      billingCity: extractString('billingCity') || '',
      businessType: extractString('businessType') || '',
      clientEntryType: extractString('clientEntryType') || '',
      gstNumber: extractString('gstNumber') || '',
      companyPanNumber: extractString('companyPanNumber') || '',
      aadharNumber: extractString('aadharNumber') || '',
      gstDocument: supplierCompanyUploadedFiles['gstDocument'],
      panCardHolderName: extractString('panCardHolderName') || '',
      aadharCardHolderName: extractString('aadharCardHolderName') || '',
      panCardImage: supplierCompanyUploadedFiles['panCardImage'],
      aadharCardImage: supplierCompanyUploadedFiles['aadharCardImage'],
      additionalDocumentUpload: supplierCompanyUploadedFiles['additionalDocumentUpload'] || '',
      documentId: extractString('gstNumber') || '',
      documentName: extractString('companyPanNumber') || '',
      documentImage: supplierCompanyUploadedFiles['documentImage'],
      createdAt: new Date(),
      createdBy: adminId,
      createdByRole: adminRole,
    };

    logMessage('info', 'Supplier payload created:', supplierCompanyPayload);

    const supplierCompanyCreateResult = await createSupplierCompany(0, String(''), supplierCompanyPayload);
    if (!supplierCompanyCreateResult || !supplierCompanyCreateResult.status || !supplierCompanyCreateResult.supplier) {

      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(supplierCompanyUploadedFiles).length > 0) {
        // Iterate over each field in supplierCompanyUploadedFiles
        for (const field in supplierCompanyUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = supplierCompanyUploadedFiles[field].split(',').map((url) => url.trim());

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

      logMessage('error', 'Supplier company creation failed', supplierCompanyCreateResult?.message);
      return NextResponse.json({ status: false, error: supplierCompanyCreateResult?.message || 'Supplier company creation failed' }, { status: 500 });
    }
    
    logMessage('debug', 'Supplier\'s bank accounts:', bankAccounts);

    const supplierBankAccountPayload = {
      admin: { connect: { id: supplierCreateResult.supplier.id } },
      bankAccounts,
      createdAt: new Date(),
      createdBy: 0,
      createdByRole: '',
    }

    const bankAccountUploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'supplier', `${supplierCreateResult.supplier.id}`, 'bank-aacount');
    const supplierBankAccountUploadedFiles: Record<string, string> = {};
    if (Array.isArray(supplierBankAccountPayload.bankAccounts) && supplierBankAccountPayload.bankAccounts.length > 0) {
      for (let index = 0; index < supplierBankAccountPayload.bankAccounts.length; index++) {
        console.log(`🔁 Index: ${index}`);
        const cancelledChequeImageIndex = `cancelledChequeImage${index}`;

        // File upload
        const fileData = await saveFilesFromFormData(formData, cancelledChequeImageIndex, {
          dir: bankAccountUploadDir,
          pattern: 'slug-unique',
          multiple: true,
        });

        let image = '';

        if (fileData) {
          logMessage('info', 'uploaded fileData:', fileData);

          if (Array.isArray(fileData)) {
            supplierBankAccountUploadedFiles[cancelledChequeImageIndex] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
            image = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
          } else {
            supplierBankAccountUploadedFiles[cancelledChequeImageIndex] = (fileData as UploadedFileInfo).url;
            image = (fileData as UploadedFileInfo).url;
          }
        }

        supplierBankAccountPayload.bankAccounts[index].cancelledChequeImage = image;
      }
    }

    const supplierBankAccountCreateResult = await createSupplierBankAccount(0, String(''), supplierBankAccountPayload);
    if (
      !supplierBankAccountCreateResult ||
      !supplierBankAccountCreateResult.status ||
      !supplierBankAccountCreateResult.bankAccounts
    ) {
      // Check if there are any uploaded files before attempting to delete
      if (Object.keys(supplierBankAccountUploadedFiles).length > 0) {
        // Iterate over each field in supplierBankAccountUploadedFiles
        for (const field in supplierBankAccountUploadedFiles) {
          // Split the comma-separated URLs into an array of individual file URLs
          const fileUrls = supplierBankAccountUploadedFiles[field].split(',').map((url) => url.trim());

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
      logMessage('error', 'Supplier company creation failed', supplierBankAccountCreateResult?.message);
      return NextResponse.json({
        status: false,
        error: supplierBankAccountCreateResult?.message || 'Supplier company creation failed'
      }, { status: 500 });
    }
    */

    const { status: emailStatus, message: emailMessage, emailConfig, htmlTemplate, subject: emailSubject } = await getTemplate('supplier', 'auth', 'registration', true);
    logMessage('debug', 'Email Config:', emailConfig);

    if (!emailStatus || !emailConfig) {
      return NextResponse.json(
        { message: emailMessage || "Failed to fetch email configuration.", status: false },
        { status: 500 }
      );
    }

    const token = generateRegistrationToken(supplierCreateResult.supplier.id, 'supplier');

    // Use index signature to avoid TS error
    const replacements: Record<string, string> = {
      "{{name}}": supplierCreateResult.supplier.name,
      "{{email}}": supplierCreateResult.supplier.email,
      "{{year}}": new Date().getFullYear().toString(),
      "{{appName}}": "Shipping OWL",
      "{{verificationLink}}": `https://shipowl.io/supplier/auth/register/verify?token=${token}`,
      "{{password}}": password
    };

    let htmlBody = htmlTemplate?.trim()
      ? htmlTemplate
      : `
        <p>Dear {{name}},</p>
        <p>Click the button below to verify your email and wait for admin approval to activate your account.</p>
        <p><a href="{{verificationLink}}" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a></p>
        <p>Thank you,<br/>{{appName}} Team</p>
      `;

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
      { status: true, error: supplierCreateResult?.message || 'Supplier updated Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Supplier Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};