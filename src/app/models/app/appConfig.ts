import prisma from "@/lib/prisma";

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

// 🔵 GET BY ID
export const getAppConfig = async () => {
    try {
        const appConfig = await prisma.appConfig.findFirst({
            where: { status: true },
            orderBy: { id: "desc" },
        });

        if (!appConfig) {
            return { status: false, message: "AppConfig not found" };
        }

        return { status: true, appConfig: serializeBigInt(appConfig) };
    } catch (error) {
        console.error("❌ getAppConfig Error:", error);
        return { status: false, message: "Error fetching AppConfig" };
    }
};