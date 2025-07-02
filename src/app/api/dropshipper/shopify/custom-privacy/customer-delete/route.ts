import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    return NextResponse.json(
        {
            status: true,
            message: 'Customer deletion request has been submitted successfully.',
        },
        { status: 202 } // 202 Accepted
    );
}
