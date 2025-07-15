import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
import prisma from "@/lib/prisma";

const SECRET_KEY = process.env.JWT_SECRET || '3792e68ef011e0f236a60627ddf304e1bb64d76d5e4dbebca4579490d3c4e6d8c618456f29aa6f92f8dc3cbd4414362b47d4545ffdc0b9549e43b629c39282bb36b9cff7295fc4269d765d59e4d8a811113b911080878f7647e0329a072afdc06d2ecd658c8e79f2ad04e74dbffc45ed10c850b02afdf10b209989910fadaf7ddbef0bb7d0cff27ed8f4a10d3415420107ddba2d9ac8bcf4f7b3b942b5bbe600d9007f9e88b2451cbfaeaab239677b3ed28eaa860eb40fd5d0e36969b6943a3215d2a9f1125ca06be806f8d73d8ae642c4a29b3a728cf42305e1150e4c1f3ed6e14bd3662531cd14357c6b3f3a57095609811f5e9459307cbe70f9b7a159c8d3';

export function generateToken(adminId: number, adminRole: string) {
    console.log(`adminId: ${adminId}, adminRole: ${adminRole}`);
    return jwt.sign({ adminId, adminRole }, SECRET_KEY, { expiresIn: '3h' });
}

export function generatePasswordResetToken(adminId: number, adminRole: string) {
    return jwt.sign({ adminId, adminRole }, SECRET_KEY, { expiresIn: '1h' });
}

export function generateRegistrationToken(adminId: number, adminRole: string) {
    return jwt.sign({ adminId, adminRole }, SECRET_KEY, { expiresIn: '1h' });
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
        return { payload, status: true, message: "Token is valid" };
    } catch (error) {
        let message = "Authentication failed. Please try again.";

        if (typeof error === "object" && error !== null && "code" in error) {
            const err = error as { code: string };
            if (err.code === 'ERR_JWT_EXPIRED') {
                message = "Session expired. Please log in again.";
            }
        }
        return { payload: null, status: false, message };
    }
}

// Check if admin exists in the database
export async function isUserExist(adminId: number, adminRole: string) {
    try {
        const adminRoleStr = String(adminRole); // Ensure it's a string
        const adminModel = ["admin", "dropshipper", "supplier"].includes(adminRoleStr) ? "admin" : "adminStaff";

        // Fetch admin details from database
        let admin
        if (adminModel === "admin") {
            admin = await prisma.admin.findUnique({
                where: { id: adminId, role: adminRoleStr },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    role: true,
                },
            });
        } else {
            admin = await prisma.adminStaff.findUnique({
                where: { id: adminId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    panel: true,
                    admin: true
                }
            });
        }

        // If admin doesn't exist, return false with a message
        if (!admin) {
            return { status: false, message: "User with the provided ID does not exist" };
        }

        // Return admin details if found
        return { status: true, admin };
    } catch (error) {
        console.error("Error fetching admin by ID:", error);
        return { status: false, message: "Internal Server Error" };
    }
}