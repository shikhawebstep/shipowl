import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';
import http from 'http';
import { isUserExist } from './auth/authUtils';

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

interface GeoLocationData {
    lat?: number;
    lon?: number;
    city?: string;
    regionName?: string;
    country?: string;
    timezone?: string;
    isp?: string;
    org?: string;
    as?: string;
    proxy?: boolean;
    status?: string;
}

interface MainAdmin {
    id: number;
    name: string;
    email: string;
    role?: string;
    panel?: string;
    // other optional properties if needed
}

interface AdminStaff {
    id: number;
    name: string;
    email: string;
    password: string;
    role?: string;
    admin?: MainAdmin;
}

interface UserCheckResult {
    status: boolean;
    message?: string;
    admin?: AdminStaff;
}

interface FetchLogInfoParams {
    module: string;
    action: string;
    data: unknown;
    response: unknown;
    status: boolean;
}

// ---------------------------------------------
// Log Utility
// ---------------------------------------------
export async function logMessage<T>(type: string, message: string, item?: T) {
    try {
        const isDev = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
        if (!isDev) return;

        const log = (fn: (...args: unknown[]) => void, prefix = '') =>
            item !== undefined ? fn(`${prefix}${message}`, item) : fn(`${prefix}${message}`);

        switch (type.toLowerCase()) {
            case 'error': log(console.error, '❌ '); break;
            case 'warn': log(console.warn, '⚠️ '); break;
            case 'info': log(console.info, 'ℹ️ '); break;
            case 'debug': log(console.debug, '🔍 '); break;
            case 'log': log(console.log); break;
            case 'trace': log(console.trace, '🔍 '); break;
            case 'table': item && console.table(item); break;
            case 'group': console.group(message); break;
            case 'groupend': console.groupEnd(); break;
            default: log(console.log, '📌 '); break;
        }
    } catch (error) {
        console.error('❌ logMessage error:', error);
    }
}

// ---------------------------------------------
// Save Activity to DB
// ---------------------------------------------
export async function ActivityLog(params: ActivityLogParams) {
    try {
        const { payload, response, data, ...rest } = params;

        const activityLog = await prisma.activityLog.create({
            data: {
                ...rest,
                payload: JSON.stringify(payload),
                response: JSON.stringify(response),
                data: data ? JSON.stringify(data) : null
            }
        });

        logMessage('info', 'Activity Log saved successfully', activityLog);
    } catch (error) {
        logMessage('error', 'Error saving activity log', error);
    }
}

// ---------------------------------------------
// Fetch Log Info (Client + Location)
/// --------------------------------------------
export async function fetchLogInfo({ module, action, data, response, status }: FetchLogInfoParams, req: NextRequest) {
    try {

        const adminResult = await isAdminValid(req);
        if (!adminResult.status) {
            return {
                status: true,
                message: adminResult.message
            };
        }
        const admin = adminResult.admin;

        // const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '103.199.205.58';
        const ipAddress = '139.5.0.94';
        const geoData = await fetchLocationData(`http://ip-api.com/json/${ipAddress}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`);

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const url = `${protocol}://${host}${req.nextUrl.pathname}${req.nextUrl.search || ''}`;
        const method = req.method;

        let payload: unknown = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            try {
                payload = await req.json();
            } catch (err) {
                logMessage('error', 'Failed to parse JSON payload', err);
            }
        }

        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const parser = new UAParser(userAgent);
        const { browser, os, device } = parser.getResult();

        const logInfo = {
            adminId: adminResult.adminId,
            adminRole: adminResult.adminRole,
            module,
            action,
            url,
            method,
            payload,
            response, // JSON response from action
            status,   // Boolean indicating success/failure
            data,     // JSON object with additional data
            ipAddress,
            userAgent,
            location: {
                latitude: geoData?.lat ?? 'N/A',
                longitude: geoData?.lon ?? 'N/A',
                city: geoData?.city ?? 'N/A',
                region: geoData?.regionName ?? 'N/A',
                country: geoData?.country ?? 'N/A',
                timezone: geoData?.timezone ?? 'N/A',
            },
            ispInfo: {
                isp: geoData?.isp ?? 'Unknown',
                organization: geoData?.org ?? 'Unknown',
                as: geoData?.as ?? 'Unknown',
                proxy: geoData?.proxy ?? false,
            },
            deviceInfo: {
                deviceType: device?.type ?? 'Unknown Device',
                browserName: browser?.name ?? 'Unknown Browser',
                browserVersion: browser?.version ?? 'Unknown Version',
                os: os?.name ?? 'Unknown OS',
                osVersion: os?.version ?? 'Unknown Version'
            }
        };

        logMessage('info', 'Generated Activity Log Info:', logInfo);

    } catch (error) {
        logMessage('error', 'Error in fetchLogInfo', error);
    }
}

// ---------------------------------------------
// Fetch Geolocation Info by IP
// ---------------------------------------------
async function fetchLocationData(url: string): Promise<GeoLocationData> {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(rawData);
                    resolve(json.status === 'success' ? json : {});
                } catch {
                    resolve({});
                }
            });
        }).on('error', () => resolve({}));
    });
}

// ---------------------------------------------
// Format Date Utility
// ---------------------------------------------
export function formatDate(input: string | Date | null | undefined, format: string = "DD-MM-YYYY"): string | null {
    if (!input) return null;

    const date = typeof input === "string" ? new Date(input) : input;
    if (isNaN(date.getTime())) return null;

    const pad = (num: number) => String(num).padStart(2, '0');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return format
        .replace(/DD/g, pad(day))
        .replace(/D/g, String(day))
        .replace(/MMMM/g, MONTH_NAMES_FULL[month])
        .replace(/MMM/g, MONTH_NAMES_SHORT[month])
        .replace(/MM/g, pad(month + 1))
        .replace(/M/g, String(month + 1))
        .replace(/YYYY/g, String(year))
        .replace(/HH/g, pad(hours))
        .replace(/mm/g, pad(minutes))
        .replace(/ss/g, pad(seconds));
}


export async function isAdminValid(req: NextRequest) {
    // Get headers
    const adminIdHeader = req.headers.get("x-admin-id");
    const adminRole = req.headers.get("x-admin-role");

    const adminId = Number(adminIdHeader);
    if (!adminIdHeader || isNaN(adminId)) {
        logMessage('warn', 'Invalid or missing admin ID header', { adminIdHeader, adminRole });
        return {
            status: false,
            message: 'User ID is missing or invalid in request'
        };
    }

    // Check if admin exists
    const userCheck: UserCheckResult = await isUserExist(adminId, String(adminRole));
    if (!userCheck.status) {
        logMessage('warn', `User not found: ${userCheck.message}`, { adminId, adminRole });
        return {
            status: false,
            message: `User Not Found: ${userCheck.message}`
        };
    }

    const isStaff = !['admin', 'supplier', 'dropshipper'].includes(String(adminRole));

    return {
        status: true,
        message: 'Valid Admin',
        adminId,
        adminRole,
        admin: userCheck.admin,
        isStaff
    };
}