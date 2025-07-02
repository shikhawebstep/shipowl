import { handleResetPassword } from '../../../../../controllers/admin/authController';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const adminRole = "dropshipper";
    const adminStaffRole = "dropshipper_staff";
    return handleResetPassword(req, adminRole, adminStaffRole);
}
