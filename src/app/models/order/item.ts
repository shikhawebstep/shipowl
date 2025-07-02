import prisma from "@/lib/prisma";

interface Item {
  dropshipperProductId: number;
  dropshipperProductVariantId: number;
  quantity: number;
  price: number;
  total: number;
  orderId: number;
}

interface UpdateRTOInfoInput {
  orderId: number;
  status: string;
  uploadedMedia?: {
    packingGallery?: string[];
    unboxingGallery?: string[];
  };
}

interface UpdateData {
  supplierRTOResponse: string;
  packingGallery: string | null;
  unboxingGallery: string | null;
  disputeCase?: number;
}

export async function createOrderItem(items: Item[]) {
  try {
    const newOrderItems = await prisma.orderItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    return { status: true, orderItems: newOrderItems };
  } catch (error) {
    console.error(`Error creating order items:`, error);
    return { status: false, message: "Internal Server Error" };
  }
}

export async function getOrderItem(orderId: number, orderItemId: number) {
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    if (!orderItem) {
      return { status: false, message: "Order item not found" };
    }

    if (orderItem.orderId !== orderId) {
      return { status: false, message: "Order ID does not match with the order item" };
    }

    return { status: true, message: "Order item found", orderItem };
  } catch (error) {
    console.error("Error fetching order item:", error);
    return { status: false, message: "Internal Server Error" };
  }
}

export async function orderDisputeCaseTwo({
  orderId,
  status,
  uploadedMedia = {},
}: UpdateRTOInfoInput) {
  const allowedStatuses = ['received', 'not received', 'wrong item received'];

  try {
    // Validate status
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return { status: false, message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` };
    }

    // Fetch order item
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { status: false, message: "Order item not found." };
    }

    if (order.id !== orderId) {
      return { status: false, message: "Order ID does not match the order item." };
    }

    // Validation conditions
    if (!order.rtoDelivered) {
      return {
        status: false,
        message: "Cannot raise dispute. Order is not marked as RTO Delivered.",
      };
    }

    if (!order.rtoDeliveredDate) {
      return {
        status: false,
        message: "Cannot raise dispute. RTO Delivered Date is missing.",
      };
    }

    if (!order.collectedAtWarehouse) {
      return {
        status: false,
        message:
          "Dispute cannot be raised. Order has not been marked as collected at warehouse.",
      };
    }

    if (order.disputeCase === 2) {
      return {
        status: false,
        message: "Dispute Case 2 already applied for this order.",
      };
    }

    /*
      if (order.disputeCase !== 1) {
        return {
          status: false,
          message: "First apply dispute case 1 before raising level 2.",
        };
      }
    */

    // If status is 'wrong item received', validate uploadedMedia
    if (status.toLowerCase() === 'wrong item received') {
      const { packingGallery, unboxingGallery } = uploadedMedia;
      if (!packingGallery || !unboxingGallery) {
        return {
          status: false,
          message: 'Both packingGallery and unboxingGallery files must be provided when status is "wrong item received".',
        };
      }
    }

    // Prepare update data
    const updateData: UpdateData = {
      supplierRTOResponse: status,
      disputeCase: 2,
      packingGallery: null,
      unboxingGallery: null,
    };

    if (status.toLowerCase() === 'wrong item received') {
      updateData.packingGallery = JSON.stringify(uploadedMedia.packingGallery);
      updateData.unboxingGallery = JSON.stringify(uploadedMedia.unboxingGallery);
    } else {
      updateData.packingGallery = null;
      updateData.unboxingGallery = null;
    }

    // Update orderItem record
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return { status: true, message: "Order item RTO info updated successfully.", orderItem: updatedOrder };
  } catch (error) {
    console.error("Error updating order item RTO info:", error);
    return { status: false, message: "Internal Server Error" };
  }
}

export async function orderDisputeCaseOne({
  orderId,
  status,
}: UpdateRTOInfoInput) {
  const allowedStatuses = ['not received'];

  try {
    // Validate status
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return { status: false, message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` };
    }

    // Fetch order item
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { status: false, message: "Order item not found." };
    }

    if (order.id !== orderId) {
      return { status: false, message: "Order ID does not match the order item." };
    }

    // Validation conditions
    if (!order.rtoDelivered) {
      return {
        status: false,
        message: "Cannot raise dispute. Order is not marked as RTO Delivered.",
      };
    }

    if (!order.rtoDeliveredDate) {
      return {
        status: false,
        message: "Cannot raise dispute. RTO Delivered Date is missing.",
      };
    }

    if (order.collectedAtWarehouse) {
      return {
        status: false,
        message:
          "Dispute cannot be raised. Order has already been marked as collected at warehouse.",
      };
    }

    if (order.disputeCase === 2) {
      return {
        status: false,
        message: "Dispute Case 2 already applied. You cannot apply Level 1 now.",
      };
    }

    if (order.disputeCase === 1) {
      return {
        status: false,
        message: "Dispute Case 1 already raised for this order.",
      };
    }

    // Prepare update data
    const updateData: UpdateData = {
      supplierRTOResponse: status,
      packingGallery: null,
      unboxingGallery: null,
      disputeCase: 1,
    };

    // Update orderItem record
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return { status: true, message: "Order item RTO info updated successfully.", orderItem: updatedOrder };
  } catch (error) {
    console.error("Error updating order item RTO info:", error);
    return { status: false, message: "Internal Server Error" };
  }
}