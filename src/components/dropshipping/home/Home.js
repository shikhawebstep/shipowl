"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import Banner from './Banner';
import NewlyLaunched from './NewlyLaunched';

const Home = () => {
    const { verifyDropShipperAuth } = useDropshipper();
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const connectShop = async () => {
            const shop = localStorage.getItem("shop");
            const shippingData = localStorage.getItem("shippingData");

            if (!shop || !shippingData) return;

            const dropshipperData = JSON.parse(shippingData);

            if (dropshipperData?.project?.active_panel !== "dropshipper") {
                localStorage.removeItem("shippingData");
                router.replace("/dropshipping/auth/login");
                return;
            }

            const token = dropshipperData?.security?.token;
            if (!token) {
                router.replace("/dropshipping/auth/login");
                return;
            }

            try {
                const form = new FormData();
                form.append("shop", shop);

                const response = await fetch("/api/dropshipper/shopify/connect", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                });

                const result = await response.json();

                if (!response.ok || !result.installUrl) {
                    router.replace("/dropshipping/shopify/failed");
                } else {
                    router.replace(result.installUrl);
                }
            } catch (error) {
                console.error("Error connecting shop:", error);
                router.replace("/dropshipping/shopify/failed");
            }
        };

        verifyDropShipperAuth();
        connectShop();
    }, [verifyDropShipperAuth]);

    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>
    );
};

export default Home;
