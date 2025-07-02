import prisma from "@/lib/prisma";

interface CourierCompany {
    id?: string;
    name: string;
    code: string;
    website: string;
    email: string;
    phoneNumber: string;
    flatShippingRate: number | null,
    rtoCharges: number | null,
    status: boolean;
    createdBy?: number;
    createdAt?: Date;
    createdByRole?: string;
    updatedBy?: number;
    updatedAt?: Date;
    updatedByRole?: string;
    deletedBy?: number | null;
    deletedAt?: Date;
    deletedByRole?: string | null;
}

export async function generateCourierCompanySlug(name: string) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let isSlugTaken = true;
    let suffix = 0;

    // Keep checking until an unused slug is found
    while (isSlugTaken) {
        const existingCourierCompany = await prisma.courierCompany.findUnique({
            where: { slug },
        });

        if (existingCourierCompany) {
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

export async function checkCodeAvailability(code: string) {
    try {
        const existing = await prisma.courierCompany.findUnique({
            where: { code },
        });

        if (existing) {
            return {
                status: false,
                message: `Code "${code}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `Code "${code}" is available.`,
        };
    } catch (error) {
        console.error("Error checking Code:", error);
        return {
            status: false,
            message: "Error while checking Code availability.",
        };
    }
}

export async function checkCodeAvailabilityForUpdate(code: string, courierCompanyId: number) {
    try {
        const existing = await prisma.courierCompany.findUnique({
            where: {
                code,
                NOT: {
                    id: courierCompanyId,  // Exclude the current product being updated
                },
            },

        });

        if (existing) {
            return {
                status: false,
                message: `Code "${code}" is already in use.`,
            };
        }

        return {
            status: true,
            message: `Code "${code}" is available.`,
        };
    } catch (error) {
        console.error("Error checking Code:", error);
        return {
            status: false,
            message: "Error while checking Code availability.",
        };
    }
}

export async function createCourierCompany(adminId: number, adminRole: string, courierCompany: CourierCompany) {

    try {
        const {
            name,
            code,
            website,
            email,
            phoneNumber,
            flatShippingRate,
            rtoCharges,
            status,
            createdBy,
            createdByRole,
        } = courierCompany;

        // Generate a unique slug for the courierCompany
        const slug = await generateCourierCompanySlug(name);

        const newCourierCompany = await prisma.courierCompany.create({
            data: {
                name,
                slug,
                code,
                website,
                email,
                phoneNumber,
                flatShippingRate,
                rtoCharges,
                status,
                createdAt: new Date(),
                createdBy: createdBy,
                createdByRole: createdByRole,
            },
        });

        return { status: true, courierCompany: newCourierCompany };
    } catch (error) {
        console.error(`Error creating courierCompany:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateCourierCompany = async (
    adminId: number,
    adminRole: string,
    courierCompanyId: number,
    data: CourierCompany
) => {
    try {
        const {
            name,
            code,
            website,
            email,
            phoneNumber,
            flatShippingRate,
            rtoCharges,
            status,
            updatedBy,
            updatedByRole,
        } = data;

        const courierCompany = await prisma.courierCompany.update({
            where: { id: courierCompanyId }, // Assuming 'id' is the correct primary key field
            data: {
                name,
                code,
                website,
                email,
                phoneNumber,
                flatShippingRate,
                rtoCharges,
                status,
                updatedAt: new Date(),
                updatedBy: updatedBy,
                updatedByRole: updatedByRole,
            },
        });

        return { status: true, courierCompany };
    } catch (error) {
        console.error("❌ updateCourierCompany Error:", error);
        return { status: false, message: "Error updating courierCompany" };
    }
};

// 🔵 GET BY ID
export const getCourierCompanyById = async (id: number) => {
    try {
        const courierCompany = await prisma.courierCompany.findUnique({
            where: { id },
        });

        if (!courierCompany) return { status: false, message: "CourierCompany not found" };
        return { status: true, courierCompany };
    } catch (error) {
        console.error("❌ getCourierCompanyById Error:", error);
        return { status: false, message: "Error fetching courierCompany" };
    }
};

// 🟣 GET ALL
export const getAllCourierCompanies = async () => {
    try {
        const courierCompanies = await prisma.courierCompany.findMany({
            orderBy: { id: 'desc' },
        });
        return { status: true, courierCompanies };
    } catch (error) {
        console.error("❌ getAllCourierCompanies Error:", error);
        return { status: false, message: "Error fetching courierCompanies" };
    }
};

export const getCourierCompaniesByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
    try {
        let whereCondition = {};

        switch (status) {
            case "active":
                whereCondition = { status: true, deletedAt: null };
                break;
            case "inactive":
                whereCondition = { status: false, deletedAt: null };
                break;
            case "deleted":
                whereCondition = { deletedAt: { not: null } };
                break;
            case "notDeleted":
                whereCondition = { deletedAt: null };
                break;
            default:
                throw new Error("Invalid status");
        }

        const courierCompanies = await prisma.courierCompany.findMany({
            where: whereCondition,
            orderBy: { id: "desc" },
        });

        return { status: true, courierCompanies };
    } catch (error) {
        console.error(`Error fetching courierCompanies by status (${status}):`, error);
        return { status: false, message: "Error fetching courierCompanies" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteCourierCompany = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedCourierCompany = await prisma.courierCompany.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "CourierCompany soft deleted successfully", updatedCourierCompany };
    } catch (error) {
        console.error("❌ softDeleteCourierCompany Error:", error);
        return { status: false, message: "Error soft deleting courierCompany" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted courierCompany by setting deletedAt to null)
export const restoreCourierCompany = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredCourierCompany = await prisma.courierCompany.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the courierCompany
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        return { status: true, message: "CourierCompany restored successfully", restoredCourierCompany };
    } catch (error) {
        console.error("❌ restoreCourierCompany Error:", error);
        return { status: false, message: "Error restoring courierCompany" };
    }
};

// 🔴 DELETE
export const deleteCourierCompany = async (id: number) => {
    try {
        await prisma.courierCompany.delete({ where: { id } });
        return { status: true, message: "CourierCompany deleted successfully" };
    } catch (error) {
        console.error("❌ deleteCourierCompany Error:", error);
        return { status: false, message: "Error deleting courierCompany" };
    }
};