import { handleVerifyLogin } from '../../../../controllers/admin/authController';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const adminRole = "supplier";
    const adminStaffRole = "supplier_staff";
    return handleVerifyLogin(req, adminRole, adminStaffRole);
}