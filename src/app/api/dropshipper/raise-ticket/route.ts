import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { saveFilesFromFormData } from '@/utils/saveFiles';
import { validateFormData } from '@/utils/validateFormData';
import { checkStaffPermissionStatus } from '@/app/models/staffPermission';
import { createRaiseTicket, createTicketOrder, getRaiseTicketsList } from '@/app/models/dropshipper/raiseTicket';
import { getDropshipperOrderById } from '@/app/models/dropshipper/order';

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

export async function POST(req: NextRequest) {
  try {
    logMessage('debug', 'POST request received for Raise Ticket creation');

    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid" },
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

    const isStaff = !['dropshipper', 'supplier'].includes(String(dropshipperRole));
    if (isStaff) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;

      const permissionCheck = await checkStaffPermissionStatus({
        panel: 'Dropshipper',
        module: 'raise-ticket',
        action: 'Create',
      }, dropshipperId);

      if (!permissionCheck.status) {
        return NextResponse.json(
          { status: false, message: permissionCheck.message || "Permission denied" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();
    const validation = validateFormData(formData, {
      requiredFields: ['orders', 'description'],
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { status: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const orders = formData.get('orders') as string;
    const orderIds = orders?.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) || [];
    const description = (formData.get('description') as string) || '';

    const isMultipleImages = true;
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'dropshipper', `${mainDropshipperId}`, 'raise-ticket');
    const fileData = await saveFilesFromFormData(formData, 'gallery', {
      dir: uploadDir,
      pattern: 'slug-unique',
      multiple: isMultipleImages,
    });

    let gallery = '';

    if (fileData) {
      logMessage('info', 'uploaded fileData:', fileData);
      gallery = isMultipleImages
        ? (fileData as UploadedFileInfo[]).map(file => file.url).join(', ')
        : (fileData as UploadedFileInfo).url;
    }

    const raiseTicketPayload = {
      dropshipper: { connect: { id: mainDropshipperId } },
      description,
      gallery,
      createdBy: dropshipperId,
      createdAt: new Date(),
    };

    const raiseTicketResult = await createRaiseTicket(mainDropshipperId, String(dropshipperRole), raiseTicketPayload);

    if (!raiseTicketResult.status || !raiseTicketResult.raiseTicket) {
      return NextResponse.json(
        { status: false, message: raiseTicketResult.message || 'Raise Ticket creation failed' },
        { status: 500 }
      );
    }

    const raiseTicket = raiseTicketResult.raiseTicket;
    const mappedOrders: number[] = [];
    const failedOrders: { orderId: number, message: string }[] = [];

    for (const orderId of orderIds) {
      const orderResult = await getDropshipperOrderById(mainDropshipperId, orderId);

      if (!orderResult.status || !orderResult.order) {
        failedOrders.push({
          orderId,
          message: orderResult.message || 'Order not found or not authorized',
        });
        continue;
      }

      const ticketOrderPayload = {
        raiseTicket: { connect: { id: raiseTicket.id } },
        order: { connect: { id: orderId } }
      };

      const result = await createTicketOrder(mainDropshipperId, String(dropshipperRole), ticketOrderPayload);
      if (result.status) {
        mappedOrders.push(orderId);
      } else {
        failedOrders.push({
          orderId,
          message: result.message || 'Ticket mapping failed',
        });
      }
    }

    logMessage('info', 'Raise Ticket created successfully');

    return NextResponse.json({
      status: true,
      message: "Raise Ticket created successfully",
      data: {
        ticket: raiseTicket,
        mappedOrders,
        failedOrders,
      }
    });

  } catch (error) {
    logMessage('error', 'Raise Ticket Creation Error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal Server Error', error },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for Raise Ticket list');

    const dropshipperIdHeader = req.headers.get("x-dropshipper-id");
    const dropshipperRole = req.headers.get("x-dropshipper-role");

    const dropshipperId = Number(dropshipperIdHeader);
    if (!dropshipperIdHeader || isNaN(dropshipperId)) {
      return NextResponse.json(
        { status: false, error: "User ID is missing or invalid" },
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

    const isStaff = !['dropshipper', 'supplier'].includes(String(dropshipperRole));
    if (isStaff) {
      mainDropshipperId = userCheck.admin?.admin?.id ?? dropshipperId;

      const permissionCheck = await checkStaffPermissionStatus({
        panel: 'Dropshipper',
        module: 'raise-ticket',
        action: 'Read',
      }, dropshipperId);

      if (!permissionCheck.status) {
        return NextResponse.json(
          { status: false, message: permissionCheck.message || "Permission denied" },
          { status: 403 }
        );
      }
    }

    // Optional: handle pagination
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    // Optional: handle filtering (you can expand this)
    const search = searchParams.get('search') || '';

    // Assuming this function is implemented in your models
    const result = await getRaiseTicketsList({
      dropshipperId: mainDropshipperId,
      search,
      page,
      limit
    });

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message || "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Raise Tickets fetched successfully",
      data: result.data
    });

  } catch (error) {
    logMessage('error', 'Raise Ticket List Error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal Server Error', error },
      { status: 500 }
    );
  }
}
