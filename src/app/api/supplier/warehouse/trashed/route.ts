import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createWarehouse, getWarehousesByStatus } from '@/app/models/supplier/warehouse';
import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

interface MainSupplier {
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
  supplier?: MainSupplier;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  supplier?: SupplierStaff;
}

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for warehouse creation');

    // Get headers
    const supplierId = Number(req.headers.get("x-supplier-id"));
    const supplierRole = req.headers.get("x-supplier-role");

    if (!supplierId || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierId: ${supplierId}`);
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    let mainSupplierId = supplierId;
    const userCheck: UserCheckResult = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['supplier', 'dropshipper', 'supplier'].includes(String(supplierRole));

    if (isStaff) {
      mainSupplierId = userCheck.supplier?.supplier?.id ?? supplierId;

      const options = {
        panel: 'Supplier',
        module: 'Warehouse',
        action: 'Create',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, supplierId);
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

    // Validate input
    const validation = validateFormData(formData, {
      requiredFields: ['name', 'gst_number', 'contact_name', 'contact_number', 'address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code'],
      patternValidations: {
        status: 'boolean',
        city: 'number',
        state: 'number',
        country: 'number',
      },
    });

    logMessage('debug', 'Form validation result:', validation);

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    // Extract fields
    const name = formData.get('name') as string;
    const gst_number = (formData.get('gst_number') as string) || '';
    const contact_name = (formData.get('contact_name') as string) || '';
    const contact_number = (formData.get('contact_number') as string) || '';
    const address_line_1 = (formData.get('address_line_1') as string) || '';
    const address_line_2 = (formData.get('address_line_2') as string) || '';

    const countryId = Number(formData.get('country'));
    const stateId = Number(formData.get('state'));
    const cityId = Number(formData.get('city'));

    const countryIdNum = Number(countryId);
    const stateIdNum = Number(stateId);
    const cityIdNum = Number(cityId);

    const postal_code = (formData.get('postal_code') as string) || '';
    const statusRaw = formData.get('status')?.toString().toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    logMessage('debug', 'Extracted fields:', {
      name,
      cityIdNum,
      stateIdNum,
      countryIdNum
    });

    const isLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(cityIdNum, stateIdNum, countryIdNum);
    logMessage('debug', 'Location hierarchy check result:', isLocationHierarchyCorrectResult);
    if (!isLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    // Prepare the payload for warehouse creation
    const warehousePayload = {
      supplier: {
        connect: { id: mainSupplierId }
      },
      name,
      gst_number,
      contact_name,
      contact_number,
      address_line_1,
      address_line_2,
      city: {
        connect: {
          id: cityIdNum,
        },
      },
      state: {
        connect: {
          id: stateIdNum,
        },
      },
      country: {
        connect: {
          id: countryIdNum,
        },
      },
      postal_code,
      status,
      createdAt: new Date(),
      createdBy: supplierId,
      createdByRole: supplierRole,
    };

    logMessage('info', 'Warehouse payload created:', warehousePayload);

    const warehouseCreateResult = await createWarehouse(supplierId, String(supplierRole), warehousePayload);

    if (warehouseCreateResult?.status) {
      logMessage('info', 'Warehouse created successfully:', warehouseCreateResult.warehouse);
      return NextResponse.json({ status: true, warehouse: warehouseCreateResult.warehouse }, { status: 200 });
    }

    logMessage('error', 'Warehouse creation failed:', warehouseCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: warehouseCreateResult?.message || 'Warehouse creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Warehouse Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching warehouses');

    // Retrieve x-supplier-id and x-supplier-role from request headers
    const supplierId = Number(req.headers.get("x-supplier-id"));
    const supplierRole = req.headers.get("x-supplier-role");

    if (!supplierId || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierId: ${supplierId}`);
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    let mainSupplierId = supplierId;
    const userCheck: UserCheckResult = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['supplier', 'dropshipper', 'supplier'].includes(String(supplierRole));

    if (isStaff) {
      mainSupplierId = userCheck.supplier?.supplier?.id ?? supplierId;

      const options = {
        panel: 'Supplier',
        module: 'Warehouse',
        action: 'Trash Listing',
      };

      const staffPermissionsResult = await checkStaffPermissionStatus(options, supplierId);
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

    // Fetch all warehouses
    const warehousesResult = await getWarehousesByStatus(mainSupplierId, "deleted");

    if (warehousesResult?.status) {
      return NextResponse.json(
        { status: true, warehouses: warehousesResult.warehouses },
        { status: 200 }
      );
    }

    logMessage('warn', 'No warehouses found');
    return NextResponse.json(
      { status: false, error: "No warehouses found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching warehouses:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};