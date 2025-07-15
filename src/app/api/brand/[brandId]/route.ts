import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { getBrandById } from '@/app/models/admin/brand';

export async function GET(req: NextRequest) {
  try {
    // Extract brandId directly from the URL path
    const brandId = req.nextUrl.pathname.split('/').pop();

    logMessage('debug', 'Requested Brand ID:', brandId);

    const brandIdNum = Number(brandId);
    if (isNaN(brandIdNum)) {
      logMessage('warn', 'Invalid brand ID', { brandId });
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brandResult = await getBrandById(brandIdNum);
    if (brandResult?.status) {
      logMessage('info', 'Brand found:', brandResult.brand);
      return NextResponse.json({ status: true, brand: brandResult.brand }, { status: 200 });
    }

    logMessage('info', 'Brand found:', brandResult.brand);
    return NextResponse.json({ status: false, message: 'Brand not found' }, { status: 404 });
  } catch (error) {
    logMessage('error', '❌ Error fetching single brand:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
