import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { parseFilesFromFormData } from '@/utils/parseCsvExcel';
import { importGoodPincodes } from '@/app/models/goodPincode';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { getPincodeDetails } from '@/utils/location/pincodeUtils';

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

type PincodeRow = {
  pincode: string;
};

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for GoodPincode import');

    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));
    if (isStaffUser) {
      const options = {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Import',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, adminId);
      logMessage('info', 'Fetched staff permissions:', staffPermissionsResult);

      if (!staffPermissionsResult.status) {
        return NextResponse.json(
          {
            status: false,
            message: staffPermissionsResult.message || "You do not have permission to perform this action."
          },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    const validation = validateFormData(formData, {
      requiredFields: ['goodPincodes'],
      fileExtensionValidations: {
        goodPincodes: ['csv', 'xls', 'xlsx'],
      },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const parsed = await parseFilesFromFormData(formData, 'goodPincodes', {
      returnInArray: false,
      multiple: false,
    });

    if (typeof parsed === 'object' && !Array.isArray(parsed) && 'rows' in parsed) {
      const needHeader = ['pincode'];
      const headersToKeep = new Set(needHeader.map(h => h.toLowerCase()));

      const filtered = (parsed.rows as PincodeRow[]).map(row => {
        const newRow: Record<string, string | undefined> = {};
        for (const [key, value] of Object.entries(row)) {
          if (headersToKeep.has(key.toLowerCase())) {
            newRow[key] = value;
          }
        }
        return newRow;
      });

      if (!filtered || filtered.length === 0) {
        logMessage('warn', 'File parsing resulted in no usable pincode rows');
        return NextResponse.json({ status: false, error: 'No valid pincode data found' }, { status: 400 });
      }

      const validPincodes: PincodeRow[] = [];
      const invalidPincodes: string[] = [];

      for (const item of filtered) {
        const pincode = String(item.pincode || '').trim();

        if (!/^\d{6}$/.test(pincode)) {
          invalidPincodes.push(pincode);
          continue;
        }

        const {
          status: pincodeDetailStatus,
          postOffices,
          message: pincodeDetailMessage
        } = await getPincodeDetails(pincode);

        if (!pincodeDetailStatus || !postOffices || postOffices.length === 0) {
          logMessage('warn', `Invalid or unrecognized pincode: ${pincode}`, pincodeDetailMessage);
          invalidPincodes.push(pincode);
          continue;
        }

        validPincodes.push({ pincode });
      }

      if (validPincodes.length === 0) {
        return NextResponse.json({
          status: false,
          message: 'No valid pincodes found in uploaded file.',
          invalidPincodes
        }, { status: 400 });
      }

      const importGoodPincodesResult = await importGoodPincodes(adminId, String(adminRole), validPincodes);

      if (importGoodPincodesResult?.status) {
        await ActivityLog(
          {
            panel: 'Admin',
            module: 'Good Pincode',
            action: 'Import',
            data: importGoodPincodesResult,
            response: {
              status: true,
              message: importGoodPincodesResult.message || 'Pincodes imported successfully.',
              importedCount: validPincodes.length,
              invalidPincodes
            },
            status: true
          }, req);

        return NextResponse.json({
          status: true,
          message: importGoodPincodesResult.message || 'Pincodes imported successfully.',
          importedCount: validPincodes.length,
          invalidPincodes
        }, { status: 200 });
      }

      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Good Pincode',
          action: 'Import',
          data: importGoodPincodesResult,
          response: {
            status: false,
            error: importGoodPincodesResult?.message || 'GoodPincode import failed',
            invalidPincodes
          },
          status: false
        }, req);

      logMessage('error', 'GoodPincode import failed:', importGoodPincodesResult?.message || 'Unknown error');
      return NextResponse.json(
        {
          status: false,
          error: importGoodPincodesResult?.message || 'GoodPincode import failed',
          invalidPincodes
        },
        { status: 500 }
      );
    } else {
      await ActivityLog(
        {
          panel: 'Admin',
          module: 'Good Pincode',
          action: 'Import',
          data: { oneLineSimpleMessage: 'Parsed data is not in expected format' },
          response: { status: false, error: 'File parsing failed' },
          status: false
        }, req);

      logMessage('warn', 'Parsed data is not in expected format');
      return NextResponse.json({ status: false, error: 'File parsing failed' }, { status: 400 });
    }
  } catch (error) {
    await ActivityLog(
      {
        panel: 'Admin',
        module: 'Good Pincode',
        action: 'Import',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'GoodPincode Import Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
