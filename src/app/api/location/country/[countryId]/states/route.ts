import { NextRequest, NextResponse } from 'next/server';

import { logMessage } from "@/utils/commonUtils";
import { getCountryById } from '@/app/models/location/country';
import { getStatesByCountry } from '@/app/models/location/state';

export async function GET(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const countryId = parts[parts.length - 2]; // Get the second-to-last segment

    const countryIdNum = Number(countryId);
    if (isNaN(countryIdNum)) {
      logMessage('warn', 'Invalid country ID', { countryId });
      return NextResponse.json({ error: 'Invalid country ID' }, { status: 400 });
    }

    const countryResult = await getCountryById(countryIdNum);
    logMessage('debug', 'Country fetch result:', countryResult);
    if (!countryResult?.status) {
      logMessage('warn', 'Country not found', { countryIdNum });
      return NextResponse.json({ status: false, message: 'Country not found' }, { status: 404 });
    }

    // Fetch all states
    const statesResult = await getStatesByCountry(countryIdNum);
    logMessage('info', 'States fetched successfully:', statesResult);
    if (statesResult?.status) {
      return NextResponse.json(
        { status: true, states: statesResult.states },
        { status: 200 }
      );
    }

    logMessage('warn', 'No states found');
    return NextResponse.json(
      { status: false, error: "No states found" },
      { status: 404 }
    );
  } catch (error) {
    logMessage('error', '❌ Error fetching single country:', error);
    return NextResponse.json({ status: false, error: 'Server error' }, { status: 500 });
  }
}
