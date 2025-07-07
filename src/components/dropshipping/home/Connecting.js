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

    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}` +
      `&scope=${process.env.NEXT_PUBLIC_SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SHOPIFY_REDIRECT_URL)}` +
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
