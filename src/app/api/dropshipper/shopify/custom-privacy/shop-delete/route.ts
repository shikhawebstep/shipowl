import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

    // Required environment variables
    const requiredEnvVars = {
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET
    };

    // Identify missing or empty env variables
    const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, val]) => {
            const isMissing = !val || val.trim() === '';
            if (isMissing) {
                console.log(`Missing env variable: ${key}`);
            }
            return isMissing;
        })
        .map(([key]) => key);

    if (missingVars.length > 0) {
        return NextResponse.json(
            {
                error: 'Missing or empty required environment variables.',
                missing: missingVars,
            },
            { status: 400 }
        );
    }

    // Safe to use non-null assertion here because we checked above
    const apiSecret = requiredEnvVars.SHOPIFY_API_SECRET!;

    const rawBody = await req.text(); // get raw body
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';

    const generatedHash = crypto
        .createHmac('sha256', apiSecret)
        .update(rawBody, 'utf8')
        .digest('base64');

    // Validate HMAC
    if (generatedHash !== hmacHeader) {
        return NextResponse.json(
            { status: false, message: 'Unauthorized request: Invalid HMAC.' },
            { status: 401 }
        );
    }

    // Parse JSON after validation
    const data = JSON.parse(rawBody);

    // Process the shop deletion (e.g., mark in DB, cleanup, etc.)
    console.log('Shop delete webhook received:', data);

    return NextResponse.json(
        {
            status: true,
            message: 'Shop deletion request received and is being processed.',
        },
        { status: 202 }
    );
}
