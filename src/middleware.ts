// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "./middlewares/adminAuth";
import { logMessage } from "./utils/commonUtils";

type SkippableRoute = string | { route: string; methods?: string[] };

type RouteProtection = {
    skipRoutes?: SkippableRoute[];
    skip?: boolean;
    routes: SkippableRoute[];
    role?: string;
    applicableRoles?: string[];
};

// Helper function to check if a pathname matches a route string or pattern
function routeMatches(pathname: string, routes: string[]): boolean {
    return routes.some((route) => pathname === route || pathname.startsWith(route));
}

function normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`;
}

// Helper function to check if pathname + method match any skippable route entry
function routeMatchesWithMethod(
    pathname: string,
    method: string,
    routes: SkippableRoute[]
): boolean {
    return routes.some((routeObj) => {
        if (typeof routeObj === "string") {
            const route = normalizePath(routeObj);
            return pathname === route || pathname.startsWith(route);
        } else {
            const route = normalizePath(routeObj.route);
            const matchesRoute = pathname === route || pathname.startsWith(route);
            if (!matchesRoute) return false;
            if (!routeObj.methods) return true;
            return routeObj.methods.includes(method);
        }
    });
}

export function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // Apply CORS headers globally
    res.headers.set("Access-Control-Allow-Origin", "*"); // TODO: Replace '*' with actual domain in production
    res.headers.set("Access-Control-Allow-Methods", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Log request method and URL (for debugging)
    logMessage(`log`, `req.method:`, req.method);
    logMessage(`log`, `req.url:`, req.url);

    // Handle preflight OPTIONS requests quickly
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: res.headers });
    }

    const pathname = req.nextUrl.pathname;
    const method = req.method;

    const routeProtections: RouteProtection[] = [
        {
            skip: true,
            routes: [
                "/api/admin/auth/login",
                "/api/admin/auth/password/forget",
                "/api/admin/auth/password/reset",
                "/api/dropshipper/shopify/custom-privacy/customer-delete",
                "/api/dropshipper/shopify/custom-privacy/data-request",
                "/api/dropshipper/shopify/custom-privacy/shop-delete",
                "/api/supplier/auth/login",
                "/api/supplier/auth/password/forget",
                "/api/supplier/auth/password/reset",
                "/api/supplier/auth/registration",
                "/api/dropshipper/auth/login",
                "/api/dropshipper/auth/password/forget",
                "/api/dropshipper/auth/password/reset",
                "/api/dropshipper/auth/registration",
                { route: "/api/location/country", methods: ["GET"] },
                { route: "/api/location/country/[countryId]/states", methods: ["GET"] },
                { route: "/api/admin/product/[productId]/description", methods: ["GET"] },
                { route: "/api/location/state", methods: ["GET"] },
                { route: "/api/location/state/[stateId]/cities", methods: ["GET"] },
                { route: "/api/location/city", methods: ["GET"] },
                { route: "/api/brand", methods: ["GET"] },
                { route: "/api/category", methods: ["GET"] },
                { route: "api/order/shipping/status", methods: ["GET"] },
                { route: "api/dropshipper/shopify/callback", methods: ["GET"] },
            ],
        },
        {
            skipRoutes: [
                "/api/supplier/auth/verify",
            ],
            routes: [
                "/api/admin",
                "/api/admin/:path*",
                "/api/product",
                "/api/category",
                "/api/brand",
            ],
            role: "admin",
            applicableRoles: ["admin", "admin_staff"],
        },
        {
            routes: [
                "/api/dropshipper",
                "/api/dropshipper/list",
                "/api/dropshipper/auth/verify",
                "/api/dropshipper/profile",
                "/api/dropshipper/profile/update",
                "/api/dropshipper/product",
            ],
            role: "dropshipper",
            applicableRoles: ["dropshipper", "dropshipper_staff"],
        },
        {
            routes: [
                "/api/supplier",
                "/api/supplier/",
                "/api/supplier/list",
                "/api/supplier/auth/verify",
                "/api/supplier/profile",
                "/api/supplier/profile/update",
                "/api/supplier/product",
            ],
            role: "supplier",
            applicableRoles: ["supplier", "supplier_staff"],
        },
        {
            routes: [

                "/api/warehouse",
                "/api/warehouse/",
                "/api/location/country",
                "/api/location/country/",
                "/api/location/state",
                "/api/location/state/",
                "/api/location/city",
                "/api/location/city/",
                "/api/admin/supplier",
                "/api/dropshipper",
                "/api/dropshipper/",
                "/api/courier-company",
                "/api/courier-company/:path*",
                "/api/high-rto",
                "/api/high-rto/:path*",
                "/api/good-pincode",
                "/api/good-pincode/:path*",
                "/api/bad-pincode",
                "/api/bad-pincode/:path*",
                "/api/payment",
                "/api/payment/:path*",
                "/api/order",
            ],
            role: "admin",
            applicableRoles: [
                "admin",
                "admin_staff",
                "dropshipper",
                "dropshipper_staff",
                "supplier",
                "supplier_staff",
            ],
        },
    ];

    for (const protection of routeProtections) {
        // ✅ First skip if 'skip' flag is set and route matches
        if (protection.skip && routeMatchesWithMethod(pathname, method, protection.routes)) {
            return res;
        }

        // ✅ Then skip if pathname+method match any in 'skipRoutes'
        if (protection.skipRoutes && routeMatchesWithMethod(pathname, method, protection.skipRoutes)) {
            return res;
        }

        // ✅ Finally, protect the route
        if (routeMatches(pathname, protection.routes as string[])) {
            if (protection.role && protection.applicableRoles) {
                logMessage(`log`, `req.url: matched protected route for role`, protection.role);
                return adminAuthMiddleware(req, protection.role, protection.applicableRoles);
            }
            break;
        }
    }

    return res; // Proceed normally if no protection or skipped
}

export const config = {
    matcher: [
        "/api/admin",
        "/api/admin/:path*",
        "/api/dropshipper",
        "/api/dropshipper/:path*",
        "/api/supplier",
        "/api/supplier/:path*",
        "/api/category",
        "/api/category/:path*",
        "/api/brand",
        "/api/brand/:path*",
        "/api/warehouse",
        "/api/warehouse/:path*",
        "/api/location/country",
        "/api/location/country/:path*",
        "/api/location/state",
        "/api/location/state/:path*",
        "/api/location/city",
        "/api/location/city/:path*",
        "/api/product",
        "/api/product/:path*",
        "/api/courier-company",
        "/api/courier-company/:path*",
        "/api/high-rto",
        "/api/high-rto/:path*",
        "/api/good-pincode",
        "/api/good-pincode/:path*",
        "/api/bad-pincode",
        "/api/bad-pincode/:path*",
        "/api/payment",
        "/api/payment/:path*",
        "/api/order",
        "/api/order/:path*",
    ],
};
