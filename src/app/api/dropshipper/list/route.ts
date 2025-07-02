import { NextRequest, NextResponse } from "next/server";
import { isUserExist } from "@/utils/auth/authUtils";

export async function GET(req: NextRequest) {
  try {
    // Retrieve x-admin-id from request headers
    const adminId = req.headers.get("x-dropshipper-id");
    const adminRole = req.headers.get("x-dropshipper-role");
    if (!adminId || isNaN(Number(adminId))) {
      return NextResponse.json(
        { error: "User ID is missing or invalid in request 1" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const result = await isUserExist(Number(adminId), String(adminRole));
    if (!result.status) {
      return NextResponse.json({ error: `User Not Found 1: ${result.message}` }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.admin }, { status: 200 });
  } catch (error) {
    console.error(`error - `, error);
    return NextResponse.json({ success: false, error: "Failed to fetch admins" }, { status: 500 });
  }
}
