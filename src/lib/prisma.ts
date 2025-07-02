import { PrismaClient } from "../../prisma/prisma/generated/client"; // Adjust the import path as necessary

const prisma = new PrismaClient();

async function connectToDatabase() {
    try {
        // Attempt to connect to the database
        await prisma.$connect();
        console.log("Database connection established successfully.");
    } catch (error) {
        // If connection fails, log the error
        console.error("Database connection failed:", error);
        // Avoid using process.exit in Edge Runtime
        // Instead, you can throw an error to be handled by the calling code
        throw new Error("Database connection failed");
    }
}

connectToDatabase().catch((error) => {
    // Handle any unhandled promise rejections here, if necessary
    console.error(error);
    // You can choose to return a response or perform other actions instead of exiting
});

export default prisma;
