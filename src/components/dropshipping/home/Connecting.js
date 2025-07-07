"use client";

import { useEffect, useCallback } from "react";
import { useDropshipper } from "../middleware/DropshipperMiddleWareContext";
import { useSearchParams, useRouter } from "next/navigation";

export default function Connecting() {
  const { verifyDropShipperAuth } = useDropshipper();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get("shop");

  const redirectToShopifyInstall = useCallback(() => {
    if (!shop) return;

    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${process.env.SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(process.env.SHOPIFY_REDIRECT_URL)}` +
      `&grant_options[]=per-user`;

    window.location.href = installUrl; // Perform redirect
  }, [shop]);

  useEffect(() => {
    redirectToShopifyInstall();
  }, [redirectToShopifyInstall]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
      <h1 className="text-xl font-semibold text-gray-800">Connecting your Shopify store...</h1>
      <p className="text-gray-500 mt-2">
        Please wait while we establish a secure connection.
      </p>
    </div>
  );
}
