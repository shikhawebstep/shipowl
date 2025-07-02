import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getDropshipperById } from '@/app/models/dropshipper/dropshipper';

export async function GET(req: NextRequest) {
    try {
        const dropshipperId = req.headers.get('x-dropshipper-id');
        const dropshipperRole = req.headers.get('x-dropshipper-role');

        if (!dropshipperId || isNaN(Number(dropshipperId))) {
            logMessage('warn', 'Invalid or missing dropshipper ID', { dropshipperId });
            return NextResponse.json({ error: 'Invalid or missing dropshipper ID' }, { status: 400 });
        }

        logMessage('debug', `Requested Dropshipper ID: ${dropshipperId}, Role: ${dropshipperRole}`);

        const userCheck = await isUserExist(Number(dropshipperId), String(dropshipperRole));
        if (!userCheck.status) {
            logMessage('warn', `User not found: ${userCheck.message}`, { dropshipperId, dropshipperRole });
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const dropshipperIdNum = Number(dropshipperId);
        if (isNaN(dropshipperIdNum)) {
            logMessage('warn', 'Invalid dropshipper ID', { dropshipperId });
            return NextResponse.json({ error: 'Invalid dropshipper ID' }, { status: 400 });
        }

        const dropshipperResult = await getDropshipperById(dropshipperIdNum);
        if (dropshipperResult?.status) {
            logMessage('info', 'Dropshipper found:', dropshipperResult.dropshipper);
            return NextResponse.json({ status: true, dropshipper: dropshipperResult.dropshipper }, { status: 200 });
        }

        return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    } catch (error) {
        logMessage('error', '❌ Error fetching single dropshipper:', error);
        return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
    }
}