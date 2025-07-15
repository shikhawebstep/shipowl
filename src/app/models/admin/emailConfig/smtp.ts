import prisma from "@/lib/prisma";

interface Mail {
    id?: bigint; // Or use `string` if you're dealing with BigInt as a string
    smtp_host: string;
    smtp_secure: boolean;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
    createdAt?: Date;
    createdBy?: number | null;
    createdByRole?: string | null;
    updatedAt: Date;
    updatedBy?: number | null;
    updatedByRole?: string | null;
}


// type PanelType = "admin" | "dropshipper" | "supplier";

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

// 🟡 UPDATE
export const updateSMTPConfig = async (
    adminId: number,
    adminRole: string,
    data: Mail
) => {
    try {
        const {
            smtp_host,
            smtp_secure,
            smtp_port,
            smtp_username,
            smtp_password,
            from_email,
            from_name,
            updatedAt,
        } = data;

        const updatedData = {
            smtp_host,
            smtp_secure,
            smtp_port,
            smtp_username,
            smtp_password,
            from_email,
            from_name,
            updatedAt,
            updatedBy: adminId,
            updatedByRole: adminRole,
        };

        const result = await prisma.emailConfig.updateMany({
            data: updatedData,
        });

        return {
            status: true,
            updatedCount: result.count,
            message: `${result.count} SMTP configuration(s) updated successfully.`,
        };
    } catch (error) {
        console.error("❌ updateSMTPConfig Error:", error);
        return {
            status: false,
            message: "Error updating all SMTP configurations.",
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

// 🟣 GET
export const getSMTPConfig = async () => {
    try {
        const smtpConfig = await prisma.emailConfig.findFirst({
            orderBy: { id: 'desc' },
            select: {
                smtp_host: true,
                smtp_secure: true,
                smtp_port: true,
                smtp_username: true,
                smtp_password: true,
                from_email: true,
                from_name: true,
            },
        });

        if (!smtpConfig) {
            return { status: false, message: "No SMTP configuration found." };
        }

        return {
            status: true,
            smtp: smtpConfig,
        };
    } catch (error) {
        console.error("❌ getSMTPConfig Error:", error);
        return {
            status: false,
            message: "Error fetching SMTP configuration.",
        };
    }
};
