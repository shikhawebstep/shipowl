import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { getBrandsByStatus } from '@/app/models/admin/brand';
import { fetchLogInfo } from '@/utils/commonUtils';

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for fetching brands');

    const fetchLogInfoResult = await fetchLogInfo('brand', 'view', req);
    logMessage('debug', 'fetchLogInfoResult:', fetchLogInfoResult);

    // Fetch all brands
    const brandsResult = await getBrandsByStatus("notDeleted");

    if (brandsResult?.status) {
      return NextResponse.json(
        { status: true, brands: brandsResult.brands },
        { status: 200 }
      );
    }

    logMessage('warn', 'No brands found');
    return NextResponse.json(
      { status: false, error: "No brands found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching brands:', error);
    return NextResponse.json(
      { status: false, error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

