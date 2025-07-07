"use client"


import { useDropshipper } from '../middleware/DropshipperMiddleWareContext'
import Banner from './Banner'

import NewlyLaunched from './NewlyLaunched'
import React, { useEffect } from 'react'

const Home = () => {
    const { verifyDropShipperAuth } = useDropshipper();
    useEffect(() => {
        verifyDropShipperAuth();
    }, [verifyDropShipperAuth]);

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

            const url = "/api/dropshipper/shopify/connect";

            const response = fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });

            const result = response.json();

            if (!response.ok) {
                router.push("/dropshipping/shopify/failed");
            } else {
                router.push(result.installUrl);
            }
        } catch (error) {
            console.error("Error:", error);
            router.push("/dropshipping/shopify/failed");
        } finally {

        }
    }

    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>

    )
}

export default Home