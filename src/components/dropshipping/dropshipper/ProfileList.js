"use client";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import React, { useState, useCallback, useEffect } from "react";
import Image from 'next/image';
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import { useImageURL } from "@/components/ImageURLContext";
const ProfileList = () => {
    const { fetchImages } = useImageURL();
    const [suppliers, setSuppliers] = useState([]);
    const { verifyDropShipperAuth } = useDropshipper();
    const [cityData, setCityData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [isTrashed, setIsTrashed] = useState(false);
    const router = useRouter();
    const { hasPermission } = useDropshipper();
    const [loading, setLoading] = useState(false);

    const canAddBank = hasPermission("My Profile", "Bank Account Change Request");
    const canEdit = hasPermission("My Profile", "Update"); const fetchSupplier = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${suppliertoken}`,
                },
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: errorMessage.error || errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
            }

            const result = await response.json();
            if (result) {
                setSuppliers(result?.dropshipper || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setSuppliers]);
    const fetchCity = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `/api/location/city`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: result.message || result.error || "Your session has expired. Please log in again.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }

            setCityData(result?.cities || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);
    const handleEditBank = () => {
        router.push(`/dropshipping/bank/update`);
    }

    const fetchState = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `/api/location/state`,
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
                        "Your session has expired. Please log in again.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result) {
                setStateData(result?.states || []);
            }
        } catch (error) {
            console.error("Error fetching state:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setStateData]);


    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifyDropShipperAuth();
            await fetchSupplier();
            await fetchCity();
            await fetchState();
            setLoading(false);
        };
        fetchData();
    }, [fetchSupplier, verifyDropShipperAuth]);

    const handleEdit = () => {
        router.push(`/dropshipping/profile/update`);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    return (

        <div className="grid gap-6 md:grid-cols-2 ">
            <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-semibold text-[#2B3674] mb-4">Personal Information</h3>
                <div className="space-y-2 text-[#2B3674]">
                    <Image src={fetchImages(suppliers.profilePicture)}
                        alt={suppliers.name} height={200} width={200} />
                    <p><strong>Name:</strong> {suppliers.name || '-'}</p>
                    <p><strong>Email:</strong> {suppliers.email || '-'}</p>
                    <p><strong>Website Url:</strong> {suppliers.website || '-'}</p>
                    <p><strong>Referral Code:</strong> {suppliers.referralCode || '-'}</p>
                    <p><strong>Permanent Address:</strong> {suppliers.permanentAddress || '-'}</p>
                    <p><strong>State:</strong> {stateData.find(s => s.id === suppliers.permanentStateId)?.name || '-'}</p>
                    <p><strong>City:</strong> {cityData.find(c => c.id === suppliers.permanentCityId)?.name || '-'}</p>
                    <p><strong>Postal Code:</strong> {suppliers.permanentPostalCode || '-'}</p>
                </div>
                {
                    canEdit && (
                        <div className="mt-4 text-right">
                            <button onClick={() => handleEdit(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'>Update Profile</button>
                        </div>
                    )
                }
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md ">
                <h3 className="text-xl font-semibold text-[#2B3674] mb-4">Bank Account Details</h3>
                {Array.isArray(suppliers.bankAccounts) && suppliers.bankAccounts.length > 0 ? (
                    <div className="space-y-4">
                        {suppliers.bankAccounts.map((bank, index) => (
                            <div key={bank.id} className="bg-white p-4 rounded-lg border">
                                <p><strong>Account Holder Name:</strong> {bank.accountHolderName}</p>
                                <p><strong>Account Number:</strong> {bank.accountNumber}</p>
                                <p><strong>Bank Name:</strong> {bank.bankName}</p>
                                <p><strong>Branch:</strong> {bank.bankBranch}</p>
                                <p><strong>Account Type:</strong> {bank.accountType}</p>
                                <p><strong>IFSC Code:</strong> {bank.ifscCode}</p>

                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[#A3AED0]">No bank account details available.</p>
                )}
                {
                    canAddBank && (
                        <div className="mt-4 text-right">
                            {!suppliers.bankAccount ? (<button onClick={() => handleEditBank(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'> Bank  Account Add Request</button>) : (
                                <button onClick={() => handleEditBank(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'> Bank  AccountUpdate Request</button>
                            )
                            }
                        </div>

                    )
                }
            </div>
        </div>

    );

};

export default ProfileList;
