"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import qs from "qs";
import crypto from "crypto";

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing"); // "processing", true, false

  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const hmac = searchParams.get("hmac");
  const host = searchParams.get("host");

  const fetchStores = useCallback(async () => {
    try {
      console.log(`Step 2: Extracted query params - shop: ${shop}, code: ${code}, hmac: ${hmac}, host: ${host}`);

      if (!shop || !code || !hmac || !host) {
        console.error("Missing required parameters");
        setStatus(false);
        return;
      }

      const env = {
        SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
        SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
        SHOPIFY_REDIRECT_URL: process.env.SHOPIFY_REDIRECT_URL,
        SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION,
        APP_HOST: process.env.APP_HOST,
      };

      const missingEnv = Object.entries(env).filter(([_, val]) => !val?.trim());
      if (missingEnv.length) {
        console.error("Missing env variables:", missingEnv.map(([key]) => key));
        setStatus(false);
        return;
      }

      const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_REDIRECT_URL, SHOPIFY_API_VERSION, APP_HOST } = env;

      // Validate HMAC
      const urlParams = new URLSearchParams(window.location.search);
      const sortedParams = {};
      urlParams.forEach((value, key) => {
        if (key !== "hmac" && key !== "signature") {
          sortedParams[key] = value;
        }
      });

      const message = new URLSearchParams(sortedParams).toString();
      const generatedHash = crypto
        .createHmac("sha256", SHOPIFY_API_SECRET)
        .update(message)
        .digest("hex");

      const isValidHmac = crypto.timingSafeEqual(
        Buffer.from(hmac, "utf-8"),
        Buffer.from(generatedHash, "utf-8")
      );

      if (!isValidHmac) {
        console.error("HMAC validation failed.");
        setStatus(false);
        return;
      }

      // Exchange code for access token
      const tokenRes = await axios.post(
        `https://${shop}/admin/oauth/access_token`,
        qs.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const accessToken = tokenRes.data.access_token;

      // Fetch shop info
      const shopInfoRes = await axios.get(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/shop.json`, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      const shopData = shopInfoRes.data.shop;

      // Register APP_UNINSTALLED webhook
      await axios.post(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          query: `mutation {
            webhookSubscriptionCreate(
              topic: APP_UNINSTALLED,
              webhookSubscription: {
                callbackUrl: "${APP_HOST}/webhooks/app-uninstalled",
                format: JSON
              }
            ) {
              webhookSubscription { id }
              userErrors { field message }
            }
          }`,
        },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      // Register privacy webhooks
      const privacyTopics = [
        { topic: "CUSTOMERS_DATA_REQUEST", callback: `${APP_HOST}/api/dropshipper/shopify/callback` },
        { topic: "CUSTOMERS_REDACT", callback: `${APP_HOST}/api/dropshipper/shopify/callback` },
        { topic: "SHOP_REDACT", callback: `${APP_HOST}/api/dropshipper/shopify/callback` },
      ];

      for (const { topic, callback } of privacyTopics) {
        const query = `
        mutation {
          webhookSubscriptionCreate(
            topic: ${topic},
            webhookSubscription: {
              callbackUrl: "${callback}",
              format: JSON
            }
          ) {
            webhookSubscription { id }
            userErrors { field message }
          }
        }`;

        const res = await axios.post(
          `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
          { query },
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          }
        );

        const errors = res.data?.data?.webhookSubscriptionCreate?.userErrors;
        if (errors?.length) {
          console.error(`Failed to register ${topic}`, errors);
        } else {
          console.log(`Webhook registered: ${topic}`);
        }
      }

      const payload = {
        admin: { connect: { id: shopData.adminId } },
        shop,
        accessToken,
        email: shopData.email,
        shopOwner: shopData.shop_owner,
        name: shopData.name,
        domain: shopData.domain,
        myshopifyDomain: shopData.myshopify_domain,
        planName: shopData.plan_name,
        countryName: shopData.country_name,
        province: shopData.province,
        city: shopData.city,
        phone: shopData.phone,
        currency: shopData.currency,
        moneyFormat: shopData.money_format,
        ianaTimezone: shopData.iana_timezone,
        shopCreatedAt: shopData.created_at,
      };

      const dropshipperId = dropshipper.id; // Assumes global or imported
      console.log(`payload - `, payload);
    } catch (err) {
      console.error("OAuth Callback Error:", err);
      setStatus(false);
    }
  }, [shop, code, hmac, host]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // UI rendering
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
      <h1 className="text-xl font-semibold text-green-600">Shopify Store Connected!</h1>
      <p className="text-gray-500 mt-2">Your store has been successfully connected.</p>
      <button className="bg-orange-500 rounded-md p-3 text-white mt-3" onClick={() => router.push("/dropshipping")}>
        Go to Dashboard
      </button>
    </div>
  );
}
