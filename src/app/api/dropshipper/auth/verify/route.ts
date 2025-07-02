import { handleVerifyLogin } from '../../../../controllers/admin/authController';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const adminRole = "dropshipper";
    const adminStaffRole = "dropshipper_staff";
    return handleVerifyLogin(req, adminRole, adminStaffRole);
}