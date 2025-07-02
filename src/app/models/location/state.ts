import prisma from "@/lib/prisma";

interface State {
    id?: bigint;
    name: string;
    iso2?: string;
    type?: string;
    country: {
        connect: { id: number }; // or whatever your relation is
    };
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

export async function createState(adminId: number, adminRole: string, state: State) {

    try {
        const { name, iso2, type, country } = state;

        const newState = await prisma.state.create({
            data: {
                name,
                iso2,
                type,
                country,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        // Convert BigInt to string for serialization
        const stateWithStringBigInts = {
            ...newState,
            id: newState.id.toString(),
            countryId: newState.countryId.toString(),
        };

        return { status: true, state: stateWithStringBigInts };
    } catch (error) {
        console.error(`Error creating state:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateState = async (
    adminId: number,
    adminRole: string,
    stateId: number,
    data: State
) => {
    try {
        const { name, iso2, type, country } = data;

        // Construct the payload safely
        const updateData = {
            name,
            iso2,
            type,
            country,
            updatedBy: adminId,
            updatedAt: new Date(),
            updatedByRole: adminRole,
        };

        const state = await prisma.state.update({
            where: { id: stateId }, // Assuming 'id' is the correct primary key field
            data: updateData,
        });

        // Convert BigInt to string for serialization
        const stateWithStringBigInts = {
            ...state,
            id: state.id.toString(),
            countryId: state.countryId.toString(),
        };

        return { status: true, state: stateWithStringBigInts };
    } catch (error) {
        console.error("❌ updateState Error:", error);
        return { status: false, message: "Error updating state" };
    }
};

// 🔵 GET BY ID
export const getStateById = async (id: number) => {
    try {
        const state = await prisma.state.findUnique({
            where: { id },
        });

        if (!state) return { status: false, message: "State not found" };

        // Convert BigInt to string for serialization
        const stateWithStringBigInts = {
            ...state,
            id: state.id.toString(),
            countryId: state.countryId.toString(),
        };
        return { status: true, state: stateWithStringBigInts };
    } catch (error) {
        console.error("❌ getStateById Error:", error);
        return { status: false, message: "Error fetching state" };
    }
};

export const isStateInCountry = async (stateId: number, countryId: number) => {
    try {
        const state = await prisma.state.findUnique({
            where: { id: stateId },
            select: { countryId: true },
        });

        if (!state) {
            return { status: false, message: "State not found" };
        }

        if (state.countryId.toString() === countryId.toString()) {
            return { status: true, message: "State belongs to the specified country" };
        } else {
            return { status: false, message: "State does not belong to the specified country" };
        }
    } catch (error) {
        console.error("❌ isStateInCountry Error:", error);
        return { status: false, message: "Error checking state-country relationship" };
    }
};

// 🟣 GET ALL
export const getAllStates = async () => {
    try {
        const states = await prisma.state.findMany({
            orderBy: { name: 'asc' },
        });

        // Convert BigInt to string for serialization
        const statesWithStringBigInts = states.map(state => ({
            ...state,
            id: state.id.toString(),
            countryId: state.countryId.toString(),
        }));

        return { status: true, states: statesWithStringBigInts };
    } catch (error) {
        console.error("❌ getAllStates Error:", error);
        return { status: false, message: "Error fetching states" };
    }
};

export const getStatesByStatus = async (status: "deleted" | "notDeleted") => {
    try {
        let whereCondition = {};

        switch (status) {
            case "notDeleted":
                whereCondition = { deletedAt: null };
                break;
            case "deleted":
                whereCondition = { deletedAt: { not: null } };
                break;
            default:
                throw new Error("Invalid status");
        }

        const states = await prisma.state.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        // Convert BigInt to string for serialization
        const statesWithStringBigInts = states.map(state => ({
            ...state,
            id: state.id.toString(),
            countryId: state.countryId.toString()
        }));

        return { status: true, states: statesWithStringBigInts };
    } catch (error) {
        console.error(`Error fetching states by status (${status}):`, error);
        return { status: false, message: "Error fetching states" };
    }
};

export const getStatesByCountry = async (
    country: number,
    status: "deleted" | "notDeleted" = "notDeleted"
) => {
    try {
        const whereCondition: { countryId: number; deletedAt?: null | { not: null } } = {
            countryId: country,
            deletedAt: status === "notDeleted" ? null : { not: null },
        };

        const states = await prisma.state.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        // Convert BigInt to string for serialization
        const statesWithStringBigInts = states.map(({ id, countryId, ...state }) => ({
            ...state,
            id: id.toString(),
            countryId: countryId.toString(),
        }));

        return { status: true, states: statesWithStringBigInts };
    } catch (error) {
        console.error(`Error fetching states by status (${status}):`, error);
        return { status: false, message: "Error fetching states" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteState = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedState = await prisma.state.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "State soft deleted successfully", updatedState };
    } catch (error) {
        console.error("❌ softDeleteState Error:", error);
        return { status: false, message: "Error soft deleting state" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted state by setting deletedAt to null)
export const restoreState = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredState = await prisma.state.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the state
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Convert BigInt to string for serialization
        const stateWithStringBigInts = {
            ...restoredState,
            id: restoredState.id.toString(),
            countryId: restoredState.countryId.toString(),
        };

        return { status: true, message: "State restored successfully", state: stateWithStringBigInts };
    } catch (error) {
        console.error("❌ restoreState Error:", error);
        return { status: false, message: "Error restoring state" };
    }
};

// 🔴 DELETE
export const deleteState = async (id: number) => {
    try {
        await prisma.state.delete({ where: { id } });
        return { status: true, message: "State deleted successfully" };
    } catch (error) {
        console.error("❌ deleteState Error:", error);
        return { status: false, message: "Error deleting state" };
    }
};