import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import qs from 'qs';
import { logMessage } from '@/utils/commonUtils';
import { isShopUsedAndVerified, verifyDropshipperShopifyStore } from '@/app/models/dropshipper/shopify';

export async function GET(req: NextRequest) {
    try {
        logMessage('debug', 'Received GET request to complete Shopify OAuth');
        console.log('Step 1: Start processing GET request');

        const url = new URL(req.url);
        const shop = url.searchParams.get('shop');
        const code = url.searchParams.get('code');
        const hmac = url.searchParams.get('hmac');
        const host = url.searchParams.get('host');
        console.log(`Step 2: Extracted query params - shop: ${shop}, code: ${code}, hmac: ${hmac}, host: ${host}`);

        if (!shop || !code || !hmac || !host) {
            console.log('Step 3: Missing required parameters');
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        /*
            // ✅ Check if shop is already used and verified
            console.log(`Step 4: Checking if shop "${shop}" is already used and verified...`);
            const isAlreadyUsed = await isShopUsedAndVerified(shop);
            console.log('Step 5: isShopUsedAndVerified result:', isAlreadyUsed);

            if (!isAlreadyUsed.status || !isAlreadyUsed.shopifyStore) {
                console.log('Step 6: Shop not used or not verified, aborting');
                return NextResponse.json({ status: false, message: isAlreadyUsed.message }, { status: 401 });
            }
            const shopifyStore = isAlreadyUsed.shopifyStore;
            console.log('Step 7: shopifyStore and dropshipper info:', { shopifyStore,  dropshipper });
        */

        const dropshipper = {
            id: null,
            role: null
        };

        // Required environment variables
        const requiredEnvVars = {
            NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
            NEXT_PUBLIC_SHOPIFY_API_SECRET: process.env.NEXT_PUBLIC_SHOPIFY_API_SECRET,
            NEXT_PUBLIC_SHOPIFY_SCOPES: process.env.NEXT_PUBLIC_SHOPIFY_SCOPES,
            NEXT_PUBLIC_SHOPIFY_REDIRECT_URL: process.env.NEXT_PUBLIC_SHOPIFY_REDIRECT_URL,
            NEXT_PUBLIC_SHOPIFY_API_VERSION: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION,
            APP_HOST: process.env.APP_HOST,
        };

        // Identify missing or empty env variables
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([key, val]) => {
                const isMissing = !val || val.trim() === '';
                if (isMissing) {
                    console.log(`Missing env variable: ${key}`);
                }
                return isMissing;
            })
            .map(([key]) => key);

        if (missingVars.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing or empty required environment variables.',
                    missing: missingVars,
                },
                { status: 400 }
            );
        }

        // Safe to use non-null assertion here because we checked above
        const redirectUrl = requiredEnvVars.NEXT_PUBLIC_SHOPIFY_REDIRECT_URL!;
        const apiSecret = requiredEnvVars.NEXT_PUBLIC_SHOPIFY_API_SECRET!;
        const apiKey = requiredEnvVars.NEXT_PUBLIC_SHOPIFY_API_KEY!;
        const apiVersion = requiredEnvVars.NEXT_PUBLIC_SHOPIFY_API_VERSION!;
        const appHost = requiredEnvVars.APP_HOST!;

        /*
        const scopes = requiredEnvVars.NEXT_PUBLIC_SHOPIFY_SCOPES!;
        */

        // ✅ Validate HMAC
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
            if (key !== 'hmac' && key !== 'signature') {
                params[key] = value;
            }
        });
        console.log('Step 12: Params for HMAC validation:', params);

        const message = new URLSearchParams(params).toString();
        console.log('Step 13: Message string for HMAC:', message);

        const generatedHash = crypto
            .createHmac('sha256', apiSecret)
            .update(message)
            .digest('hex');
        console.log('Step 14: Generated HMAC hash:', generatedHash);

        const hmacValid = crypto.timingSafeEqual(
            Buffer.from(hmac, 'utf-8'),
            Buffer.from(generatedHash, 'utf-8')
        );
        console.log('Step 15: HMAC valid?', hmacValid);

        if (!hmacValid) {
            console.log('Step 16: HMAC validation failed');
            return NextResponse.json({ error: 'HMAC validation failed.' }, { status: 401 });
        }

        // 🔐 Exchange code for access token
        console.log('Step 17: Exchanging code for access token...');
        const tokenRes = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            qs.stringify({
                client_id: apiKey,
                client_secret: apiSecret,
                code
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        console.log('Step 18: Received access token response:', tokenRes.data);

        const accessToken = tokenRes.data.access_token;

        // 🛒 Fetch shop data
        console.log('Step 19: Fetching shop data from Shopify API...');
        const shopInfoRes = await axios.get(
            `https://${shop}/admin/api/${apiVersion}/shop.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken
                }
            }
        );
        console.log('Step 20: Received shop info:', shopInfoRes.data.shop);

        const shopData = shopInfoRes.data.shop;

        await axios.post(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
            query: `mutation {
                webhookSubscriptionCreate(
                  topic: APP_UNINSTALLED,
                  webhookSubscription: {
                    callbackUrl: "${appHost}/webhooks/app-uninstalled",
                    format: JSON
                  }
                ) {
                  webhookSubscription {
                    id
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }`
        }, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        const privacyTopics = [
            {
                topic: 'CUSTOMERS_DATA_REQUEST',
                callback: `${appHost}/api/dropshipper/shopify/callback`,
            },
            {
                topic: 'CUSTOMERS_REDACT',
                callback: `${appHost}/api/dropshipper/shopify/callback`,
            },
            {
                topic: 'SHOP_REDACT',
                callback: `${appHost}/api/dropshipper/shopify/callback`,
            }
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
                webhookSubscription {
                    id
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

            const res = await axios.post(
                `https://${shop}/admin/api/${apiVersion}/graphql.json`,
                { query },
                {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const errors = res.data?.data?.webhookSubscriptionCreate?.userErrors;
            if (errors?.length) {
                console.error(`❌ Failed to register ${topic}`, errors);
            } else {
                console.log(`✅ Webhook registered for topic: ${topic}`);
            }
        }

        const payload = {
            admin: {
                connect: {
                    id: null
                }
            },
            shop: shop,
            accessToken: accessToken,
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
            shopCreatedAt: shopData.created_at
        };
        console.log('Step 21: Prepared payload for verifyDropshipperShopifyStore:', payload);

        // 🧩 Replace with actual dropshipper ID and role
        const dropshipperId = dropshipper.id;
        console.log(`Step 22: dropshipperId: ${dropshipperId}, role: ${dropshipper.role}`);

        const result = await verifyDropshipperShopifyStore(
            dropshipperId,
            dropshipper.role,
            payload
        );
        console.log('Step 23: Result from verifyDropshipperShopifyStore:', result);

        if (result?.status) {
            const shopifyAppRedirectUrl = `${redirectUrl}/apps/shipping-owl?host=${host}&shop=${shopData.myshopify_domain}`;

            console.log('Step 24: Store verified successfully, sending success response');
            return NextResponse.json({ status: true, redirectUrl: shopifyAppRedirectUrl, shopifyStore: result.shopifyStore }, { status: 200 });
        }

        logMessage('error', 'Failed to create store:', result?.message || 'Unknown error');
        console.log('Step 25: Store creation failed:', result?.message || 'Unknown error');
        return NextResponse.json({
            status: false,
            error: result?.message || 'Store creation failed',
        }, { status: 500 });

    } catch (error) {
        logMessage('error', 'OAuth Callback Error:', error);
        console.log('Step 26: Exception caught in OAuth flow:', error);
        return NextResponse.json({ status: false, error }, { status: 500 });
    }
}
