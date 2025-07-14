"use client";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
import { ProfileContext } from './ProfileContext';

import { useImageURL } from "@/components/ImageURLContext";
import Image from 'next/image';
const ProfileList = () => {
    const { fetchImages } = useImageURL();
    const [suppliers, setSuppliers] = useState([]);
    const { verifySupplierAuth } = useSupplier();
    const [cityData, setCityData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [isTrashed, setIsTrashed] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { hasPermission } = useSupplier();
    const { setActiveTab } = useContext(ProfileContext);

    const fetchSupplier = useCallback(async () => {
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
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/profile`, {
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
                    text: errorMessage.error || errorMessage.message || "Network Error.",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
            }

            const result = await response.json();
            if (result) {
                setSuppliers(result?.supplier || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setSuppliers]);
    const fetchCity = useCallback(async () => {
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
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/city`,
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
                    text: result.message || result.error || "Network Error.",
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

    const fetchState = useCallback(async () => {
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
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state`,
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
            await verifySupplierAuth();
            await fetchSupplier();
            await fetchCity();
            await fetchState();
            setLoading(false);
        };
        fetchData();
    }, [fetchSupplier, verifySupplierAuth]);



    const handleEdit = () => {
        setActiveTab('profile-edit')
        router.push(`/supplier/profile/update`);
    }
    const handleEditBank = () => {
        router.push(`/supplier/bank/update`);
    }

    const canAddBank = hasPermission("My Profile", "Bank Account Change Request");
    const canEdit = hasPermission("My Profile", "Update");
    return (
        loading ? (
            <div className="flex justify-center items-center h-96">
                <HashLoader color="orange" />
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 ">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                    <h3 className="text-2xl font-semibold text-[#2B3674] mb-4">Personal Information</h3>
                    <div className='lg:flex gap-4 items-start'>
                        <div>
                            <Image
                                src={fetchImages(suppliers.profilePicture)}
                                alt={suppliers.name || "Supplier Profile Picture"}
                                height={100}
                                width={200}
                                className="rounded-md"
                            />
                        </div>
                        <div className="space-y-2 text-[#2B3674]">
                            <p><strong>Name:</strong> {suppliers.name || '-'}</p>
                            <p><strong>Email:</strong> {suppliers.email || '-'}</p>
                            <p><strong>Permanent Address:</strong> {suppliers.permanentAddress || '-'}</p>
                            <p><strong>State:</strong> {stateData.find(s => s.id === suppliers.permanentStateId)?.name || '-'}</p>
                            <p><strong>City:</strong> {cityData.find(c => c.id === suppliers.permanentCityId)?.name || '-'}</p>
                            <p><strong>Postal Code:</strong> {suppliers.permanentPostalCode || '-'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-md">
                    <h3 className="text-2xl font-semibold text-[#2B3674] my-4">Company Details</h3>
                    <div className="space-y-2 text-[#2B3674]">
                        <p><strong>Company Name:</strong> {suppliers?.companyDetail?.companyName || '-'}</p>
                        <p><strong>Company PanNumber:</strong> {suppliers?.companyDetail?.companyPanNumber || '-'}</p>
                        <p><strong>Brand Name:</strong> {suppliers?.companyDetail?.brandName || '-'}</p>
                        <p><strong>Billing Address:</strong> {suppliers?.companyDetail?.billingAddress || '-'}</p>
                        <p><strong>Billing Pincode:</strong> {suppliers?.companyDetail?.billingPincode || '-'}</p>
                        <p><strong>AadharCardHolderName:</strong> {suppliers?.companyDetail?.aadharCardHolderName || '-'}</p>

                    </div>
                    <div className="mt-4 text-right">{
                        canEdit && <button onClick={() => handleEdit(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'>Update Profile</button>
                    }
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-md">
                    <h3 className="text-2xl font-semibold text-[#2B3674] mb-4">Bank Account Details</h3>
                    {suppliers.bankAccount ? (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border">
                                <p><strong>Account Holder Name:</strong> {suppliers.bankAccount.accountHolderName}</p>
                                <p><strong>Account Number:</strong> {suppliers.bankAccount.accountNumber}</p>
                                <p><strong>Bank Name:</strong> {suppliers.bankAccount.bankName}</p>
                                <p><strong>Branch:</strong> {suppliers.bankAccount.bankBranch}</p>
                                <p><strong>Account Type:</strong> {suppliers.bankAccount.accountType}</p>
                                <p><strong>IFSC Code:</strong> {suppliers.bankAccount.ifscCode}</p>
                                {suppliers.bankAccount.cancelledChequeImage ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {suppliers.bankAccount.cancelledChequeImage
                                            .split(',')
                                            .map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={fetchImages(img)}

                                                    alt={`Cancelled Cheque ${idx + 1}`}
                                                    className="w-24 h-24 object-cover border rounded"
                                                    onClick={() => window.open(img.trim(), "_blank")}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-2">No cancelled cheque image uploaded.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-[#A3AED0]">No bank account details available.</p>
                    )}
                    {canAddBank && (
                        <div className="mt-4 text-right">

                            {!suppliers.bankAccount ? (<button onClick={() => handleEditBank(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'> Bank  Account Add Request</button>) : (
                                <button onClick={() => handleEditBank(suppliers.id)} className='bg-orange-500 text-white p-3 rounded-md'> Bank  AccountUpdate Request</button>
                            )
                            }
                        </div>
                    )}

                </div>


            </div>
        )
    );

};

export default ProfileList;
