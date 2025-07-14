'use client';

import Image from 'next/image';
import productImage from '@/app/images/product-img.png'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { HashLoader } from 'react-spinners';
import Swal from 'sweetalert2';
import { useAdmin } from '../middleware/AdminMiddleWareContext';

export default function ProductList() {
    const [isTrashed, setIsTrashed] = useState(false);
    const [dropshipper, setDropshipper] = useState([]);
    const [data, setData] = useState([]);

    const { verifyAdminAuth } = useAdmin();
    const [productsRequest, setProductsRequest] = useState([]);
    const [loading, setLoading] = useState(null);
    const router = useRouter();
    const fetchDropshipper = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper`, {
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
                    title: "Something Wrong!",
                    text: errorMessage.error || errorMessage.message || "Network Error.",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
            }

            const result = await response.json();
            if (result) {
                setDropshipper(result?.dropshippers || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setDropshipper]);

    const fetchProducts = useCallback(async () => {
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
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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
            await verifyAdminAuth();
            await fetchProducts();
            await fetchDropshipper();
        };
        fetchData();
    }, []);

    const trashProducts = useCallback(async () => {
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
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/trashed`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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
                setProductsRequest(result?.productRequests || []);
            }
        } catch (error) {
            console.error("Error fetching trashed products:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setProductsRequest]);

    const handleDelete = async (item) => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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
    const filteredItems = productsRequest.filter((i, index) => data === i.id);



    const handleEditItem = (item) => {
        router.push(`/admin/dropshipper/product/source/update?id=${item.id}`);
    };


    const handleRestore = useCallback(async (item) => {
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
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/${item?.id}/restore`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/request/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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
                    <div className="">

                        <div className="flex flex-wrap md:justify-between gap-3 items-center justify-center mb-6">
                            <div className="md:w-6/12">
                                <label className="block text-sm font-medium text-gray-700">Select Dropshipper</label>
                                <select onChange={(e) => setData(e.target.value)}
                                    className="w-full mt-1 px-3 py-3 border-[#DFEAF2] bg-white border rounded-lg text-sm">
                                    <option>Select Dropshipper</option>
                                    {dropshipper?.map((item, index) => {
                                        return (
                                            <option key={index} value={item.id}>{item.name}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className='flex gap-2'>
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

                                <Link href="/admin/dropshipper/product/source/create">
                                    <button className="bg-[#F98F5C] text-white lg:px-8 p-4 py-2 rounded-md">Add New</button>
                                </Link>
                            </div>
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
                                            <button className="mt-2 bg-blue-500 nunito text-white px-4 py-2 rounded w-auto font-semibold">
                                                Add to list
                                            </button>
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
