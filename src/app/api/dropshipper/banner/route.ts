import { NextRequest, NextResponse } from 'next/server';

import { logMessage, fetchLogInfo } from "@/utils/commonUtils";
import { getDropshipperBanner } from '@/app/models/admin/dropshipper/banner';

export async function GET(req: NextRequest) {
  try {
    logMessage('debug', 'GET request received for dropshipper banner');

    const result = await getDropshipperBanner();

    if (result?.status) {
      return NextResponse.json(
        { status: true, banner: result.dropshipperBanner },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: false, message: result?.message || "Dropshipper banner not found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', 'Error fetching dropshipper banner:', error);
    return NextResponse.json(
      { status: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
