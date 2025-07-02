import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
        return NextResponse.json(
            { status: true, error: 'Custoemer data delete request has been submitted' },
            { status: 500 }
        );
}
