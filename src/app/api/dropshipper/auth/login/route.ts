import { handleLogin } from '../../../../controllers/admin/authController';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const adminRole = "dropshipper";
    const adminStaffRole = "dropshipper_staff";
    return handleLogin(req, adminRole, adminStaffRole);
}
