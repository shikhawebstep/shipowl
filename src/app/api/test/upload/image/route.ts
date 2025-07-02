import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logMessage } from "@/utils/commonUtils";
import { saveFilesFromFormData } from '@/utils/saveFiles';

type UploadedFileInfo = {
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    url: string;
};

export async function POST(req: NextRequest) {
    try {
        logMessage('debug', 'POST request received for category creation');

        const isMultipleImages = true; // Set true to allow multiple image uploads

        const formData = await req.formData();

        // File upload
        const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', 'test', 'image');
        const fileData = await saveFilesFromFormData(formData, 'image', {
            dir: uploadDir,
            pattern: 'slug-unique',
            multiple: isMultipleImages,
        });

        let image = '';

        if (fileData) {
            logMessage('info', 'uploaded fileData:', fileData);
            image = isMultipleImages
                ? (fileData as UploadedFileInfo[]).map(file => file.url).join(', ')
                : (fileData as UploadedFileInfo).url;
        }

        return NextResponse.json(
            { status: true, image },
            { status: 500 }
        );
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Internal Server Error';
        logMessage('error', 'Category Creation Error:', error);
        return NextResponse.json({ status: false, error }, { status: 500 });
    }
}