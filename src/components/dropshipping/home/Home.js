"use client"


import { useDropshipper } from '../middleware/DropshipperMiddleWareContext'
import Banner from './Banner'

import NewlyLaunched from './NewlyLaunched'
import React, { useEffect } from 'react'

const Home = () => {
    const shopifyStore = localStorage.getItem("shopifyStore")
    const { verifyDropShipperAuth } = useDropshipper();
    const fetchShopifyStore = () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        // ✅ Fix: Use localStorage.removeItem, not clear (which clears all keys!)
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login"); // corrected path consistency
            return;
        }

        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);

        const formdata = new FormData(); // If needed, you can append values here

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: formdata,
            redirect: "follow",
        };

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/shopify/${shopifyStore}/assign`, requestOptions)
            .then((response) => {
                if (!response.ok) throw new Error("Failed to assign Shopify store");
                return response.text();
            })
            .then((result) => {
                console.log("Success:", result);
                localStorage.removeItem("shopifyStore")
            })
            .catch((error) => {
                console.error("Error:", error);
                // ✅ Optional: show alert
            });
    };

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const isValid = await verifyDropShipperAuth();
            if (isValid && shopifyStore) {
                fetchShopifyStore();
            }
        };

        checkAuthAndFetch();
    }, [verifyDropShipperAuth]);
    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>

    )
}

export default Home