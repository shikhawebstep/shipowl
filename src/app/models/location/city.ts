import prisma from "@/lib/prisma";
import { logMessage } from "@/utils/commonUtils";

interface City {
    id?: bigint;
    name: string;
    state: {
        connect: { id: number }; // or whatever your relation is
    };
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

export async function createCity(adminId: number, adminRole: string, city: City) {

    try {
        const { name, state, country } = city;

        const newCity = await prisma.city.create({
            data: {
                name,
                state,
                country,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        // Convert BigInt to string for serialization
        const cityWithStringBigInts = {
            ...newCity,
            id: newCity.id.toString(),
            stateId: newCity.stateId.toString(),
            countryId: newCity.countryId.toString(),
        };

        return { status: true, city: cityWithStringBigInts };
    } catch (error) {
        console.error(`Error creating city:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateCity = async (
    adminId: number,
    adminRole: string,
    cityId: number,
    data: City
) => {
    try {
        const { name, state, country } = data;

        // Construct the payload safely
        const updateData = {
            name,
            state,
            country,
            updatedBy: adminId,
            updatedAt: new Date(),
            updatedByRole: adminRole,
        };

        const city = await prisma.city.update({
            where: { id: cityId }, // Assuming 'id' is the correct primary key field
            data: updateData,
        });

        // Convert BigInt to string for serialization
        const cityWithStringBigInts = {
            ...city,
            id: city.id.toString(),
            stateId: city.stateId.toString(),
            countryId: city.countryId.toString(),
        };

        return { status: true, city: cityWithStringBigInts };
    } catch (error) {
        console.error("❌ updateCity Error:", error);
        return { status: false, message: "Error updating city" };
    }
};

// 🔵 GET BY ID
export const getCityById = async (id: number) => {
    try {
        const city = await prisma.city.findUnique({
            where: { id },
        });

        if (!city) return { status: false, message: "City not found" };

        // Convert BigInt to string for serialization
        const cityWithStringBigInts = {
            ...city,
            id: city.id.toString(),
            stateId: city.stateId.toString(),
            countryId: city.countryId.toString(),
        };
        return { status: true, city: cityWithStringBigInts };
    } catch (error) {
        console.error("❌ getCityById Error:", error);
        return { status: false, message: "Error fetching city" };
    }
};

// 🟣 GET ALL
export const getAllCities = async () => {
    try {
        const cities = await prisma.city.findMany({
            orderBy: { name: 'asc' },
        });

        // Convert BigInt to string for serialization
        const citiesWithStringBigInts = cities.map(city => ({
            ...city,
            id: city.id.toString(),
            stateId: city.stateId.toString(),
            countryId: city.countryId.toString(),
        }));

        return { status: true, cities: citiesWithStringBigInts };
    } catch (error) {
        console.error("❌ getAllCities Error:", error);
        return { status: false, message: "Error fetching cities" };
    }
};

export const getCitiesByStatus = async (status: "deleted" | "notDeleted" = "notDeleted") => {
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

        const cities = await prisma.city.findMany({
            where: whereCondition,
            orderBy: { name: "asc" }
        });

        // Convert BigInt to string for serialization
        const citiesWithStringBigInts = cities.map(city => ({
            ...city,
            id: city.id.toString(),
            stateId: city.stateId.toString(),
            countryId: city.countryId.toString(),
        }));

        return { status: true, cities: citiesWithStringBigInts };
    } catch (error) {
        console.error(`Error fetching cities by status (${status}):`, error);
        return { status: false, message: "Error fetching cities" };
    }
};

export const getCitiesByState = async (
    state: number,
    status: "deleted" | "notDeleted" = "notDeleted"
) => {
    try {
        const whereCondition: { stateId: number; deletedAt?: null | { not: null } } = {
            stateId: state,
            deletedAt: status === "notDeleted" ? null : { not: null },
        };

        const cities = await prisma.city.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        // Convert BigInt to string for serialization
        const citiesWithStringBigInts = cities.map(({ id, stateId, countryId, ...city }) => ({
            ...city,
            id: id.toString(),
            stateId: stateId.toString(),
            countryId: countryId.toString(),
        }));

        return { status: true, cities: citiesWithStringBigInts };
    } catch (error) {
        console.error(`Error fetching cities by status (${status}):`, error);
        return { status: false, message: "Error fetching cities" };
    }
};

export const isLocationHierarchyCorrect = async (
    cityId: number,
    stateId: number,
    countryId: number,
) => {
    try {
        // First, check if the country exists
        const country = await prisma.country.findUnique({
            where: { id: countryId },
        });

        if (!country) {
            logMessage("debug", `Country not found for ID: ${countryId}`);
            return { status: false, message: "We couldn't find a country with the given ID. Please check and try again." };
        }
        logMessage("debug", `Country found:`, country);

        // Next, check if the state exists in the given country
        const state = await prisma.state.findUnique({
            where: { id: stateId },
            include: { country: true }, // Include country to verify relationship
        });

        if (!state) {
            logMessage("debug", `State not found for ID: ${stateId}`);
            return { status: false, message: "We couldn't find a state with the given ID. Please check the state ID and try again." };
        }

        if (state.countryId.toString() !== countryId.toString()) {
            logMessage("debug", `State ID ${stateId} does not belong to country ID ${countryId}`);
            return { status: false, message: "This state does not belong to the specified country. Please verify the state and country relationship." };
        }
        logMessage("debug", `State found and belongs to the country:`, state);

        // Finally, check if the city exists in the given state
        const city = await prisma.city.findUnique({
            where: { id: cityId },
            include: { state: true }, // Include state to verify relationship
        });

        if (!city) {
            logMessage("debug", `City not found for ID: ${cityId}`);
            return { status: false, message: "We couldn't find a city with the given ID. Please check the city ID and try again." };
        }

        if (city.stateId.toString() !== stateId.toString()) {
            logMessage("debug", `City ID ${cityId} does not belong to state ID ${stateId}`);
            return { status: false, message: "This city does not belong to the specified state. Please verify the city and state relationship." };
        }
        logMessage("debug", `City found and belongs to the state:`, city);

        // If all checks pass, return the linked data
        logMessage("debug", "Successfully validated the hierarchy: city, state, and country.");
        return {
            status: true,
            message: "Successfully found the linked city, state, and country.",
            data: {
                country: { id: country.id.toString(), name: country.name },
                state: { id: state.id.toString(), name: state.name },
                city: { id: city.id.toString(), name: city.name },
            },
        };

    } catch (error) {
        console.error("Error fetching city, state, and country details:", error);
        logMessage("debug", "Error fetching city, state, and country details:", error);
        return { status: false, message: "There was an error while retrieving the location hierarchy. Please try again later." };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteCity = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedCity = await prisma.city.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "City soft deleted successfully", updatedCity };
    } catch (error) {
        console.error("❌ softDeleteCity Error:", error);
        return { status: false, message: "Error soft deleting city" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted city by setting deletedAt to null)
export const restoreCity = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredCity = await prisma.city.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the city
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Convert BigInt to string for serialization
        const cityWithStringBigInts = {
            ...restoredCity,
            id: restoredCity.id.toString(),
            stateId: restoredCity.stateId.toString(),
            countryId: restoredCity.countryId.toString(),
        };

        return { status: true, message: "City restored successfully", city: cityWithStringBigInts };
    } catch (error) {
        console.error("❌ restoreCity Error:", error);
        return { status: false, message: "Error restoring city" };
    }
};

// 🔴 DELETE
export const deleteCity = async (id: number) => {
    try {
        await prisma.city.delete({ where: { id } });
        return { status: true, message: "City deleted successfully" };
    } catch (error) {
        console.error("❌ deleteCity Error:", error);
        return { status: false, message: "Error deleting city" };
    }
};