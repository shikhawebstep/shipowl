import { parse } from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFileData {
    headers: string[];
    rows: Record<string, string | number | boolean | null>[];  // Instead of 'any', use specific types
    originalName: string;
    extension: string;
    size: number;
    type: string;
}

interface ParseOptions {
    returnInArray?: boolean;
    multiple?: boolean;
}

/**
 * Parses a single CSV file and returns structured data
 */
async function parseCSVFile(file: File): Promise<ParsedFileData> {
    const text = await file.text();
    const result = parse<{ [key: string]: string | number | boolean | null }>(text, {
        header: true,
        skipEmptyLines: true,
    });

    return {
        headers: result.meta.fields || [],
        rows: result.data,
        originalName: file.name,
        extension: '.csv',
        size: file.size,
        type: file.type,
    };
}

/**
 * Parses a single Excel file (.xls, .xlsx) and returns structured data
 */
async function parseExcelFile(file: File): Promise<ParsedFileData> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(sheet, { defval: '' });
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

    return {
        headers: headers || [],
        rows,
        originalName: file.name,
        extension: file.name.split('.').pop() || '',
        size: file.size,
        type: file.type,
    };
}

/**
 * Determines the file type and parses accordingly
 */
async function parseFile(file: File): Promise<ParsedFileData> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
        return await parseCSVFile(file);
    }

    if (ext === 'xls' || ext === 'xlsx') {
        return await parseExcelFile(file);
    }

    throw new Error(`Unsupported file type: ${file.name}`);
}

/**
 * Main function: Parses uploaded FormData field(s) without saving
 */
export async function parseFilesFromFormData(
    formData: FormData,
    fieldName: string,
    options: ParseOptions = {}
): Promise<ParsedFileData | ParsedFileData[]> {
    const { returnInArray = false, multiple = false } = options;

    const files = formData.getAll(fieldName).filter(
        (item): item is File => item instanceof File && item.name.length > 0
    );

    const parsedList: ParsedFileData[] = [];

    for (const file of files) {
        const parsed = await parseFile(file);
        parsedList.push(parsed);
    }

    return returnInArray || multiple ? parsedList : parsedList[0];
}
