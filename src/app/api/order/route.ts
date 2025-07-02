import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bwipjs from 'bwip-js';
import fs from 'fs/promises';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";

import { isLocationHierarchyCorrect } from '@/app/models/location/city';
import { checkPaymentIdAvailability, createOrder, getOrdersByStatus, updateBarcodeOfOrder } from '@/app/models/order/order';
import { createOrderItem } from '@/app/models/order/item';
import { getDropshipperProductById, getDropshipperProductVariantById } from '@/app/models/dropshipper/product';
import { validateFormData } from '@/utils/validateFormData';
// import { placeOrderShipping } from '@/utils/order/placeOrderShipping';

interface Item {
  dropshipperProductId: number;
  dropshipperProductVariantId: number;
  dropshipper: {
    connect: { id: number }; // City ID for permanent city (connected to a city record)
  };
  supplierProductId: number;
  supplierProductVariantId: number;
  supplier: {
    connect: { id: number }; // City ID for permanent city (connected to a city record)
  };
  quantity: number;
  price: number;
  total: number;
  orderId: number;
}

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for order creation');

    const requiredFields = [
      'subtotal',
      'tax',
      'discount',
      'totalAmount',
      'currency',
      'shippingName',
      'shippingPhone',
      'shippingEmail',
      'shippingAddress',
      'shippingZip',
      'shippingCountry',
      'shippingState',
      'shippingCity',
      'billingName',
      'billingPhone',
      'billingEmail',
      'billingAddress',
      'billingZip',
      'billingCountry',
      'billingState',
      'billingCity',
      'payment'
    ];
    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: requiredFields,
      patternValidations: {
        subtotal: 'number',
        tax: 'number',
        discount: 'number',
        totalAmount: 'number',
        currency: 'string',
        shippingName: 'string',
        shippingPhone: 'string',
        shippingEmail: 'string',
        shippingAddress: 'string',
        shippingZip: 'string',
        shippingCountry: 'number',
        shippingState: 'number',
        shippingCity: 'number',
        billingName: 'string',
        billingPhone: 'string',
        billingEmail: 'string',
        billingAddress: 'string',
        billingZip: 'string',
        billingCountry: 'number',
        billingState: 'number',
        billingCity: 'number',
        payment: 'number',
      },
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

    const paymentIdNum = Number(extractNumber('payment'));
    if (isNaN(paymentIdNum)) {
      logMessage('warn', 'Invalid Payment ID', { paymentIdNum });
      return NextResponse.json({ error: 'Invalid Payment ID' }, { status: 400 });
    }

    const PaymentResult = await checkPaymentIdAvailability(paymentIdNum);
    if (!PaymentResult?.status) {
      logMessage('warn', 'Payment not found', { paymentIdNum });
      return NextResponse.json({ status: false, message: PaymentResult.message || 'Payment not found' }, { status: 404 });
    }

    const shippingCountryId = extractNumber('shippingCountry') || 0;
    const shippingStateId = extractNumber('shippingState') || 0;
    const shippingCityId = extractNumber('shippingCity') || 0;

    const isShippingLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(shippingCityId, shippingStateId, shippingCountryId);
    logMessage('debug', 'Location hierarchy check result:', isShippingLocationHierarchyCorrectResult);
    if (!isShippingLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isShippingLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isShippingLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    const billingCountryId = extractNumber('billingCountry') || 0;
    const billingStateId = extractNumber('billingState') || 0;
    const billingCityId = extractNumber('billingCity') || 0;

    const isbillingLocationHierarchyCorrectResult = await isLocationHierarchyCorrect(billingCityId, billingStateId, billingCountryId);
    logMessage('debug', 'Location hierarchy check result:', isbillingLocationHierarchyCorrectResult);
    if (!isbillingLocationHierarchyCorrectResult.status) {
      logMessage('warn', `Location hierarchy is incorrect: ${isbillingLocationHierarchyCorrectResult.message}`);
      return NextResponse.json(
        { status: false, message: isbillingLocationHierarchyCorrectResult.message || 'Location hierarchy is incorrect' },
        { status: 400 }
      );
    }

    const rawItems = extractJSON('items');

    console.log(`rawItems`, rawItems);
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      logMessage('warn', 'Variants are not valid or empty');
      return NextResponse.json({ status: false, error: 'Variants are not valid or empty' }, { status: 400 });
    }
    const items: Item[] = Array.isArray(rawItems) ? rawItems as Item[] : [];

    console.log(`items - `, items);

    const orderPayload = {
      status: 'pending',
      orderNote: extractString('orderNote') || '',
      subtotal: extractNumber('subtotal') || 0,
      tax: extractNumber('tax') || 0,
      discount: extractNumber('discount') || 0,
      totalAmount: extractNumber('totalAmount') || 0,
      currency: extractString('currency') || 'INR',
      shippingName: extractString('shippingName') || '',
      shippingPhone: extractString('shippingPhone') || '',
      shippingEmail: extractString('shippingEmail') || '',
      shippingAddress: extractString('shippingAddress') || '',
      shippingZip: extractString('shippingZip') || '',
      shippingCountry: {
        connect: {
          id: shippingCountryId,
        },
      },
      shippingState: {
        connect: {
          id: shippingStateId,
        },
      },
      shippingCity: {
        connect: {
          id: shippingCityId,
        },
      },
      billingName: extractString('billingName') || '',
      billingPhone: extractString('billingPhone') || '',
      billingEmail: extractString('billingEmail') || '',
      billingAddress: extractString('billingAddress') || '',
      billingZip: extractString('billingZip') || '',
      billingCountry: {
        connect: {
          id: billingCountryId,
        },
      },
      billingState: {
        connect: {
          id: billingStateId,
        },
      },
      billingCity: {
        connect: {
          id: billingCityId,
        },
      },
      payment: {
        connect: {
          id: paymentIdNum,
        },
      }
    };

    logMessage('info', 'Order payload created:', orderPayload);

    const orderCreateResult = await createOrder(orderPayload);

    if (!orderCreateResult || !orderCreateResult.status || !orderCreateResult.order) {
      logMessage('error', 'Order creation failed:', orderCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: orderCreateResult?.message || 'Order creation failed' }, { status: 500 });
    }

    const order = orderCreateResult.order;

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'order', 'bar-code');

    // Generate a barcode based on brand name
    const barcodeFileName = `barcode-${Date.now()}.png`;
    const barcodePath = path.join(uploadDir, barcodeFileName);
    const barcodePublicPath = `/uploads/brand/${barcodeFileName}`;

    try {
      // Ensure folder exists
      const barcodeDir = path.dirname(barcodePath);
      await fs.mkdir(barcodeDir, { recursive: true });

      // Generate barcode
      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',             // Barcode type
        text: order.orderNumber,     // Barcode text
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });

      // Save the buffer as a PNG file
      await fs.writeFile(barcodePath, pngBuffer);
      logMessage('info', `Barcode image saved: ${barcodePublicPath}`);
    } catch (barcodeErr) {
      logMessage('error', 'Barcode generation failed:', barcodeErr);
    }
    const updateBarcodeOfOrderResult = await updateBarcodeOfOrder(order.id, barcodePublicPath);

    if (!updateBarcodeOfOrderResult || !updateBarcodeOfOrderResult.status || !updateBarcodeOfOrderResult.order) {
      logMessage('error', 'Order barcode updation failed:', updateBarcodeOfOrderResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: updateBarcodeOfOrderResult?.message || 'Order barcode updation failed' }, { status: 500 });
    }

    const orderItemPayload: Item[] = [];

    for (const item of items) {
      const dropshipperProductId = Number(item.dropshipperProductId);
      const dropshipperProductVariantId = Number(item.dropshipperProductVariantId);

      const [productExists, variantExists] = await Promise.all([
        await getDropshipperProductById(dropshipperProductId),
        await getDropshipperProductVariantById(dropshipperProductVariantId),
      ]);

      if (!productExists.status || !variantExists.status) {
        console.warn(`Skipping item with invalid product or variant:`, item);
        continue;
      }

      const dropshipperProduct = productExists.dropshipperProduct;
      const dropshipperVariant = variantExists.variant;

      orderItemPayload.push({
        dropshipperProductId,
        dropshipperProductVariantId,
        dropshipper: {
          connect: {
            id: dropshipperProduct?.dropshipperId || 0,
          },
        },
        supplierProductId: dropshipperProduct?.supplierProductId || 0,
        supplierProductVariantId: dropshipperVariant?.supplierProductVariantId || 0,
        supplier: {
          connect: {
            id: dropshipperProduct?.supplierId || 0,
          },
        },
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.total),
        orderId: orderCreateResult.order.id,
      });
    }

    logMessage('info', 'Order payload created:', orderItemPayload);

    const orderItemCreateResult = await createOrderItem(orderItemPayload);

    if (!orderItemCreateResult || !orderItemCreateResult.status || !orderItemCreateResult.orderItems) {
      logMessage('error', 'Order creation failed:', orderItemCreateResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: orderItemCreateResult?.message || 'Order creation failed' }, { status: 500 });
    }

    /*
    const placeOrderShippingResult = await placeOrderShipping(orderCreateResult.order.id);
    logMessage('info', 'Order shipping created:', placeOrderShippingResult);

    if (!placeOrderShippingResult || !placeOrderShippingResult.status) {
      logMessage('error', 'Order shipping creation failed:', placeOrderShippingResult?.message || 'Unknown error');
      return NextResponse.json({ status: false, error: placeOrderShippingResult?.message || 'Order shipping creation failed' }, { status: 500 });
    }
    logMessage('info', 'Order created successfully:', orderCreateResult.order);

    return NextResponse.json(
      { status: true, error: placeOrderShippingResult?.message || 'Order created Successfuly' },
      { status: 200 }
    );
    */

    return NextResponse.json(
      { status: true, error: orderItemCreateResult?.message || 'Order created Successfuly' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    logMessage('error', 'Order Creation Error:', error);
    return NextResponse.json({ status: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {

    // Retrieve admin details from request headers
    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    // Log admin info
    logMessage('info', 'Admin details received', { adminIdHeader, adminRole });

    // Validate adminId
    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid admin ID received', { adminIdHeader });
      return NextResponse.json(
        { status: false, error: 'Invalid or missing admin ID' },
        { status: 400 }
      );
    }

    // Check if the admin exists
    const userExistence = await isUserExist(adminId, String(adminRole));
    if (!userExistence.status) {
      logMessage('warn', 'Admin user not found', { adminId, adminRole });
      return NextResponse.json(
        { status: false, error: `User Not Found: ${userExistence.message}` },
        { status: 404 }
      );
    }

    // Fetch orders based on filters
    const ordersResult = await getOrdersByStatus('notDeleted');

    // Handle response based on orders result
    if (ordersResult?.status) {
      return NextResponse.json(
        { status: true, orders: ordersResult.orders },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, error: 'No orders found' },
      { status: 404 }
    );
  } catch (error) {
    // Log and handle any unexpected errors
    logMessage('error', 'Error while fetching orders', { error });
    return NextResponse.json(
      { status: false, error: 'Failed to fetch orders due to an internal error' },
      { status: 500 }
    );
  }
}
