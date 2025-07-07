"use client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const [status, setStatus] = useState("processing"); // "processing", true (success), false (failed)

  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const host = searchParams.get("host");
  const hmac = searchParams.get("hmac");
  const shop = searchParams.get("shop");
  const timestamp = searchParams.get("timestamp");

  const fetchStores = useCallback(async () => {
    /*
      const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

      if (dropshipperData?.project?.active_panel !== "dropshipper") {
        localStorage.removeItem("shippingData");
        router.push("/dropshipping/auth/login");
        return;
      }

      const token = dropshipperData?.security?.token;
      if (!token) {
        router.push("/dropshipping/auth/login");
        return;
      }
    */

    if (!code || !host || !hmac || !shop) {
      setStatus(false);
    }

    try {
      const form = new FormData();
      form.append("shop", shop);

      const url = `/api/dropshipper/shopify/callback?code=${code}&hmac=${hmac}&host=${host}&shop=${shop}&timestamp=${timestamp}`;

      const response = await fetch(url, {
        method: "GET",
        /*
          headers: {
            Authorization: `Bearer ${token}`,
          },
        */
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus(false);
      } else {
        setStatus(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus(false);
    }
  }, [router, code, host, hmac, shop, timestamp]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // UI rendering based on status
  if (status === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500 mb-4" />
        <h1 className="text-lg font-semibold text-gray-600">Connecting your Shopify store...</h1>
      </div>
    );
  }

  if (status === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
        <XCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-xl font-semibold text-red-600">Connection Failed</h1>
        <p className="text-gray-500 mt-2">We could not connect your store. Please try again.</p>
        <button
          className="bg-red-500 rounded-md p-3 text-white mt-3"
          onClick={() => router.push("/dropshipping/shopify/failed")}
        >
          Retry
        </button>
      </div>
    );
  }

  // If status === true
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
      <h1 className="text-xl font-semibold text-green-600">Shopify Store Connected!</h1>
      <p className="text-gray-500 mt-2">Your store has been successfully connected.</p>
      <button
        className="bg-orange-500 rounded-md p-3 text-white mt-3"
        onClick={() => router.push("/dropshipping")}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
