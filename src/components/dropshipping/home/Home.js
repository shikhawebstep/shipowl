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
        const connectShop = async () => {
            const shop = localStorage.getItem("shop");

            if (shop) {
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

                    if (!response.ok) {
                        router.push("/dropshipping/shopify/failed");
                    } else {
                        router.push(result.installUrl);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    router.push("/dropshipping/shopify/failed");
                }
            }
        };

        verifyDropShipperAuth();
        connectShop();
    }, [verifyDropShipperAuth, router]);

    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>
    );
};

export default Home;
