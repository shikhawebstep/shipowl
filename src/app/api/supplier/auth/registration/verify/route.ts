import { NextRequest } from 'next/server';
import { handleVerifyStatus } from '../../../../../controllers/admin/authController';

export async function POST(req: NextRequest) {
    const adminRole = "supplier";
    const adminStaffRole = "supplier_staff";
    return handleVerifyStatus(req, adminRole, adminStaffRole);
}