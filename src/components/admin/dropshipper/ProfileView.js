"use client"
import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation';
import { useImageURL } from "@/components/ImageURLContext";
import { HashLoader } from 'react-spinners';
export default function ProfileView() {
    const router = useRouter();
    const [loading, setLoading] = useState(null);
    const [dropshippers, setDropshippers] = useState([]);
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const { fetchImages } = useImageURL();
    const fetchDropshippers = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/${id}`, {
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
            setDropshippers(result.dropshipper)

        } catch (error) {
            console.error("Error fetching dropshipper:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id,]);
    useEffect(() => {
        fetchDropshippers();
    }, [fetchDropshippers])
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    return (
        <>
            <div className="bg-white md:p-5 rounded-md profilePage">
                <div className="flex justify-center items-center gap-5 mb-4">
                    <h2 className='text-center py-3 font-bold md:text-2xl'>{dropshippers?.name} </h2>
                    <button
                        className='bg-green-500 p-3 rounded-md  text-white'
                        onClick={() => { router.push(`/admin/dropshipper/update?id=${dropshippers.id}`) }}>Update Profile</button>
                </div>
                <div className="md:flex gap-10">
                    <div className="lg:w-4/12 col md:w-6/12 border border-gray-300 p-5 rounded-md">
                        <div className=" border border-gray-300 p-3 rounded col">
                            <div className="img">
                                <Image src={fetchImages(dropshippers.profilePicture)} alt={dropshippers.name || 'Text'} height={200} width={200} />
                            </div>
                            <div className="user-info">

                                <h3 className='text-orange-500 font-bold text-lg underline py-2'>{dropshippers?.name}</h3>
                                <p>{dropshippers?.email}</p>
                                <p><b>Mobile:</b>{dropshippers?.phoneNumber}</p>
                                <p><b>website:</b>{dropshippers?.website}</p>
                                <p><b>Referral Code:</b>{dropshippers?.referralCode}</p>


                            </div>
                        </div>
                        <div className="mt-3 border border-gray-300 p-3 rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>Permanent Address</h3>
                            <p><b>Address:</b>{dropshippers?.permanentAddress}</p>
                            <p><b>City:</b>{dropshippers?.permanentCity?.name}</p>
                            <p><b>State:</b>{dropshippers?.permanentState?.name}</p>
                            <p><b>Country:</b>{dropshippers?.permanentCountry?.name}</p>
                            <p><b>Postal Code:</b>{dropshippers?.permanentPostalCode}</p>
                        </div>
                    </div>
                    <div className="col mt-5 md:mt-0 lg:w-8/12 md:w-6/12   gap-4 border border-gray-300 p-5 rounded-md">
                        <div className="rounded col">
                            <h3 className='text-orange-500 font-bold text-lg underline py-2'>KYC Details</h3>
                            <p><b>GST Number:</b> {dropshippers?.companyDetail?.gstNumber || "NIL"}</p>
                            <p><b>GST Document:</b> </p>
                            <div className='flex max-w-3xl overflow-auto gap-4'>
                                {dropshippers?.companyDetail?.gstDocument
                                    ?.split(',')
                                    .filter(Boolean) // removes empty strings
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (
                                            <Image
                                                key={idx}
                                                height={100}
                                                width={100}
                                                src={fetchImages(cleanImg)}
                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded border"
                                                onClick={() => window.open(fetchImages(cleanImg), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        );
                                    })}
                            </div>

                            <p><b>Pancard Holder Name:</b> {dropshippers?.companyDetail?.panCardHolderName || "NIL"}</p>
                            <p><b>Aadharcard Holder Name:</b> {dropshippers?.companyDetail?.aadharCardHolderName || "NIL"}</p>
                            <p><b>Pancard Image: </b> </p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {dropshippers?.companyDetail?.panCardImage.split(',')
                                    .map((img, idx) => {
                                        const cleanImg = img.trim();
                                        return (

                                            <Image height={100} width={100}
                                                key={idx}
                                                src={fetchImages(cleanImg)}

                                                alt={`Image ${idx + 1}`}
                                                className="w-50 h-50 object-cover rounded"
                                                onClick={() => window.open(img.trim(), "_blank")}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )
                                    })}
                            </div>

                            <p><b>Aadharcard Image:</b>  </p>
                            <div className='flex max-w-3xl overflow-auto gap-3'>
                                {dropshippers?.companyDetail?.aadharCardImage.split(',').map((img, idx) => {
                                    const cleanImg = img.trim();
                                    return (
                                        <Image height={100} width={100}
                                            key={idx}
                                            src={fetchImages(cleanImg)}

                                            alt={`Image ${idx + 1}`}
                                            className="w-50 h-50 object-cover rounded"
                                            onClick={() => window.open(img.trim(), "_blank")}
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
