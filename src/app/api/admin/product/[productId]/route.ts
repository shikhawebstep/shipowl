import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData, deleteFile } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { getBrandById } from '@/app/models/admin/brand';
import { getCategoryById } from '@/app/models/admin/category';
import { getCountryById } from '@/app/models/location/country'
import { getProductById, checkMainSKUAvailabilityForUpdate, checkVariantSKUsAvailabilityForUpdate, updateProduct, assignProductVisibilityToSuppliers, softDeleteProduct, restoreProduct } from '@/app/models/admin/product/product';
import { getSupplierById } from '@/app/models/supplier/supplier';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';

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
  role: string;
  admin?: MainAdmin;
}

interface UserCheckResult {
  status: boolean;
  message?: string;
  admin?: SupplierStaff;
}

type UploadedFileInfo = {
  originalName: string;
  savedAs: string;
  size: number;
  type: string;
  url: string;
};

interface Variant {
  id?: number;
  name?: string;
  color?: string;
  sku: string;
  suggested_price?: number;
  product_link: string;
  model: string;
}

export async function GET(req: NextRequest) {
  try {
    // Extract productId directly from the URL path
    const productId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Product ID:', productId);

    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    // let mainAdminId = adminId;
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      // mainAdminId = userCheck.admin?.admin?.id ?? adminId;

      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'View',
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

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID', { productId });
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const productResult = await getProductById(productIdNum);
    if (productResult?.status) {
      logMessage('info', 'Product found:', productResult.product);
      return NextResponse.json({ status: true, product: productResult.product }, { status: 200 });
    }

    logMessage('info', 'Product found:', productResult.product);
    return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single product:', error);
    return NextResponse.json({ status: false, error, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for product creation');

    // Extract productId directly from the URL path
    const productId = req.nextUrl.pathname.split('/').pop();
    logMessage('debug', 'Requested Product ID:', productId);

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID', { productId });
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const productResult = await getProductById(productIdNum);
    logMessage('debug', 'Product fetch result:', productResult);
    if (!productResult?.status) {
      logMessage('warn', 'Product not found', { productIdNum });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');
    const adminId = Number(adminIdHeader);

    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', `Invalid adminIdHeader: ${adminIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'Update',
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

    const requiredFields = ['name', 'category', 'main_sku', 'brand', 'origin_country', 'shipping_country'];
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

    const statusRaw = extractString('status')?.toLowerCase();
    const status = ['true', '1', true, 1, 'active', 'yes'].includes(statusRaw as string | number | boolean);

    const isVisibleToAllRaw = formData.get('isVisibleToAll')?.toString().toLowerCase();
    const isVisibleToAll = ['true', '1', true, 1, 'active', 'yes'].includes(isVisibleToAllRaw as string | number | boolean);

    const isVarientExistsRaw = formData.get('isVarientExists')?.toString().toLowerCase();
    const isVarientExists = ['true', '1', true, 1, 'active', 'yes'].includes(isVarientExistsRaw as string | number | boolean);

    let supplierIds: number[] = [];

    if (!isVisibleToAll) {
      const supplierIdsRaw = extractString('supplierIds') || '';

      // Parse and validate numeric IDs
      supplierIds = supplierIdsRaw
        .split(',')
        .map(id => Number(id.trim()))
        .filter(id => !isNaN(id) && id > 0);

      // Check if any valid IDs remain
      if (supplierIds.length === 0) {
        logMessage('warn', 'Invalid or empty supplierIds provided');
        return NextResponse.json(
          { status: false, error: 'Invalid supplierIds: must be a comma-separated list of numbers' },
          { status: 400 }
        );
      }

      // Validate each supplierId exists
      for (const id of supplierIds) {
        const supplierResult = await getSupplierById(id);
        if (!supplierResult || !supplierResult.status) {
          logMessage('error', `Supplier not found for ID: ${id}`);
          return NextResponse.json(
            { status: false, error: `Supplier with ID ${id} not found or invalid.` },
            { status: 404 }
          );
        }
      }
    }

    const main_sku = extractString('main_sku') || '';
    const { status: checkMainSKUAvailabilityResult, message: checkMainSKUAvailabilityMessage } = await checkMainSKUAvailabilityForUpdate(main_sku, productIdNum);

    if (!checkMainSKUAvailabilityResult) {
      logMessage('warn', `SKU availability check failed: ${checkMainSKUAvailabilityMessage}`);
      return NextResponse.json({ status: false, error: checkMainSKUAvailabilityMessage }, { status: 400 });
    }

    const rawVariants = extractJSON('variants');
    const imageSortingIndex = extractJSON('imageSortingIndex');

    console.log(`rawVariants`, rawVariants);
    if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
      logMessage('warn', 'Variants are not valid or empty');
      return NextResponse.json({ status: false, error: 'Variants are not valid or empty' }, { status: 400 });
    }
    const variants: Variant[] = Array.isArray(rawVariants) ? rawVariants as Variant[] : [];

    if (variants.length > 0) {
      // Ensure variants have unique SKUs
      const allUniqeSkus = new Set(variants.map((variant: { sku: string }) => variant.sku));
      if (allUniqeSkus.size !== variants.length) {
        logMessage('warn', 'Duplicate SKUs found in variants');
        return NextResponse.json({ status: false, error: 'Duplicate SKUs found in variants' }, { status: 400 });
      }

      // Map variant SKUs with optional IDs to check for availability
      const variantSKUsWithIds = variants.map((variant: { sku: string; id?: number }) => ({
        sku: variant.sku,
        id: variant.id || null
      }));

      const { status: checkVariantSKUsAvailabilityResult, message: checkVariantSKUsAvailabilityMessage } =
        await checkVariantSKUsAvailabilityForUpdate(variantSKUsWithIds, productIdNum);

      if (!checkVariantSKUsAvailabilityResult) {
        logMessage('warn', `Variant SKU availability check failed: ${checkVariantSKUsAvailabilityMessage}`);
        return NextResponse.json({ status: false, error: checkVariantSKUsAvailabilityMessage }, { status: 400 });
      }
    }

    const brandId = extractNumber('brand') || 0;
    const brandResult = await getBrandById(brandId);
    if (!brandResult?.status) {
      logMessage('info', 'Brand found:', brandResult.brand);
      return NextResponse.json({ status: false, message: brandResult.message || 'Brand not found' }, { status: 404 });
    }

    const categoryId = extractNumber('category') || 0;
    const categoryResult = await getCategoryById(categoryId);
    if (!categoryResult?.status) {
      logMessage('info', 'Category found:', categoryResult.category);
      return NextResponse.json({ status: false, message: categoryResult.message || 'Category not found' }, { status: 404 });
    }

    const originCountryId = extractNumber('origin_country') || 0;
    const originCountryResult = await getCountryById(originCountryId);
    if (!originCountryResult?.status) {
      logMessage('info', 'Country found:', originCountryResult.country);
      return NextResponse.json({ status: false, message: 'Origin Country not found' }, { status: 404 });
    }

    const shippingCountryId = extractNumber('shipping_country') || 0;
    const shippingCountryResult = await getCountryById(shippingCountryId);
    if (!shippingCountryResult?.status) {
      logMessage('info', 'Country found:', shippingCountryResult.country);
      return NextResponse.json({ status: false, message: 'Shipping Country not found' }, { status: 404 });
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'product');
    const fileFields = [
      'package_weight_image',
      'package_length_image',
      'package_width_image',
      'package_height_image',
      'product_detail_video',
      'training_guidance_video',
      'gallery'
    ];

    const uploadedFiles: Record<string, string> = {};
    for (const field of fileFields) {
      const fileData = await saveFilesFromFormData(formData, field, {
        dir: uploadDir,
        pattern: 'slug-unique',
        multiple: true,
      });

      if (fileData) {
        logMessage('info', 'uploaded fileData:', fileData);
        if (Array.isArray(fileData)) {
          uploadedFiles[field] = fileData.map((file: UploadedFileInfo) => file.url).join(', ');
        } else {
          uploadedFiles[field] = (fileData as UploadedFileInfo).url;
        }
      }
    }

    logMessage('info', 'Uploaded files:', uploadedFiles);
    const productPayload = {
      name: extractString('name') || '',
      categoryId,
      main_sku,
      hsnCode: extractString('hsn_code') || '',
      taxRate: extractNumber('tax_rate') || 0,
      rtoAddress: extractString('rto_address') || '',
      pickupAddress: extractString('pickup_address') || '',
      description: extractString('description'),
      gallery: uploadedFiles['gallery'],
      imageSortingIndex: imageSortingIndex ? JSON.stringify(imageSortingIndex) : '',
      tags: extractString('tags') || '',
      brandId: extractNumber('brand') || 0,
      originCountryId,
      shippingCountryId,
      list_as: extractString('list_as'),
      shipping_time: extractString('shipping_time'),
      weight: extractNumber('weight'),
      package_length: extractNumber('package_length'),
      package_width: extractNumber('package_width'),
      package_height: extractNumber('package_height'),
      chargeable_weight: extractNumber('chargable_weight'),
      variants,
      product_detail_video: uploadedFiles['product_detail_video'],
      status,
      isVarientExists,
      package_weight_image: uploadedFiles['package_weight_image'],
      package_length_image: uploadedFiles['package_length_image'],
      package_width_image: uploadedFiles['package_width_image'],
      package_height_image: uploadedFiles['package_height_image'],
      training_guidance_video: uploadedFiles['training_guidance_video'],
      isVisibleToAll,
      video_url: extractString('video_url'),
      updatedBy: adminId,
      updatedByRole: adminRole,
    };

    logMessage('info', 'Product payload updated:', productPayload);

    const productCreateResult = await updateProduct(adminId, String(adminRole), productIdNum, productPayload);

    if (productCreateResult?.status) {
      if (!isVisibleToAll && supplierIds.length > 0) {
        if (productCreateResult.status && productCreateResult.product) {
          const visibilityResult = await assignProductVisibilityToSuppliers(
            adminId,
            String(adminRole),
            productIdNum,
            supplierIds
          );

          if (!visibilityResult.status) {
            logMessage('error', 'Failed to assign supplier visibility:', visibilityResult.message);
            return NextResponse.json(
              { status: false, error: visibilityResult.message || 'Failed to assign supplier visibility' },
              { status: 500 }
            );
          }
        } else {
          logMessage('error', 'Product creation failed or product is undefined.');
          return NextResponse.json(
            { status: false, error: 'Product creation failed or returned incomplete data.' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ status: true, product: productCreateResult.product }, { status: 200 });
    }

    for (const fileUrl of Object.values(uploadedFiles)) {
      await deleteFile(path.join(uploadDir, path.basename(fileUrl)));
    }

    logMessage('error', 'Product creation failed:', productCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: productCreateResult?.message || 'Product creation failed' },
      { status: 500 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Product Updation Error:', error);
    return NextResponse.json(
      { status: false, error, message: 'Product Updation Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract productId directly from the URL path
    const productId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Product ID:', productId);

    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
      return NextResponse.json(
        { error: "User ID is missing or invalid in request" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'restore',
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

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID', { productId });
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const productResult = await getProductById(productIdNum);
    logMessage('debug', 'Product fetch result:', productResult);
    if (!productResult?.status) {
      logMessage('warn', 'Product not found', { productIdNum });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    // Restore the product (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreProduct(adminId, String(adminRole), productIdNum);

    if (restoreResult?.status) {
      logMessage('info', 'Product restored successfully:', restoreResult.restoredProduct);
      return NextResponse.json({ status: true, product: restoreResult.restoredProduct }, { status: 200 });
    }

    logMessage('error', 'Product restore failed');
    return NextResponse.json({ status: false, error: 'Product restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Product restore error:', error);
    return NextResponse.json({ status: false, error, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract productId directly from the URL path
    const productId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Delete Product Request:', { productId });

    // Extract admin ID and role from headers
    const adminId = Number(req.headers.get('x-admin-id'));
    const adminRole = req.headers.get('x-admin-role');

    // Validate admin ID
    if (!adminId || isNaN(Number(adminId))) {
      logMessage('warn', 'Invalid or missing admin ID', { adminId });
      return NextResponse.json({ error: 'Admin ID is missing or invalid' }, { status: 400 });
    }

    // Check if the admin user exists
    const userCheck = await isUserExist(Number(adminId), String(adminRole));
    if (!userCheck.status) {
      logMessage('warn', `Admin not found: ${userCheck.message}`, { adminId, adminRole });
      return NextResponse.json({ error: `Admin not found: ${userCheck.message}` }, { status: 404 });
    }

    const isStaff = !['admin', 'dropshipper', 'supplier'].includes(String(adminRole));

    if (isStaff) {
      const options = {
        panel: 'Admin',
        module: 'Product',
        action: 'Soft Delete',
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

    // Validate product ID
    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      logMessage('warn', 'Invalid product ID format', { productId });
      return NextResponse.json({ error: 'Product ID is invalid' }, { status: 400 });
    }

    const productResult = await getProductById(productIdNum);
    if (!productResult?.status) {
      logMessage('warn', 'Product not found', { productIdNum });
      return NextResponse.json({ status: false, message: 'Product not found' }, { status: 404 });
    }

    const result = await softDeleteProduct(Number(adminId), String(adminRole), productIdNum);  // Assuming softDeleteProduct marks the product as deleted
    logMessage('info', `Soft delete request for product: ${productIdNum}`, { adminId });

    if (result?.status) {
      logMessage('info', `Product soft deleted successfully: ${productIdNum}`, { adminId });
      return NextResponse.json({ status: true, message: `Product soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${productIdNum}`, { adminId });
    return NextResponse.json({ status: false, message: 'Product not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during product deletion', { error });
    return NextResponse.json({ status: false, error, message: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
