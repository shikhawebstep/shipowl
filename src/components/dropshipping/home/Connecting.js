"use client";

import { useEffect, useCallback } from "react";
import { useDropshipper } from "../middleware/DropshipperMiddleWareContext";
import { useSearchParams, useRouter } from "next/navigation";

export default function Connecting() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get("shop");

  const fetchStores = useCallback(async () => {
    if (!shop) {
      console.error("Missing shop query parameter");
      router.push("/error?reason=missing_shop");
      return;
    }

    const {
      APP_HOST,
      SHOPIFY_API_KEY,
      SHOPIFY_API_SECRET,
      SHOPIFY_SCOPES,
      SHOPIFY_REDIRECT_URL,
      SHOPIFY_API_VERSION,
    } = process.env;

    const requiredVars = {
      APP_HOST,
      SHOPIFY_API_KEY,
      SHOPIFY_API_SECRET,
      SHOPIFY_SCOPES,
      SHOPIFY_REDIRECT_URL,
      SHOPIFY_API_VERSION,
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([_, val]) => !val || val.trim() === "")
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("Missing environment variables:", missingVars);
      router.push("/error?reason=missing_env");
      return;
    }

    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${SHOPIFY_API_KEY}` +
      `&scope=${SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(SHOPIFY_REDIRECT_URL)}` +
      `&grant_options[]=per-user`;

    window.location.href = installUrl;
  }, [shop, router]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
      <h1 className="text-xl font-semibold text-gray-800">
        Connecting your Shopify store...
      </h1>
      <p className="text-gray-500 mt-2">
        Please wait while we establish a secure connection.
      </p>
    </div>
  );
}
