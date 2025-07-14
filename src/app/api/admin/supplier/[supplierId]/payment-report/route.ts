import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from '@/utils/commonUtils';
import { isUserExist } from '@/utils/auth/authUtils';
import { getOrdersByStatusForSupplierReporting } from '@/app/models/order/order';
import { getAppConfig } from '@/app/models/app/appConfig';
import { getSupplierById } from '@/app/models/supplier/supplier';
import { checkStaffPermissionStatus, getRolePermissionsByStaffId } from '@/app/models/staffPermission';

type Permission = {
  permission: {
    module: string;
    action: string;
    // other fields inside permission
  };
  // other fields outside permission
};

export async function GET(req: NextRequest) {
  try {
    const pathSegments = req.nextUrl.pathname.split('/');
    const supplierIdRaw = pathSegments[pathSegments.length - 2];
    const supplierId = Number(supplierIdRaw);

    logMessage('debug', 'Supplier ID extracted from path', { supplierId });

    const adminIdHeader = req.headers.get('x-admin-id');
    const adminRole = req.headers.get('x-admin-role');

    logMessage('info', 'Admin headers received', { adminIdHeader, adminRole });

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
      logMessage('warn', 'Invalid admin ID', { adminIdHeader });
      return NextResponse.json({ status: false, error: 'Invalid or missing admin ID' }, { status: 400 });
    }

    const userValidation = await isUserExist(adminId, String(adminRole));
    if (!userValidation.status) {
      logMessage('warn', 'User not found', { adminId, adminRole });
      return NextResponse.json({ status: false, error: `User Not Found: ${userValidation.message}` }, { status: 404 });
    }

    const isStaffUser = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    let assignedPermissions: Permission[] = [];
    let staffPermissionApplied = false;

    if (isStaffUser) {
      const supplierPermissionCheck = await checkStaffPermissionStatus({
        panel: 'Admin',
        module: 'Supplier',
        action: 'Orders',
      }, adminId);

      logMessage('info', 'Supplier permissions result', supplierPermissionCheck);

      if (!supplierPermissionCheck.status) {
        return NextResponse.json({
          status: false,
          message: supplierPermissionCheck.message || "You do not have permission to perform this action."
        }, { status: 403 });
      }

      const orderVariablePermissionCheck = await getRolePermissionsByStaffId({
        panel: 'Admin',
        module: 'Order Variables'
      }, adminId);

      staffPermissionApplied = true;
      assignedPermissions = orderVariablePermissionCheck?.assignedPermissions || [];
    }

    if (isNaN(supplierId)) {
      logMessage('warn', 'Invalid supplier ID format', { supplierIdRaw });
      return NextResponse.json({ status: false, error: 'Supplier ID is invalid' }, { status: 400 });
    }

    const supplier = await getSupplierById(supplierId);
    if (!supplier?.status) {
      logMessage('warn', 'Supplier not found', { supplierId });
      return NextResponse.json({ status: false, error: 'Supplier not found' }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const fromDateRaw = searchParams.get('from');
    const toDateRaw = searchParams.get('to');

    const parseDate = (dateStr: string | null): string | null => {
      if (!dateStr) return null;

      const patterns = [
        /^(\d{2})-(\d{2})-(\d{4})$/,
        /^(\d{4})-(\d{2})-(\d{2})$/,
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
        /^(\d{4})\/(\d{2})\/(\d{2})$/,
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          const [, a, b, c] = match;
          const [year, month, day] = pattern.source.startsWith('^\d{4}') ? [a, b, c] : [c, b, a];
          const date = new Date(`${year}-${month}-${day}`);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }

      logMessage('warn', 'Failed to parse date', { dateStr });
      return null;
    };

    const fromDate = parseDate(fromDateRaw) || '';
    const toDate = parseDate(toDateRaw) || '';

    const orderData = await getOrdersByStatusForSupplierReporting('deliveredOrRto', supplierId, fromDate, toDate);

    if (!orderData?.status || !orderData.orders?.length) {
      return NextResponse.json({ status: false, error: 'No orders found' }, { status: 404 });
    }

    const configData = await getAppConfig();
    if (!configData.status || !configData.appConfig) {
      return NextResponse.json({ status: false, error: 'No app config found' }, { status: 404 });
    }

    const analytics = {
      shipowl: { orderCount: 0, totalProductCost: 0, deliveredOrder: 0, rtoOrder: 0 },
      selfship: {
        prepaid: { orderCount: 0, totalProductCost: 0, deliveredOrder: 0, rtoOrder: 0 },
        postpaid: { orderCount: 0, totalProductCost: 0, deliveredOrder: 0, rtoOrder: 0 },
      },
    };

    for (const order of orderData.orders) {
      const items = order.items || [];
      const type: 'prepaid' | 'postpaid' = order.isPostpaid ? 'postpaid' : 'prepaid';

      let isShipowl = false;

      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const variant = item.dropshipperVariant?.supplierProductVariant;

        if (!variant) continue;

        const shippingMethod = variant.variant?.model?.toLowerCase() || '';

        if (shippingMethod === 'shipowl') {
          isShipowl = true;
          if (order.delivered) {
            analytics.shipowl.deliveredOrder++;
            analytics.shipowl.totalProductCost += qty * (variant.price || 0);
          } else if (order.rtoDelivered) {
            analytics.shipowl.rtoOrder++;
          }
        } else if (shippingMethod === 'selfship') {
          const section = analytics.selfship[type];
          section.deliveredOrder++;
          section.totalProductCost += qty * (variant.price || 0);
        }
      }

      if (isShipowl) analytics.shipowl.orderCount++;
    }

    return NextResponse.json({
      status: true,
      reportAnalytics: analytics,
      orders: orderData.orders,
      staffPermissionApplied,
      assignedPermissions,
    }, { status: 200 });
  } catch (error) {
    logMessage('error', 'Internal error occurred', { error });
    return NextResponse.json({ status: false, error: 'Failed to fetch orders due to an internal error' }, { status: 500 });
  }
}