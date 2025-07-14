'use client';

import { useState, createContext, useCallback } from 'react';
import { useRouter } from "next/navigation";

const BrandContext = createContext();

const BrandProvider = ({ children }) => {
    const router = useRouter();
    const [brandData, setBrandData] = useState([]);
    const [isEdit, setIsEdit] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status:false,
        image:""
    });

    const fetchBrand = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/brand`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Network Error.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result) {
                setBrandData(result?.categories);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }, [router]);

    return (
        <BrandContext.Provider value={{ formData, brandData,setIsEdit,isEdit, setBrandData, setFormData, fetchBrand }}>
            {children}
        </BrandContext.Provider>
    );
};

export { BrandProvider, BrandContext };
