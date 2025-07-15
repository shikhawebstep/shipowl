import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface Warehouse {
    supplier: {
        connect: { id: number };
    };
    id?: number;
    slug?: string;
    name: string;
    gst_number: string;
    contact_name: string;
    contact_number: string;
    address_line_1: string;
    address_line_2: string;
    city: {
        connect: { id: number };
    };
    state: {
        connect: { id: number };
    };
    country: {
        connect: { id: number };
    };
    postal_code: string;
    status: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    createdBy?: number;
    updatedBy?: number;
    deletedBy?: number;
    createdByRole?: string | null;
    updatedByRole?: string | null;
    deletedByRole?: string | null;
}

const serializeBigInt = <T>(obj: T): T => {
    if (typeof obj === "bigint") {
        return obj.toString() as unknown as T;
    }

    if (obj instanceof Date) {
        // Return Date object unchanged, no conversion
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt) as unknown as T;
    }

    if (obj && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        ) as T;
    }

    return obj;
};

export async function generateWarehouseSlug(name: string) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let isSlugTaken = true;
    let suffix = 0;

    // Keep checking until an unused slug is found
    while (isSlugTaken) {
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { slug },
        });

        if (existingWarehouse) {
            // If the slug already exists, add a suffix (-1, -2, etc.)
            suffix++;
            slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${suffix}`;
        } else {
            // If the slug is not taken, set isSlugTaken to false to exit the loop
            isSlugTaken = false;
        }
    }

    return slug;
}

export async function createWarehouse(supplierId: number, supplierRole: string, warehouse: Warehouse) {

    try {
        const { supplier, name, gst_number, contact_name, contact_number, address_line_1, address_line_2, city, state, country, postal_code, status } = warehouse;

        // Generate a unique slug for the warehouse
        const slug = await generateWarehouseSlug(name);

        const newWarehouse = await prisma.warehouse.create({
            data: {
                supplier,
                name,
                slug,
                gst_number,
                contact_name,
                contact_number,
                address_line_1,
                address_line_2,
                city,
                state,
                country,
                postal_code,
                status,
                createdAt: new Date(),
                createdBy: supplierId,
                createdByRole: supplierRole,
            },
        });

        return { status: true, warehouse: serializeBigInt(newWarehouse) };
    } catch (error) {
        console.error(`Error creating warehouse:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateWarehouse = async (
    supplierId: number,
    supplierRole: string,
    warehouseId: number,
    data: Warehouse
) => {
    try {
        const { name, gst_number, contact_name, contact_number, address_line_1, address_line_2, city, state, country, postal_code, status } = data;

        const warehouse = await prisma.warehouse.update({
            where: { id: warehouseId }, // Assuming 'id' is the correct primary key field
            data: {
                name,
                gst_number,
                contact_name,
                contact_number,
                address_line_1,
                address_line_2,
                city,
                state,
                country,
                postal_code,
                status,
                updatedAt: new Date(),
                updatedBy: supplierId,
                updatedByRole: supplierRole,
            },
        });

        return { status: true, warehouse: serializeBigInt(warehouse) };
    } catch (error) {
        console.error("❌ updateWarehouse Error:", error);
        return { status: false, message: "Error updating warehouse" };
    }
};

// 🔵 GET BY ID
export const getWarehouseById = async (id: number) => {
    try {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
        });

        if (!warehouse) return { status: false, message: "Warehouse not found" };

        return { status: true, warehouse: serializeBigInt(warehouse) };
    } catch (error) {
        console.error("❌ getWarehouseById Error:", error);
        return { status: false, message: "Error fetching warehouse" };
    }
};

// 🟣 GET ALL
export const getAllWarehouses = async () => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            orderBy: { id: 'desc' },
        });

        return { status: true, warehouses: serializeBigInt(warehouses) };
    } catch (error) {
        console.error("❌ getAllWarehouses Error:", error);
        return { status: false, message: "Error fetching warehouses" };
    }
};

export const getWarehousesByStatus = async (supplierId: number, status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition = {};

        switch (status) {
            case "active":
                whereCondition = { supplierId, status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { supplierId, status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { supplierId, deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { supplierId, deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const warehouses = await prisma.warehouse.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        logMessage("debug", `Warehouses fetched with status ${status}:`, warehouses);

        return { status: true, warehouses: serializeBigInt(warehouses) };
    } catch (error) {
        console.error(`Error fetching warehouses by status (${status}):`, error);
        return { status: false, message: "Error fetching warehouses" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteWarehouse = async (supplierId: number, supplierRole: string, id: number) => {
    try {
        const updatedWarehouse = await prisma.warehouse.update({
            where: { id },
            data: {
                deletedBy: supplierId,
                deletedAt: new Date(),
                deletedByRole: supplierRole,
            },
        });
        return { status: true, message: "Warehouse soft deleted successfully", warehouse: serializeBigInt(updatedWarehouse) };
    } catch (error) {
        console.error("❌ softDeleteWarehouse Error:", error);
        return { status: false, message: "Error soft deleting warehouse" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted warehouse by setting deletedAt to null)
export const restoreWarehouse = async (supplierId: number, supplierRole: string, id: number) => {
    try {
        const restoredWarehouse = await prisma.warehouse.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: supplierId,   // Record the user restoring the warehouse
                updatedByRole: supplierRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "Warehouse restored successfully", warehouse: serializeBigInt(restoredWarehouse) };
    } catch (error) {
        console.error("❌ restoreWarehouse Error:", error);
        return { status: false, message: "Error restoring warehouse" };
    }
};

// 🔴 DELETE
export const deleteWarehouse = async (id: number) => {
    try {
        await prisma.warehouse.delete({ where: { id } });
        return { status: true, message: "Warehouse deleted successfully" };
    } catch (error) {
        console.error("❌ deleteWarehouse Error:", error);
        return { status: false, message: "Error deleting warehouse" };
    }
};