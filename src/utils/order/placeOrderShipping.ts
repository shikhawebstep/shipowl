import { getOrderById } from "@/app/models/order/order";
import { getProductById, getProductVariantById } from "@/app/models/admin/product/product";
import { logMessage } from "../commonUtils";

interface Result {
    status: boolean;
    message?: string;
    result?: string;
    data?: string;
}

interface ShippingProduct {
    product_sku: string;
    product_name: string;
    product_value: string;
    product_hsnsac: string;
    product_taxper: number;
    product_category: string;
    product_quantity: string;
    product_description: string;
}

interface ShippingAPIJson {
    client_order_id: string;
    consignee_emailid: string;
    consignee_pincode: string;
    consignee_mobile: string;
    consignee_phone: string;
    consignee_address1: string;
    consignee_address2: string;
    consignee_name: string;
    invoice_number: string;
    express_type: string;
    pick_address_id: string;
    return_address_id: string;
    cod_amount: string;
    tax_amount: string;
    mps: string;
    courier_type: number;
    courier_code: string;
    products: ShippingProduct[];
    address_type: string;
    payment_mode: string;
    order_amount: string;
    extra_charges: string;
    shipment_width: string[];
    shipment_height: string[];
    shipment_length: string[];
    shipment_weight: string[];
}

export async function placeOrderShipping(orderId: number): Promise<Result> {
    try {
        const orderResult = await getOrderById(orderId);

        if (!orderResult.status || !orderResult.order) {
            return {
                status: false,
                message: orderResult.message || `Order with ID ${orderId} not found.`,
            };
        }

        const order = orderResult.order;

        if (!order.items || order.items.length === 0) {
            return {
                status: false,
                message: `Order with ID ${orderId} has no items to ship.`,
            };
        }

        let totalWidth = 0, totalHeight = 0, totalLength = 0, totalWeight = 0;

        const products: ShippingProduct[] = await Promise.all(
            order.items.map(async (item) => {
                const productRes = await getProductById(item.dropshipperProductId ?? 0);
                const product = productRes?.product;

                const variantRes = await getProductVariantById(item.dropshipperProductVariantId ?? 0);
                const variant = variantRes?.variant;

                if (product) {
                    totalWidth += product.package_width ?? 0;
                    totalHeight += product.package_height ?? 0;
                    totalLength += product.package_length ?? 0;
                    totalWeight += product.chargeable_weight ?? 0;
                }

                return {
                    product_sku: (variant?.sku || "N/A").toString(),
                    product_name: product?.name || "Unknown Product",
                    product_value: "0",
                    product_hsnsac: "",
                    product_taxper: 0,
                    product_category: product?.categoryId?.toString() || "0",
                    product_quantity: item.quantity.toString(),
                    product_description: product?.description || "",
                };
            })
        );

        const orderTotal = order.items.reduce((sum, item) => sum + item.total, 0);

        const shippingPayload: ShippingAPIJson = {
            client_order_id: order.id.toString(),
            consignee_emailid: order.shippingEmail || "customer@example.com",
            consignee_pincode: order.shippingZip || "000000",
            consignee_mobile: order.shippingPhone || "0000000000",
            consignee_phone: order.billingPhone || "0000000000",
            consignee_address1: order.shippingAddress || "Address Line 1",
            consignee_address2: "",
            consignee_name: order.shippingName || "Customer Name",
            invoice_number: `INV-${order.id}`,
            express_type: "surface",
            pick_address_id: "53716",
            return_address_id: "",
            cod_amount: order.totalAmount?.toString() || "0",
            tax_amount: order.tax?.toString() || "0",
            mps: "0",
            courier_type: 1,
            courier_code: "PXDEL01",
            products,
            address_type: "Home",
            payment_mode: "Prepaid",
            order_amount: orderTotal.toFixed(2),
            extra_charges: "0",
            shipment_width: [totalWidth.toString()],
            shipment_height: [totalHeight.toString()],
            shipment_length: [totalLength.toString()],
            shipment_weight: [totalWeight.toString()],
        };

        const myHeaders = new Headers();
        myHeaders.append("access-token", "ODQxODRmNzljNDAwYzYwMjZhNWU1YWFkNmY4MDJhMDE5ZTNiOjg5NjhlOWI5OGJhZTljODhjZmNiNmQ3M2I2YTkyZmM1MzQyNzEyYTU5ZTM3MDA5NWMxZWFhZjNiNGNhNDI3ZTY4YzY4YWNmMzMyZDFjOTQ4ZDA1OTgyMWE3OTk1MWFiZGMwZTQzZTU1OTQ4Nw==");
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(shippingPayload);
        logMessage(`debug`, `shippingPayload:`, shippingPayload)

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const response = await fetch("https://app.parcelx.in/api/v3/order/create_order", requestOptions);
        const result = await response.json();

        logMessage("debug", "shipping result:", result);
        if (result?.status) {
            logMessage(`log`, "Order created successfully:", result);
            return {
                status: true,
                message: result?.message,
                result,
                data: JSON.stringify(shippingPayload),
            };
        } else {
            return {
                status: false,
                result,
                message: result.errors || result.responsemsg,
            };
        }
    } catch (error) {
        return {
            status: false,
            message: `Failed to generate shipping payload: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}
