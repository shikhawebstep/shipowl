import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { validateFormData } from '@/utils/validateFormData';
import { createDropshipperProduct, checkProductForDropshipper } from '@/app/models/dropshipper/product';
import { getProductsByFiltersAndStatus, getProductsByStatus } from '@/app/models/dropshipper/product';
import { getShopifyStoreByIdForDropshipper, getShopifyStoresByDropshipperId } from '@/app/models/dropshipper/shopify';
import { getSupplierProductVariantById } from '@/app/models/supplier/product';
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
  price: number;
  status?: boolean;
  errors: string[];
  index: number;
};

export async function GET(req: NextRequest) {
  try {
    const urlParams = req.nextUrl.searchParams;
    const categoryId = urlParams.get('category');
    const brandId = urlParams.get('brand');

    const rawStatus = (urlParams.get('status') ?? '').trim().toLowerCase();
    const rawType = (urlParams.get('type') ?? '').trim().toLowerCase();

    // Inline enum definitions
    type ProductStatus = 'active' | 'inactive' | 'deleted' | 'notDeleted';
    type ProductType = 'all' | 'my' | 'notmy';

    const statusMap: Record<string, ProductStatus> = {
      active: 'active',
      inactive: 'inactive',
      deleted: 'deleted',
      notdeleted: 'notDeleted'
    };

    const validTypes: ProductType[] = ['all', 'my', 'notmy'];

    const status: ProductStatus = statusMap[rawStatus] ?? 'notDeleted';
    const type: ProductType = validTypes.includes(rawType as ProductType) ? (rawType as ProductType) : 'all';

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

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const filters: Record<string, number> = {};
    if (categoryId) filters.categoryId = Number(categoryId);
    if (brandId) filters.brandId = Number(brandId);

    const productsResult = (categoryId || brandId)
      ? await getProductsByFiltersAndStatus(type, filters, mainDropshipperId, status)
      : await getProductsByStatus(type, mainDropshipperId, status);

    const products = productsResult.products;

    console.log(`products - `, products);
    const shopifyStoresResult = await getShopifyStoresByDropshipperId(mainDropshipperId);

    const appConfigResult = await getAppConfig();
    const appConfig = appConfigResult.appConfig;
    const shippingCost = appConfig ? appConfig.shippingCost || 0 : 0;

    return NextResponse.json(
      { status: true, products, shopifyStores: shopifyStoresResult?.shopifyStores || [], type, shippingCost },
      { status: 200 }
    );
  } catch (error) {
    logMessage('error', 'Error while fetching products', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch products due to an internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for product creation');

    const dropshipperIdHeader = req.headers.get('x-dropshipper-id');
    const dropshipperRole = req.headers.get('x-dropshipper-role');
    const dropshipperId = Number(dropshipperIdHeader);

    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      logMessage('warn', `Invalid dropshipper ID: ${dropshipperIdHeader}`);
      return NextResponse.json(
        { error: 'Missing or invalid dropshipper ID in request.' },
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
      action: 'Push to Shopify',
    };

    const globalPermissionResult = await getGlobalPermissionsByFilter(globalOptions);
    if (!globalPermissionResult.status) {
      return NextResponse.json({ status: false, message: globalPermissionResult.message }, { status: 404 }); //unauthroized
    }

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(dropshipperRole));

    if (isStaffUser) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;
    }

    const requiredFields = ['supplierProductId'];
    const formData = await req.formData();

    const validation = validateFormData(formData, {
      requiredFields,
      patternValidations: { supplierProductId: 'number' },
    });

    if (!validation.isValid) {
      logMessage('warn', 'Form validation failed', validation.error);
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const extractNumber = (key: string) => Number(formData.get(key)) || 0;
    const supplierProductId = extractNumber('supplierProductId');

    const productResult = await checkProductForDropshipper(mainDropshipperId, supplierProductId);

    // if (!productResult?.status || productResult.existsInDropshipperProduct || !productResult.product?.product) {
    if (!productResult?.status || !productResult.product?.product) {
      return NextResponse.json(
        { status: false, message: productResult.message },
        { status: 404 }
      );
    }

    const mainProduct = productResult.product?.product;

    const rawVariants = formData.get('variants') as string | null;
    let parsedVariants: Variant[] = [];

    if (rawVariants) {
      try {
        parsedVariants = JSON.parse(rawVariants);

        if (!Array.isArray(parsedVariants)) {
          throw new Error('Variants must be an array.');
        }

        const variantsWithStatus = await Promise.all(
          parsedVariants.map(async (variant, index) => {
            const errors: string[] = [];

            if (!variant.variantId || isNaN(variant.variantId)) errors.push('variantId must be a number');
            if (!variant.price || isNaN(variant.price)) errors.push('price must be a number');

            const variantResult = await getSupplierProductVariantById(variant.variantId);
            if (!variantResult.status) {
              // Skip this variant by returning null or undefined
              return null;
            }

            return {
              variantId: Number(variant.variantId),
              price: Number(variant.price),
              status: typeof variant.status === 'boolean' ? variant.status : true,
              errors,
              index,
            };
          })
        );

        // Filter out any null (invalid) variants
        parsedVariants = variantsWithStatus.filter(v => v !== null);

        const variantErrors = parsedVariants.filter(v => v.errors.length > 0);
        if (variantErrors.length > 0) {
          const errorDetails = variantErrors
            .map(v => `Variant at index ${v.index}: ${v.errors.join(', ')}`)
            .join('; ');
          return NextResponse.json(
            { status: false, message: 'Variant validation failed', error: errorDetails },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { status: false, message: 'Invalid variants JSON format.', error },
          { status: 400 }
        );
      }
    }

    const shopifyStoreId = extractNumber('shopifyStore');
    let shopifyStore;

    if (shopifyStoreId && !isNaN(shopifyStoreId)) {
      const shopifyStoreResult = await getShopifyStoreByIdForDropshipper(shopifyStoreId, mainDropshipperId);
      if (!shopifyStoreResult.status) {
        return NextResponse.json(
          { status: false, message: shopifyStoreResult.message },
          { status: 400 }
        );
      }
      shopifyStore = shopifyStoreResult.shopifyStore;
    } else {
      const shopifyStoresResult = await getShopifyStoresByDropshipperId(mainDropshipperId);

      return NextResponse.json(
        {
          status: false,
          message: 'Missing or invalid Shopify store ID. Using all stores instead.',
          shopifyStores: shopifyStoresResult.shopifyStores || [],
        },
        { status: 400 }
      );
    }

    if (!shopifyStore) {
      return NextResponse.json(
        { status: false, message: 'Shopify store data is unavailable. Please verify the input.' },
        { status: 400 }
      );
    }

    // if (productCreateResult?.status) {
    const shopDomain = shopifyStore.shop;
    const accessToken = shopifyStore.accessToken;
    const NEXT_PUBLIC_SHOPIFY_API_VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION;
    const APP_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    try {

      const shopifyImages = [
        mainProduct.package_weight_image,
        mainProduct.package_length_image,
        mainProduct.package_width_image,
        mainProduct.package_height_image
      ]
        .filter(src => typeof src === 'string' && src.trim() !== '')
        .map(src => ({ src: APP_HOST + src }));

      const shopifyProductPayload = {
        product: {
          title: mainProduct?.name,
          body_html: mainProduct?.description,
          images: shopifyImages,
          variants: parsedVariants.map(v => ({
            price: v.price.toFixed(2),
            option1: `Variant ${v.variantId}`,
          }))
        }
      };

      console.log('shopifyProductPayload - ', shopifyProductPayload);
      console.log('shopifyProductPayload.product.images - ', shopifyProductPayload.product.images);
      console.log('shopifyProductPayload.product.variants - ', shopifyProductPayload.product.variants);

      const graphqlEndpoint = `https://${shopDomain}/admin/api/${NEXT_PUBLIC_SHOPIFY_API_VERSION}/graphql.json`;

      // Step 1: Create Product
      const productCreateMutation = `
                                        mutation productCreate($input: ProductInput!) {
                                          productCreate(input: $input) {
                                            product { id }
                                            userErrors { field message }
                                          }
                                        }
                                      `;

      const productCreateVariables = {
        input: {
          title: mainProduct.name,
          descriptionHtml: mainProduct.description,
          vendor: 'App Vendor',
          productType: 'Dropship Product',
          published: true,
        },
      };

      const createResp = await axios.post(
        graphqlEndpoint,
        { query: productCreateMutation, variables: productCreateVariables },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[Shopify] Product Create Response:', JSON.stringify(createResp.data, null, 2));

      const productId = createResp.data?.data?.productCreate?.product?.id;
      const createErrors = createResp.data?.data?.productCreate?.userErrors || [];
      if (!productId || createErrors.length > 0) {
        return NextResponse.json(
          { status: false, message: 'Product creation failed', errors: createErrors },
          { status: 400 }
        );
      }

      // Step 2: Push Variants
      const variantMutation = `
                                mutation productVariantsBulkCreate($productId: ID!, $strategy: ProductVariantsBulkCreateStrategy, $variants: [ProductVariantsBulkInput!]!) {
                                  productVariantsBulkCreate(productId: $productId, strategy: $strategy, variants: $variants) {
                                    productVariants { id }
                                    userErrors { field message }
                                  }
                                }
                              `;

      const variantInputs = parsedVariants.map(v => ({
        price: v.price.toFixed(2),
        sku: `SKU-${v.variantId}`,
        option1: `Variant ${v.variantId}`,
        inventoryItem: {
          tracked: true,
        },
        barcode: null,
      }));

      const variantResp = await axios.post(
        graphqlEndpoint,
        {
          query: variantMutation,
          variables: {
            productId,
            strategy: 'REMOVE_STANDALONE_VARIANT',
            variants: variantInputs,
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('[Shopify] Variant Create Response:', JSON.stringify(variantResp.data, null, 2));

      const variantErrors = variantResp.data?.data?.productVariantsBulkCreate?.userErrors || [];
      if (variantErrors.length > 0) {
        return NextResponse.json(
          { status: false, message: 'Variant push failed', errors: variantErrors },
          { status: 400 }
        );
      }

      // Step 3: Upload Media (optional)
      const imageSources = [
        mainProduct.package_weight_image,
        mainProduct.package_length_image,
        mainProduct.package_width_image,
        mainProduct.package_height_image,
      ].filter(src => typeof src === 'string' && src.trim() !== '').map(src => APP_HOST + src);

      if (imageSources.length > 0) {
        const mediaMutation = `
                                mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
                                  productCreateMedia(productId: $productId, media: $media) {
                                    mediaUserErrors { field message }
                                  }
                                }
                              `;
        const mediaVariables = {
          productId,
          media: imageSources.map(url => ({
            originalSource: url,
            mediaContentType: 'IMAGE',
          })),
        };

        const mediaResp = await axios.post(
          graphqlEndpoint,
          { query: mediaMutation, variables: mediaVariables },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('[Shopify] Media Upload Response:', JSON.stringify(mediaResp.data, null, 2));

        const mediaErrors = mediaResp.data?.data?.productCreateMedia?.mediaUserErrors || [];
        if (mediaErrors.length > 0) {
          console.error('[Media Upload Error]', mediaErrors);
        }
      }

      const productPayload = {
        supplierProductId,
        shopifyStoreId: shopifyStore.id,
        shopifyProductId: productId,
        dropshipperId: mainDropshipperId,
        variants: parsedVariants,
        createdBy: mainDropshipperId,
        createdByRole: dropshipperRole,
      };

      logMessage('info', 'Creating product with payload:', productPayload);

      const productCreateResult = await createDropshipperProduct(
        mainDropshipperId,
        String(dropshipperRole),
        productPayload
      );

      if (!productCreateResult.status) {
        await ActivityLog(
          {
            panel: 'Dropshipper',
            module: 'Product',
            action: 'Create',
            data: productCreateResult,
            response: {
              status: false,
              message: productCreateResult?.message || 'Failed to create product',
            },
            status: false
          }, req);

        return NextResponse.json(
          {
            status: false,
            message: productCreateResult?.message || 'Failed to create product',
          },
          { status: 400 }
        );
      }

      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Product',
          action: 'Create',
          data: productCreateResult,
          response: { status: true, product: productCreateResult.product, message: 'Product pushed to Shopify' },
          status: true
        }, req);

      return NextResponse.json(
        { status: true, product: productCreateResult.product, message: 'Product pushed to Shopify' },
        { status: 200 }
      );
    } catch (error) {
      // Log the error if you have a logger or console
      console.error('Shopify API error:', error);

      await ActivityLog(
        {
          panel: 'Dropshipper',
          module: 'Product',
          action: 'Create',
          data: { oneLineSimpleMessage: error || 'Failed to create product on Shopify' },
          response: {
            status: false,
            message: 'Failed to create product on Shopify',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          status: false
        }, req);

      return NextResponse.json(
        {
          status: false,
          message: 'Failed to create product on Shopify',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    await ActivityLog(
      {
        panel: 'Dropshipper',
        module: 'Product',
        action: 'Soft Delete',
        data: { oneLineSimpleMessage: error || 'Internal Server Error' },
        response: { status: false, error: 'Server error' },
        status: false
      }, req);

    logMessage('error', 'Product Creation Exception:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};