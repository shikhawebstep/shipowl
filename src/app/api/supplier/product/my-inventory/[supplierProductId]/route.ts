import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { checkSupplierProductForSupplier, updateSupplierProduct, softDeleteSupplierProduct, restoreSupplierProduct, checkProductForSupplier } from '@/app/models/supplier/product';
import { getGlobalPermissionsByFilter } from '@/app/models/admin/globalPermission';

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
    // Extract productId directly from the URL path
    const supplierProductId = Number(req.nextUrl.pathname.split('/').pop());

    const supplierId = Number(req.headers.get('x-supplier-id'));
    const supplierRole = req.headers.get('x-supplier-role');

    logMessage('info', 'Supplier details received', { supplierId, supplierRole });

    if (!supplierId || isNaN(supplierId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing supplier ID' },
        { status: 400 }
      );
    }

    const userExistence = await isUserExist(supplierId, String(supplierRole));
    if (!userExistence.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    const productResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);
    console.log(`productResult - `, productResult);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 400 });
    }

    logMessage('info', 'Product found:', productResult.supplierProduct);
    return NextResponse.json({ status: true, message: 'Product found', supplierProduct: productResult.supplierProduct }, { status: 200 });
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
    // Extract productId directly from the URL path
    const supplierProductId = Number(req.nextUrl.pathname.split('/').pop());

    logMessage('debug', 'POST request received for product creation');

    const supplierIdHeader = req.headers.get('x-supplier-id');
    const supplierRole = req.headers.get('x-supplier-role');
    const supplierId = Number(supplierIdHeader);

    if (!supplierIdHeader || isNaN(supplierId)) {
      logMessage('warn', `Invalid supplierIdHeader: ${supplierIdHeader}`);
      return NextResponse.json({ error: 'User ID is missing or invalid in request' }, { status: 400 });
    }

    const userCheck = await isUserExist(supplierId, String(supplierRole));
    if (!userCheck.status) {
      logMessage('warn', `User not found: ${userCheck.message}`);
      return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
    }

    const globalOptions = {
      panel: 'Supplier',
      module: 'Product',
      action: 'Update',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const checkSupplierProductForSupplierResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);

    if (!checkSupplierProductForSupplierResult?.status || !checkSupplierProductForSupplierResult.existsInSupplierProduct) {
      logMessage('debug', 'checkSupplierProductForSupplierResult - ', checkSupplierProductForSupplierResult);
      return NextResponse.json({ status: true, message: checkSupplierProductForSupplierResult.message }, { status: 200 });
    }

    const requiredFields = ['productId'];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields,
      patternValidations: {
        productId: 'number',
      },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json({ status: false, error: validation.error, message: validation.message }, { status: 400 });
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || 0;
    const productId = extractNumber('productId');

    const checkProductForSupplierResult = await checkProductForSupplier(supplierId, productId);
    if (!checkProductForSupplierResult?.status || !checkProductForSupplierResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: checkProductForSupplierResult.message }, { status: 200 });
    }

    const supplierProduct = checkProductForSupplierResult.supplierProduct;

    // ✅ Validate required fields before continuing
    if (!supplierProduct?.productId || isNaN(supplierProduct?.productId)) {
      logMessage('error', 'Invalid supplierProduct: Missing productId or supplierProductId', supplierProduct);
      return NextResponse.json({ status: false, message: 'Invalid product or supplier mapping.' }, { status: 400 });
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
      productId,
      supplierId,
      variants: parsedVariants,
      createdBy: supplierId,
      createdByRole: supplierRole,
    };

    logMessage('info', 'Product payload created:', productPayload);

    const productCreateResult = await updateSupplierProduct(supplierId, String(supplierRole), supplierProductId, productPayload);

    if (productCreateResult?.status) {
      return NextResponse.json({ status: true, message: productCreateResult.message }, { status: 200 });
    }

    logMessage('error', 'Product creation failed:', productCreateResult?.message || 'Unknown error');
    return NextResponse.json(
      { status: false, error: productCreateResult?.message || 'Product creation failed' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Product Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Extract productId directly from the URL path
    const supplierProductId = Number(req.nextUrl.pathname.split('/').pop());
    const supplierId = Number(req.headers.get('x-supplier-id'));
    const supplierRole = req.headers.get('x-supplier-role');

    logMessage('info', 'Supplier details received', { supplierId, supplierRole });

    if (!supplierId || isNaN(supplierId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing supplier ID' },
        { status: 400 }
      );
    }

    const userExistence = await isUserExist(supplierId, String(supplierRole));
    if (!userExistence.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    const productResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    // Restore the product (i.e., reset deletedAt, deletedBy, deletedByRole)
    const restoreResult = await restoreSupplierProduct(supplierId, String(supplierRole), supplierProductId);

    if (restoreResult?.status) {
      logMessage('info', 'Product restored successfully:', restoreResult.restoredSupplierProduct);
      return NextResponse.json({ status: true, product: restoreResult.restoredSupplierProduct }, { status: 200 });
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
    // Extract productId directly from the URL path
    const supplierProductId = Number(req.nextUrl.pathname.split('/').pop());
    const supplierId = Number(req.headers.get('x-supplier-id'));
    const supplierRole = req.headers.get('x-supplier-role');

    logMessage('info', 'Supplier details received', { supplierId, supplierRole });

    if (!supplierId || isNaN(supplierId)) {
      return NextResponse.json(
        { status: false, error: 'Invalid or missing supplier ID' },
        { status: 400 }
      );
    }

    const userExistence = await isUserExist(supplierId, String(supplierRole));
    if (!userExistence.status) {
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    const globalOptions = {
      panel: 'Supplier',
      module: 'Product',
      action: 'Delete',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const productResult = await checkSupplierProductForSupplier(supplierId, supplierProductId);
    if (!productResult?.status || !productResult.existsInSupplierProduct) {
      return NextResponse.json({ status: true, message: productResult.message }, { status: 200 });
    }

    const result = await softDeleteSupplierProduct(Number(supplierId), String(supplierRole), supplierProductId);  // Assuming softDeleteProduct marks the product as deleted
    logMessage('info', `Soft delete request for product: ${supplierProductId}`, { supplierId });

    if (result?.status) {
      logMessage('info', `Product soft deleted successfully: ${supplierProductId}`, { supplierId });
      return NextResponse.json({ status: true, message: `Product soft deleted successfully` }, { status: 200 });
    }

    logMessage('info', `Product not found or could not be deleted: ${supplierProductId}`, { supplierId });
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