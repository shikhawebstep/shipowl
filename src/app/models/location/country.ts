import prisma from "@/lib/prisma";

interface Country {
    id?: bigint;
    name: string;
    iso3?: string;
    iso2?: string;
    phonecode?: string;
    currency?: string;
    currencyName?: string;
    currencySymbol?: string;
    nationality?: string;
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

export async function createCountry(adminId: number, adminRole: string, country: Country) {

    try {
        const { name, iso3, iso2, phonecode, currency, currencyName, currencySymbol, nationality } = country;

        const newCountry = await prisma.country.create({
            data: {
                name,
                iso3,
                iso2,
                phonecode,
                currency,
                currencyName,
                currencySymbol,
                nationality,
                createdAt: new Date(),
                createdBy: adminId,
                createdByRole: adminRole,
            },
        });

        // Convert BigInt to string for serialization
        const countryWithStringBigInts = {
            ...newCountry,
            id: newCountry.id.toString()
        };

        return { status: true, country: countryWithStringBigInts };
    } catch (error) {
        console.error(`Error creating country:`, error);
        return { status: false, message: "Internal Server Error" };
    }
}

// 🟡 UPDATE
export const updateCountry = async (
    adminId: number,
    adminRole: string,
    countryId: number,
    data: Country
) => {
    try {
        const { name, iso3, iso2, phonecode, currency, currencyName, currencySymbol, nationality } = data;

        // Construct the payload safely
        const updateData = {
            name,
            iso3,
            iso2,
            phonecode,
            currency,
            currencyName,
            currencySymbol,
            nationality,
            updatedBy: adminId,
            updatedAt: new Date(),
            updatedByRole: adminRole,
        };

        const country = await prisma.country.update({
            where: { id: countryId }, // Assuming 'id' is the correct primary key field
            data: updateData,
        });

        // Convert BigInt to string for serialization
        const countryWithStringBigInts = {
            ...country,
            id: country.id.toString()
        };

        return { status: true, country: countryWithStringBigInts };
    } catch (error) {
        console.error("❌ updateCountry Error:", error);
        return { status: false, message: "Error updating country" };
    }
};

// 🔵 GET BY ID
export const getCountryById = async (id: number) => {
    try {
        const country = await prisma.country.findUnique({
            where: { id },
        });

        if (!country) return { status: false, message: "Country not found" };

        // Convert BigInt to string for serialization
        const countryWithStringBigInts = {
            ...country,
            id: country.id.toString()
        };
        return { status: true, country: countryWithStringBigInts };
    } catch (error) {
        console.error("❌ getCountryById Error:", error);
        return { status: false, message: "Error fetching country" };
    }
};

// 🟣 GET ALL
export const getAllCountries = async () => {
    try {
        const countries = await prisma.country.findMany({
            orderBy: { name: 'asc' },
        });

        // Convert BigInt to string for serialization
        const countriesWithStringBigInts = countries.map(country => ({
            ...country,
            id: country.id.toString()
        }));

        return { status: true, countries: countriesWithStringBigInts };
    } catch (error) {
        console.error("❌ getAllCountries Error:", error);
        return { status: false, message: "Error fetching countries" };
    }
};

export const getCountriesByStatus = async (status: "active" | "inactive" | "deleted" | "notDeleted") => {
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

        const countries = await prisma.country.findMany({
            where: whereCondition,
            orderBy: { name: "asc" },
        });

        // Convert BigInt to string for serialization
        const countriesWithStringBigInts = countries.map(country => ({
            ...country,
            id: country.id.toString()
        }));

        return { status: true, countries: countriesWithStringBigInts };
    } catch (error) {
        console.error(`Error fetching countries by status (${status}):`, error);
        return { status: false, message: "Error fetching countries" };
    }
};

// 🔴 Soft DELETE (marks as deleted by setting deletedAt field)
export const softDeleteCountry = async (adminId: number, adminRole: string, id: number) => {
    try {
        const updatedCountry = await prisma.country.update({
            where: { id },
            data: {
                deletedBy: adminId,
                deletedAt: new Date(),
                deletedByRole: adminRole,
            },
        });
        return { status: true, message: "Country soft deleted successfully", updatedCountry };
    } catch (error) {
        console.error("❌ softDeleteCountry Error:", error);
        return { status: false, message: "Error soft deleting country" };
    }
};

// 🟢 RESTORE (Restores a soft-deleted country by setting deletedAt to null)
export const restoreCountry = async (adminId: number, adminRole: string, id: number) => {
    try {
        const restoredCountry = await prisma.country.update({
            where: { id },
            data: {
                deletedBy: null,      // Reset the deletedBy field
                deletedAt: null,      // Set deletedAt to null
                deletedByRole: null,  // Reset the deletedByRole field
                updatedBy: adminId,   // Record the user restoring the country
                updatedByRole: adminRole, // Record the role of the user
                updatedAt: new Date(), // Update the updatedAt field
            },
        });

        // Convert BigInt to string for serialization
        const countryWithStringBigInts = {
            ...restoredCountry,
            id: restoredCountry.id.toString()
        };

        return { status: true, message: "Country restored successfully", country: countryWithStringBigInts };
    } catch (error) {
        console.error("❌ restoreCountry Error:", error);
        return { status: false, message: "Error restoring country" };
    }
};

// 🔴 DELETE
export const deleteCountry = async (id: number) => {
    try {
        await prisma.country.delete({ where: { id } });
        return { status: true, message: "Country deleted successfully" };
    } catch (error) {
        console.error("❌ deleteCountry Error:", error);
        return { status: false, message: "Error deleting country" };
    }
};