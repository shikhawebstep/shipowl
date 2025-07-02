import { handleLogin } from '../../../../controllers/admin/authController';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const adminRole = "supplier";
    const adminStaffRole = "supplier_staff";
    return handleLogin(req, adminRole, adminStaffRole);
}
