"use client";

import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import Banner from './Banner';
import NewlyLaunched from './NewlyLaunched';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
    const [loading, setLoading] = useState(true);
    const { verifyDropShipperAuth } = useDropshipper();
    const router = useRouter();

    const shopifyStore = localStorage.getItem("shopifyStore") || null;

    const fetchShopifyStore = () => {
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

        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);

        const formdata = new FormData();

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
                localStorage.removeItem("shopifyStore");
            })
            .catch((error) => {
                console.error("Error:", error);
                // Optionally, handle error or redirect
            })
            .finally(() => {
                setLoading(false); // ✅ Stop loading whether success or fail
            });
    };

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const isValid = await verifyDropShipperAuth();
            if (isValid && shopifyStore) {
                fetchShopifyStore();
            } else {
                setLoading(false); // still allow page to load if no shopifyStore
            }
        };

        checkAuthAndFetch();
    }, [verifyDropShipperAuth]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-lg font-semibold text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>
    );
};

export default Home;
