import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { Client } from 'basic-ftp';
import { logMessage } from './commonUtils';

export interface UploadedFileInfo {
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    url: string;
}

// FTP Configuration
interface FTPConfig {
    host: string;
    user: string;
    password: string;
    secure?: boolean;
    remoteDir?: string;
    publicUrlBase: string;
}

// Load from env or replace with your actual values
const ftpConfig: FTPConfig = {
    host: process.env.FTP_HOST || 'ftp.example.com',
    user: process.env.FTP_USER || 'ftpuser',
    password: process.env.FTP_PASSWORD || 'ftppassword',
    secure: false,
    remoteDir: '',
    publicUrlBase: process.env.FTP_FILE_HOST || 'https://cdn.example.com/uploads',
};

// Helper: ensure directory exists
async function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        logMessage('log', '📁 Directory not found. Creating:', dirPath);
        await mkdir(dirPath, { recursive: true });
    } else {
        logMessage('log', '✅ Directory already exists:', dirPath);
    }
}

// Helper: generate file name
function generateFileName(
    originalName: string,
    pattern: 'original' | 'slug' | 'slug-unique' | 'custom',
    customName?: string
) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);

    switch (pattern) {
        case 'original':
            logMessage('log', '📝 Using original filename:', originalName);
            return originalName;
        case 'custom':
            const name = `${customName}${ext}`;
            logMessage('log', '📝 Using custom filename:', name);
            return name;
        case 'slug':
            const slug = base.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const slugName = `${slug}${ext}`;
            logMessage('log', '📝 Using slug filename:', slugName);
            return slugName;
        case 'slug-unique':
            const unique = `${base.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
            const slugUniqueName = `${unique}${ext}`;
            logMessage('log', '📝 Using slug-unique filename:', slugUniqueName);
            return slugUniqueName;
        default:
            return originalName;
    }
}

// Upload file to FTP
async function uploadToFTP(localPath: string, remoteFileName: string): Promise<string | null> {
    const client = new Client();
    try {
        logMessage('log', '🚀 Connecting to FTP...');
        await client.access({
            host: ftpConfig.host,
            user: ftpConfig.user,
            password: ftpConfig.password,
            secure: ftpConfig.secure || false,
        });
        logMessage('log', '✅ FTP connection established');

        const relativePath = localPath.split(/uploads[\\/]/)[1]?.replace(/\\/g, '/') || '';
        const dirPath = relativePath.replace(new RegExp(`${remoteFileName}$`), '').replace(/\/+$/, '');

        logMessage('log', '📦 Local file path:', localPath);
        logMessage('log', `📁 Relative path after 'uploads':`, relativePath);
        logMessage('log', '📂 Nested FTP directory to ensure:', dirPath);

        // Go to root
        await client.cd('/');
        logMessage('log', "📍 Changed to FTP root '/'");

        // If remoteDir is set, change to it or create it
        if (ftpConfig.remoteDir) {
            const baseFolders = ftpConfig.remoteDir.split('/').filter(Boolean);
            for (const folder of baseFolders) {
                try {
                    await client.cd(folder);
                } catch {
                    await client.send(`MKD ${folder}`);
                    await client.cd(folder);
                }
            }
        }

        // Manually create nested directories
        const dirParts = dirPath.split('/').filter(Boolean);
        for (const folder of dirParts) {
            try {
                logMessage('log', '➡️ Ensuring nested folder:', folder);
                await client.cd(folder); // Try to enter
            } catch {
                logMessage('log', '📁 Creating missing folder:', folder);
                await client.send(`MKD ${folder}`);
                await client.cd(folder);
            }
        }

        // Upload the file
        logMessage('log', '📤 Uploading file:', remoteFileName);
        await client.uploadFrom(localPath, remoteFileName);
        logMessage('log', '✅ Successfully uploaded:', remoteFileName);

        await client.close();

        const publicUrl = `${ftpConfig.publicUrlBase}/${dirPath ? dirPath + '/' : ''}${remoteFileName}`;
        logMessage('log', '🔗 Public file URL:', publicUrl);
        return publicUrl;
    } catch (err) {
        console.error(`❌ FTP upload failed:`, err);
        await client.close();
        return null;
    }
}

// Upload and save file(s)
interface SaveFileOptions {
    dir: string;
    pattern: 'original' | 'slug' | 'slug-unique' | 'custom';
    customName?: string;
    multiple?: boolean;
}

export async function saveFilesFromFormData(
    formData: FormData,
    fieldName: string,
    options: SaveFileOptions
): Promise<UploadedFileInfo | UploadedFileInfo[]> {
    const { dir, pattern, customName, multiple = false } = options;

    logMessage('log', '🚀 Starting file save from field: ', fieldName);
    await ensureDir(dir);
    let result: UploadedFileInfo[] | UploadedFileInfo | null = multiple ? [] : null;

    const files = formData.getAll(fieldName).filter(
        (item): item is File => item instanceof File && item.name.length > 0
    );

    logMessage('log', '📦 Total files to process: ', files.length);

    for (let index = 0; index < files.length; index++) {
        const file = files[index];

        const nameToUse =
            pattern === 'custom' && multiple
                ? `${customName}-${index + 1}`
                : pattern === 'custom'
                    ? customName!
                    : file.name;

        const finalFileName = generateFileName(nameToUse, pattern, nameToUse);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fullPath = path.join(dir, finalFileName);

        await writeFile(fullPath, buffer);
        logMessage('log', 'fullPath - ', fullPath);

        // Upload to FTP
        const ftpUrl = await uploadToFTP(fullPath, finalFileName);

        const info: UploadedFileInfo = {
            originalName: file.name,
            savedAs: finalFileName,
            size: file.size,
            type: file.type,
            url: ftpUrl || `/uploads/fallback/${finalFileName}`, // fallback local URL
        };

        if (multiple && Array.isArray(result)) {
            result.push(info);
        } else {
            result = info;
        }

        // Optional: delete local file after FTP upload
        // await unlink(fullPath);
        /*
            const publicIndex = fullPath.indexOf('public');
            const fileUrl = publicIndex !== -1
                ? fullPath.split('public')[1].replace(/\\/g, '/')
                : fullPath;

            const info: UploadedFileInfo = {
                originalName: file.name,
                savedAs: finalFileName,
                size: file.size,
                type: file.type,
                url: `${fileUrl}`,
            };

            if (multiple && Array.isArray(result)) {
                result.push(info);
            } else {
                result = info;
            }
        */
    }

    return result!;

}

/**
 * Deletes a file from the file system
 * @param filePath Absolute path to the file
 * @returns A boolean indicating if the file was deleted successfully
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        await stat(filePath); // Throws if file doesn't exist
        await unlink(filePath);
        return true;
    } catch (error) {
        logMessage('error', `File not found or couldn't be deleted: ${filePath}`, error);
        return false;
    }
}