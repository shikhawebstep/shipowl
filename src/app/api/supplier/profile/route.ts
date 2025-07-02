import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { isUserExist } from "@/utils/auth/authUtils";
import { getSupplierById } from '@/app/models/supplier/supplier';

export async function GET(req: NextRequest) {
    try {
        const supplierId = req.headers.get('x-supplier-id');
        const supplierRole = req.headers.get('x-supplier-role');

        if (!supplierId || isNaN(Number(supplierId))) {
            logMessage('warn', 'Invalid or missing supplier ID', { supplierId });
            return NextResponse.json({ error: 'Invalid or missing supplier ID' }, { status: 400 });
        }

        logMessage('debug', `Requested Supplier ID: ${supplierId}, Role: ${supplierRole}`);

        const userCheck = await isUserExist(Number(supplierId), String(supplierRole));
        if (!userCheck.status) {
            logMessage('warn', `User not found: ${userCheck.message}`, { supplierId, supplierRole });
            return NextResponse.json({ error: `User Not Found: ${userCheck.message}` }, { status: 404 });
        }

        const supplierIdNum = Number(supplierId);
        if (isNaN(supplierIdNum)) {
            logMessage('warn', 'Invalid supplier ID', { supplierId });
            return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
        }

        const supplierResult = await getSupplierById(supplierIdNum);
        if (supplierResult?.status) {
            logMessage('info', 'Supplier found:', supplierResult.supplier);
            return NextResponse.json({ status: true, supplier: supplierResult.supplier }, { status: 200 });
        }

        return NextResponse.json({ status: false, message: 'Supplier not found' }, { status: 404 });
    } catch (error) {
        logMessage('error', '❌ Error fetching single supplier:', error);
        return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
    }
}