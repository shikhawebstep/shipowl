import { NextRequest } from 'next/server';
import prisma from "@/lib/prisma";
import { UAParser } from 'ua-parser-js';

interface ActivityLogParams {
    adminId: number;
    adminRole: string;
    module: string;
    action: string;
    endpoint: string;
    method: string;
    payload: unknown;
    response: unknown;
    result: boolean;
    data?: unknown;
    ipv4?: string;
    ipv6?: string;
    internetServiceProvider?: string;
    clientInformation?: string;
    userAgent?: string;
}

export async function logMessage<T>(type: string, message: string, item?: T): Promise<void> {
    try {
        const isDev = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
        if (!isDev) return;

        const logWithMessage = (logFn: (...args: unknown[]) => void, prefix = '') => {
            if (item !== undefined) {
                logFn(`${prefix}${message}`, item);
            } else {
                logFn(`${prefix}${message}`);
            }
        };

        switch (type.toLowerCase()) {
            case 'error':
                logWithMessage(console.error, '❌ ');
                break;
            case 'warn':
                logWithMessage(console.warn, '⚠️ ');
                break;
            case 'info':
                logWithMessage(console.info, 'ℹ️ ');
                break;
            case 'debug':
                logWithMessage(console.debug, '🔍 ');
                break;
            case 'log':
                logWithMessage(console.log);
                break;
            case 'trace':
                logWithMessage(console.trace, '🔍 ');
                break;
            case 'table':
                if (item !== undefined) console.table(item);
                break;
            case 'group':
                console.group(message);
                break;
            case 'groupend':
                console.groupEnd();
                break;
            default:
                logWithMessage(console.log, '📌 ');
                break;
        }
    } catch (error) {
        console.error('❌ Error in logMessage:', error);
    }
}

export async function ActivityLog(params: ActivityLogParams): Promise<void> {
    try {
        const {
            adminId,
            adminRole,
            module,
            action,
            endpoint,
            method,
            payload,
            response,
            result,
            data,
            ipv4,
            ipv6,
            internetServiceProvider,
            clientInformation,
            userAgent,
        } = params;

        // Save the activity log to the database
        const activityLog = await prisma.activityLog.create({
            data: {
                adminId,
                adminRole,
                module,
                action,
                endpoint,
                method,
                payload: JSON.stringify(payload), // store as JSON string if it's an object
                response: JSON.stringify(response), // store as JSON string
                result,
                data: data ? JSON.stringify(data) : null, // optional field
                ipv4,
                ipv6,
                internetServiceProvider,
                clientInformation,
                userAgent
            }
        });

        console.info('Activity Log saved successfully:', activityLog);
    } catch (error) {
        console.error('❌ Error saving activity log:', error);
    }
}

export async function fetchLogInfo(module: string, action: string, req: NextRequest): Promise<void> {
    try {
        // Get the IP address from the 'x-forwarded-for' header or fallback to 'host' header
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('host');

        // Construct the full URL
        const protocol = req.headers.get('x-forwarded-proto') || 'http'; // Default to 'http' if missing
        const host = req.headers.get('host'); // Get host from headers
        const url = `${protocol}://${host}${req.nextUrl.pathname}${req.nextUrl.search || ''}`; // Build complete URL

        // Get the HTTP method and the payload if applicable (POST, PUT, PATCH)
        const method = req.method;
        let payload: unknown = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            try {
                payload = await req.json(); // Parse JSON payload
            } catch (error) {
                console.error('❌ Error parsing request body:', error);
            }
        }

        // Parse the User-Agent string for client details
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const parser = new UAParser(userAgent);
        const clientInfo = parser.getResult();

        // Extract browser, OS, and device details
        const { browser, os, device } = clientInfo;
        const browserName = browser.name || 'Unknown Browser';
        const browserVersion = browser.version || 'Unknown Version';
        const osName = os.name || 'Unknown OS';
        const osVersion = os.version || 'Unknown OS Version';
        const deviceType = device.type || 'Unknown Device';

        // Log the gathered information
        const logInfo = {
            module,        // The module triggering the action
            action,        // Specific action being logged
            url,           // Full URL of the request
            method,        // HTTP method (GET, POST, PUT, etc.)
            payload,       // Payload for POST, PUT, PATCH requests
            response: true, // Placeholder for response status (can be updated)
            result: [],    // Placeholder for result (can be updated)
            data: [],      // Placeholder for additional data (can be updated)
            ipAddress,     // IP address from request
            clientInfo: {  // Parsed client details
                browser: browserName,
                browserVersion,
                os: osName,
                osVersion,
                device: deviceType
            },
            userAgent,     // Raw User-Agent string
        };

        // Example of logging the activity info
        logMessage('info', `Activity log Info:`, logInfo);

    } catch (error) {
        console.error('❌ Error saving activity log:', error);
    }
}

/**
 * Formats a given date string or Date object into a specified format.
 * Returns null if the input is not a valid date.
 *
 * Supported Tokens:
 * - DD     : Day (2 digits)
 * - D      : Day (1-2 digits)
 * - MMM    : Abbreviated month name (e.g., Jan)
 * - MMMM   : Full month name (e.g., January)
 * - MM     : Month (2 digits)
 * - M      : Month (1-2 digits)
 * - YYYY   : Full year
 * - HH     : Hours (00-23)
 * - mm     : Minutes (00-59)
 * - ss     : Seconds (00-59)
 *
 * @param input - A date input as string, Date object, or null
 * @param format - Desired output format string
 * @returns Formatted date string or null if invalid
 */
export function formatDate(input: string | Date | null | undefined, format: string = "DD-MM-YYYY"): string | null {
    if (!input) return null;

    const date = typeof input === "string" ? new Date(input) : input;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const hourStr = String(hours).padStart(2, '0');
    const minuteStr = String(minutes).padStart(2, '0');
    const secondStr = String(seconds).padStart(2, '0');

    const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    return format
        .replace(/DD/g, dayStr)
        .replace(/D/g, String(day))
        .replace(/MMMM/g, MONTH_NAMES_FULL[month])
        .replace(/MMM/g, MONTH_NAMES_SHORT[month])
        .replace(/MM/g, monthStr)
        .replace(/M/g, String(month + 1))
        .replace(/YYYY/g, String(year))
        .replace(/HH/g, hourStr)
        .replace(/mm/g, minuteStr)
        .replace(/ss/g, secondStr);
}
