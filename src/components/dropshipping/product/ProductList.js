'use client';

import Image from 'next/image';
import productImage from '@/app/images/product-img.png'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import { useEffect, useState, useCallback } from 'react';
import { HashLoader } from 'react-spinners';
import Swal from 'sweetalert2';

export default function ProductList() {
    const [isTrashed, setIsTrashed] = useState(false);
    const { verifyDropShipperAuth } = useDropshipper();
    const [productsRequest, setProductsRequest] = useState([]);
    const [loading, setLoading] = useState(null);
    const router = useRouter();
    const fetchProducts = useCallback(async () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/request/my`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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
                setProductsRequest(result?.productRequests || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setProductsRequest]);
    useEffect(() => {
        const fetchData = async () => {
            await verifyDropShipperAuth();
            await fetchProducts();
        };
        fetchData();
    }, []);

    const trashProducts = useCallback(async () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/my/trashed`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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
                setProductsRequest(result?.productRequests || []);
            }
        } catch (error) {
            console.error("Error fetching trashed products:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setProductsRequest]);

    const handleDelete = async (item) => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            setLoading(true);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/my/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
                    },
                }
            );

            Swal.close();

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMessage.error || errorMessage.message || "Failed to delete.",
                });
                setLoading(false);
                return;
            }

            const result = await response.json();

            Swal.fire({
                icon: "success",
                title: "Trash!",
                text: result.message || `${item.name} has been Trashed successfully.`,
            });

            await fetchProducts();
        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };


    const handleEditItem = (item) => {
        router.push(`/dropshipping/product/source/update?id=${item.id}`);
    };


    const handleRestore = useCallback(async (item) => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/my/${item?.id}/restore`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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
            if (result.status) {
                Swal.fire({
                    icon: "success",
                    text: `${item.name} Has Been Restored Successfully !`,
                });
                await trashProducts();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashProducts]);
    const handlePermanentDelete = async (item) => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            setLoading(true);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/my/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
                    },
                }
            );

            Swal.close();

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMessage.error || errorMessage.message || "Failed to delete.",
                });
                setLoading(false);
                return;
            }

            const result = await response.json();

            Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: result.message || `${item.name} has been deleted successfully.`,
            });

            await trashProducts();
        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <>
                    <div className="py-5">
                        <div className="flex flex-wrap md:justify-end gap-3 justify-center mb-6">
                            <button className="bg-[#05CD99] text-white lg:px-8 p-4 py-2 rounded-md">Export</button>

                            <button
                                className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                onClick={async () => {
                                    if (isTrashed) {
                                        setIsTrashed(false);
                                        await fetchProducts();
                                    } else {
                                        setIsTrashed(true);
                                        await trashProducts();
                                    }
                                }}
                            >
                                {isTrashed ? "Product Listing (Simple)" : "Trashed Product"}
                            </button>

                            <button className="bg-[#3965FF] text-white lg:px-8 p-4 py-2 rounded-md">Import</button>

                            <Link href="/dropshipping/product/source/create">
                                <button className="bg-[#F98F5C] text-white lg:px-8 p-4 py-3 rounded-md">Add New</button>
                            </Link>
                        </div>

                        {productsRequest.length > 0 ? (
                            <div className="grid lg:grid-cols-4 md:grid-cols-2 products-grid gap-6">
                                {productsRequest.map((product) => (
                                    <div
                                        key={product.id}
                                        className="group bg-white rounded-2xl overflow-hidden border border-[#B9B9B9] relative"
                                    >
                                        <Image
                                            src={productImage || product.image}
                                            alt={product.name}
                                            className="w-full"
                                        />

                                        {/* Hover buttons */}
                                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                                            {isTrashed ? (
                                                <>
                                                    <button onClick={() => handleRestore(product)} className="bg-green-500 text-white px-3 py-1 text-sm rounded">Restore</button>
                                                    <button onClick={() => handlePermanentDelete(product)} className="bg-red-500 text-white px-3 py-1 text-sm rounded">Permanent Delete</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditItem(product)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded">Edit</button>
                                                    <button onClick={() => handleDelete(product)} className="bg-red-500 text-white px-3 py-1 text-sm rounded">Trash</button>
                                                </>
                                            )}
                                        </div>

                                        <div className="mt-3 p-3">
                                            <div className='flex justify-between'>
                                                <div>
                                                    <h2 className="text-lg font-semibold nunito">{product.name}</h2>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-black font-bold nunito">₹ {product.expectedPrice}</p>
                                                    <p className="text-sm text-[#202224] nunito">Exp. Orders : {product.expectedDailyOrders}</p>
                                                </div>
                                            </div>
                                            <div className='flex gap-2'> <button className="mt-2 bg-blue-500 nunito text-white px-4 py-2 rounded w-auto font-semibold">
                                                Push To Shopify
                                            </button>
                                                <button className="mt-2 bg-orange-500 nunito text-white px-4 py-2 rounded w-auto font-semibold">
                                                    Add to Channel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center">No Data Available</p>
                        )}
                    </div>
                </>
            )}

        </>
    );
}
