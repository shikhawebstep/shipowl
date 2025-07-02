import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> } // 👈 params is now a Promise
) {
    // Await the params before using them
    const resolvedParams = await params;
    console.log('params:', resolvedParams);

    const filePath = path.join(...resolvedParams.path);
    console.log('filePath:', filePath);

    try {
        const fileBuffer = await fs.readFile(filePath);

        const mimeType = mime.getType(filePath) || 'application/octet-stream';

        // Only allow image/* and video/*
        if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
            return NextResponse.json(
                { error: 'Unsupported file type' },
                { status: 415 } // Unsupported Media Type
            );
        }

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
            },
        });
    } catch (err) {
        console.error('File read error:', err);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}