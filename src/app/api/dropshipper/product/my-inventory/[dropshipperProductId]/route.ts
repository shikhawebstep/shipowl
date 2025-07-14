import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { checkDropshipperProductForDropshipper, updateDropshipperProduct, softDeleteDropshipperProduct, restoreDropshipperProduct, checkProductForDropshipper, checkSupplierProductForDropshipper } from '@/app/models/dropshipper/product';
import { getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';
import { getAppConfig } from '@/app/models/app/appConfig';
import { getGlobalPermissionsByFilter } from '@/app/models/admin/globalPermission';

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

type Variant = {
  variantId: number;
  stock: number;
  price: number;
  status?: boolean;
  errors: string[];
  index: number;
};

export async function GET(req: NextRequest) {
  try {
    // Extract supplierProductId directly from the URL path
    const dropshipperProductId = Number(req.nextUrl.pathname.split('/').pop());

    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing dropshipper ID' },
        { status: 400 }
      );
    }

    let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const productResult = await checkDropshipperProductForDropshipper(mainDropshipperId, dropshipperProductId);
    console.log(`productResult - `, productResult);
    if (!productResult?.status || !productResult.existsInDropshipperProduct) {
      const productResult = await checkSupplierProductForDropshipper(mainDropshipperId, dropshipperProductId);
      console.log(`productResult - `, productResult);
      if (!productResult?.status || !productResult.existsInSupplierProduct) {
        return NextResponse.json({ status: true, message: productResult.message }, { status: 400 });
      }

      logMessage('info', 'Product found:', productResult.supplierProduct);
      return NextResponse.json({ status: true, message: 'Product found', supplierProduct: productResult.supplierProduct, otherSuppliers: productResult.otherSuppliers, type: 'notmy' }, { status: 200 });
    }

    const shopifyAppsResult = await getShopifyStoresByDropshipperId(mainDropshipperId);

    const configResult = await getAppConfig();

    logMessage('info', 'Product found:', productResult.dropshipperProduct);
    return NextResponse.json({ status: true, message: 'Product found', dropshipperProduct: productResult.dropshipperProduct, shopifyStores: shopifyAppsResult?.shopifyStores || [], type: 'my', shippingCost: configResult?.appConfig?.shippingCost }, { status: 200 });
  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch products due to an internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract supplierProductId directly from the URL path
    const dropshipperProductId = Number(req.nextUrl.pathname.split('/').pop());

    logMessage('debug', 'POST request received for product creation');

    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');
    const dropshipperId = Number(dropshipperIdHeader);

    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', `Invalid dropshipperIdHeader: ${dropshipperIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const globalOptions = {
      panel: 'Dropshipper',
      module: 'Product',
      action: 'Update',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const checkDropshipperProductForDropshipperResult = await checkDropshipperProductForDropshipper(mainDropshipperId, dropshipperProductId);

    if (!checkDropshipperProductForDropshipperResult?.status || !checkDropshipperProductForDropshipperResult.existsInDropshipperProduct) {
      logMessage('debug', 'checkDropshipperProductForDropshipperResult - ', checkDropshipperProductForDropshipperResult);
      return NextResponse.json({ status: true, message: checkDropshipperProductForDropshipperResult.message }, { status: 200 });
    }

    const requiredFields = ['supplierProductId'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields,
      patternValidations: {
        supplierProductId: 'number',
      },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || 0;
    const supplierProductId = extractNumber('supplierProductId');

    const checkProductForDropshipperResult = await checkProductForDropshipper(mainDropshipperId, supplierProductId);
    if (!checkProductForDropshipperResult?.status || !checkProductForDropshipperResult.existsInDropshipperProduct) {
      return NextResponse.json({ status: true, message: checkProductForDropshipperResult.message }, { status: 200 });
    }

    const dropshipperProduct = checkProductForDropshipperResult.dropshipperProduct;

    // ✅ Validate required fields before continuing
    if (!dropshipperProduct?.supplierProductId || isNaN(dropshipperProduct?.supplierProductId)) {
      logMessage('error', 'Invalid dropshipperProduct: Missing supplierProductId or dropshipperProductId', dropshipperProduct);
      return NextResponse.json({ status: false, message: 'Invalid product or dropshipper mapping.' }, { status: 400 });
    }

    const rawVariants = formData.get('variants') as string | null;
    let parsedVariants: Variant[] = [];

    if (rawVariants) {
      try {
        parsedVariants = JSON.parse(rawVariants);

        if (!Array.isArray(parsedVariants)) {
          throw new Error('Variants must be an array');
        }

        // Validate and sanitize each variant
        parsedVariants = parsedVariants.map((variant, index) => {
          const errors = [];

          if (!variant.variantId || isNaN(variant.variantId)) errors.push('variantId must be a number');
          if (!variant.stock || isNaN(variant.stock)) errors.push('stock must be a number');
          if (!variant.price || isNaN(variant.price)) errors.push('price must be a number');

          return {
            variantId: Number(variant.variantId),
            stock: Number(variant.stock),
            price: Number(variant.price),
            status: typeof variant.status === 'boolean' ? variant.status : true,
            errors,
            index
          };
        });

        const variantErrors = parsedVariants.filter(v => v.errors.length > 0);
        if (variantErrors.length > 0) {
          const errorDetails = variantErrors.map(v => `Variant at index ${v.index}: ${v.errors.join(', ')}`).join('; ');
          return NextResponse.json({ status: false, message: 'Variant validation failed', error: errorDetails }, { status: 400 });
        }

      } catch (error) {
        return NextResponse.json({ status: false, message: 'Invalid variants JSON', error }, { status: 400 });
      }
    }

    const productPayload = {
      supplierProductId,
      shopifyStoreId: dropshipperProduct.shopifyStoreId,
      shopifyProductId: dropshipperProduct.shopifyProductId ?? '',
      dropshipperId: mainDropshipperId,
      variants: parsedVariants,
      createdBy: mainDropshipperId,
      createdByRole: dropshipperRole,
    };

    logMessage('info', 'Product payload created:', productPayload);

    const productCreateResult = await updateDropshipperProduct(mainDropshipperId, String(dropshipperRole), dropshipperProductId, productPayload);

    if (productCreateResult?.status) {
      return NextResponse.json({ status: true, message: productCreateResult.message }, { status: 200 });
    }

    logMessage('error', 'Product creation failed:', productCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: productCreateResult?.message || 'Product creation failed' },
      { status: 500 }
    );
  } catch (error) {
    logMessage('error', 'Product Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract supplierProductId directly from the URL path
    const dropshipperProductId = Number(req.nextUrl.pathname.split('/').pop());
    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing dropshipper ID' },
        { status: 400 }
      );
    }

    let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const productResult = await checkDropshipperProductForDropshipper(mainDropshipperId, dropshipperProductId);
    if (!productResult?.status || !productResult.existsInDropshipperProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    // Restore the product (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreDropshipperProduct(mainDropshipperId, String(dropshipperRole), dropshipperProductId);

    if (restoreResult?.status) {
      logMessage('info', 'Product restored successfully:', restoreResult.restoredDropshipperProduct);
      return NextResponse.json({ status: true, product: restoreResult.restoredDropshipperProduct }, { status: 200 });
    }

    logMessage('error', 'Product restore failed');
    return NextResponse.json({ status: false, error: 'Product restore failed' }, { status: 500 });

  } catch (error) {
    logMessage('error', '❌ Product restore error:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract supplierProductId directly from the URL path
    const dropshipperProductId = Number(req.nextUrl.pathname.split('/').pop());
    const dropshipperId = Number(req.headers.get('x-dropshipper-id'));
    const dropshipperRole = req.headers.get('x-dropshipper-role');

    logMessage('info', 'Dropshipper details received', { dropshipperId, dropshipperRole });

    if (!dropshipperId || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing dropshipper ID' },
        { status: 400 }
      );
    }

    let mainDropshipperId = dropshipperId;
    const userCheck: UserCheckResult = await isUserExist(dropshipperId, String(dropshipperRole));
    if (!userCheck.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userCheck.message}` },
        { status: 404 }
      );
    }

    const globalOptions = {
      panel: 'Dropshipper',
      module: 'Product',
      action: 'Delete',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const isStaffUser = !['admin', 'dropshipper', 'supplier'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const productResult = await checkDropshipperProductForDropshipper(mainDropshipperId, dropshipperProductId);
    if (!productResult?.status || !productResult.existsInDropshipperProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    const result = await softDeleteDropshipperProduct(Number(mainDropshipperId), String(dropshipperRole), dropshipperProductId);  // Assuming softDeleteProduct marks the product as deleted
    logMessage('info', `Soft delete request for product: ${dropshipperProductId}`, { mainDropshipperId });

    if (result?.status) {
      logMessage('info', `Product soft deleted successfully: ${dropshipperProductId}`, { mainDropshipperId });
      return NextResponse.json({ status: true, message: `Product soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${dropshipperProductId}`, { mainDropshipperId });
    return NextResponse.json({ status: false, message: 'Product not found or deletion failed' }, { status: 404 });
  } catch (error) {
    logMessage('error', 'Error during product deletion', { error });
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};