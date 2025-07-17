import { NextRequest, NextResponse } from 'next/server';

import { ActivityLog, logMessage } from "@/utils/commonUtils";
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
            await ActivityLog(
                {
                    panel: 'Dropshipper',
                    module: 'Profile',
                    action: 'Update',
                    data: dropshipperResult,
                    response: { status: true, dropshipper: dropshipperResult.dropshipper },
                    status: true
                }, req);

            logMessage('info', 'Dropshipper found:', dropshipperResult.dropshipper);
            return NextResponse.json({ status: true, dropshipper: dropshipperResult.dropshipper }, { status: 200 });
        }

        await ActivityLog(
            {
                panel: 'Dropshipper',
                module: 'Profile',
                action: 'Update',
                data: dropshipperResult,
                response: { status: false, message: 'Dropshipper not found' },
                status: false
            }, req);

        return NextResponse.json({ status: false, message: 'Dropshipper not found' }, { status: 404 });
    } catch (error) {
        await ActivityLog(
            {
                panel: 'Dropshipper',
                module: 'Profile',
                action: 'Update',
                data: { oneLineSimpleMessage: error || 'Internal Server Error' },
                response: { status: false, error: 'Server error' },
                status: false
            }, req);

        logMessage('error', '❌ Error fetching single dropshipper:', error);
        return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
    }
}