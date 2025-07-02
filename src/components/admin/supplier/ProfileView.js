"use client"
import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation';
import { useImageURL } from "@/components/ImageURLContext";
import { HashLoader } from 'react-spinners';
export default function ProfileView() {
    const router = useRouter();
    const [loading, setLoading] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const searchParams = useSearchParams();
    const id = searchParams.get("id");



    const { fetchImages } = useImageURL();
    const fetchSupplier = useCallback(async () => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));

        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData");
            router.push("/admin/auth/login");
            return;
        }

        const admintoken = adminData?.security?.token;

        if (!admintoken) {
            router.push("/admin/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${admintoken}`,
                },
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something went wrong!",
                    text: errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            setSuppliers(result.supplier)

        } catch (error) {
            console.error("Error fetching supplier:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id,]);
    useEffect(() => {
        fetchSupplier();
    }, [fetchSupplier])
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    return (
        <>
            <div className="bg-white p-5 rounded-md profilePage">
                <div className="flex justify-center items-center gap-5 mb-4">
                    <h2 className='text-center py-3 font-bold text-2xl'>{suppliers?.name} Profile</h2>
                    <button
                        className='bg-green-500 p-3 rounded-md  text-white'
                        onClick={() => { router.push(`/admin/supplier/update?id=${suppliers.id}`) }}>Update Profile</button>
                </div>
                <div className="flex gap-10">
                    <div className="col md:w-3/12 border border-gray-300 p-5 rounded-md">
                        <div className="img">
                            <Image src={fetchImages(suppliers.profilePicture)} alt={suppliers.name || 'Text'} height={200} width={200} />
                        </div>
                        <div className="user-info">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>{suppliers?.name}</h3>
                            <p>{suppliers?.email}</p>
                            <p><b>Current Address:</b>{suppliers?.currentAddress}</p>
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>Permanent Address</h3>
                            <p><b>Address:</b>{suppliers?.permanentAddress}</p>
                            <p><b>City:</b>{suppliers?.permanentCity?.name}</p>
                            <p><b>State:</b>{suppliers?.permanentState?.name}</p>
                            <p><b>Country:</b>{suppliers?.permanentCountry?.name}</p>
                            <p><b>Postal Code:</b>{suppliers?.permanentPostalCode}</p>

                        </div>
                    </div>
                    <div className="col md:w-9/12 grid md:grid-cols-2 gap-4 border border-gray-300 p-5 rounded-md">
                        <div className=" border border-gray-300 p-3 rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>Company Details</h3>
                            <p><b>Company Name:</b> {suppliers?.companyDetail?.companyName || "NIL"}</p>
                            <p><b>Client Entry Type:</b> {suppliers?.companyDetail?.clientEntryType || "NIL"}</p>
                            <p><b>Brand:</b> {suppliers?.companyDetail?.brandName || "NIL"}</p>
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>Company Billing Details</h3>
                            <p><b>Address:</b>{suppliers?.companyDetail?.billingAddress || "NIL"}</p>
                            <p><b>Pincode:</b> {suppliers?.companyDetail?.billingPincode || "NIL"}</p>
                            <p><b>State: </b>{suppliers?.companyDetail?.billingState?.name || "NIL"}</p>
                            <p><b>Country:</b> {suppliers?.companyDetail?.billingCountry?.name || "NIL"}</p>
                            <p><b>City:</b> {suppliers?.companyDetail?.billingCity?.name || "NIL"}</p>
                        </div>
                        <div className="border border-gray-300 p-3 rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>KYC Details (Comapany)</h3>
                            <p><b>GST Number:</b> {suppliers?.companyDetail?.gstNumber || "NIL"}</p>
                            <p><b>PanNumber:</b> {suppliers?.companyDetail?.companyPanNumber || "NIL"}</p>
                            <p><b>GST Document:</b> </p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {suppliers?.companyDetail?.gstDocument?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}
                                                alt={`Cancelled Cheque ${idx + 1}`}
                                                className="w-50 h-50 object-cover  rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>

                            <p><b>Pancard Name:</b> {suppliers?.companyDetail?.companyPanCardName || "NIL"}</p>
                            <p><b>Pancard Image:</b></p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {suppliers?.companyDetail?.companyPanCardImage?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}
                                                alt={`Cancelled Cheque ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>



                        </div>
                        <div className=" border border-gray-300 p-3 rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>KYC Details (Indivisual)</h3>

                            <p><b>Pancard Holder Name:</b> {suppliers?.companyDetail?.panCardHolderName || "NIL"}</p>
                            <p><b>Aadhar Number: </b>{suppliers?.companyDetail?.aadharNumber || "NIL"}</p>
                            <p><b>Aadharcard Holder Name:</b> {suppliers?.companyDetail?.aadharCardHolderName || "NIL"}</p>
                            <p><b>Pancard Image: </b> </p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {suppliers?.companyDetail?.panCardImage?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}

                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>

                            <p><b>Aadharcard Image:</b>  </p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {suppliers?.companyDetail?.aadharCardImage?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}

                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>
                        </div>
                        <div className=" border border-gray-300 p-3 rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>Additional Supporting Document</h3>
                            <p><b>Additional Documents:</b></p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {suppliers?.companyDetail?.additionalDocumentUpload?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}

                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>

                            <p><b>Document Id: </b>{suppliers?.companyDetail?.documentId || "NIL"}</p>
                            <p><b>Name: </b>{suppliers?.companyDetail?.documentName || "NIL"}</p>
                            <p><b>Image:</b></p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>

                                {suppliers?.companyDetail?.documentImage?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}
                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(cleanImg.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}
