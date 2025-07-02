"use client"

import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useDropshipper } from './middleware/DropshipperMiddleWareContext'
import { HashLoader } from "react-spinners";
import { useImageURL } from "@/components/ImageURLContext";
import Image from 'next/image'
export default function AddShopifyStore() {
    const { fetchImages } = useImageURL();
    const router = useRouter();
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShop, setSelectedShop] = useState('');
    const [shopifyStores, setShopifyStores] = useState([]);
    const { verifyDropShipperAuth, hasPermission } = useDropshipper();
    const [formData, setFormData] = useState({
        shop: '',
    })
    const fetchStores = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/shopify`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${dropshippertoken}`,
                },
            });

            const result = await response.json();
            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: result.error || result.message || "Your session has expired. Please log in again.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }

            setShopifyStores(result?.shopifyStores || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);
    useEffect(() => {
        setLoading(true);
        verifyDropShipperAuth();
        fetchStores()
        setLoading(false);

    }, [verifyDropShipperAuth]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? true : false) : value
        }));
    };

    const validate = () => {
        const errors = {};

        if (!formData.shop || formData.shop.trim() === '') {
            errors.shop = 'Shop is required.';
        }


        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.clear("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        setValidationErrors({});

        try {
            Swal.fire({
                title: 'Creating Shoap...',
                text: 'Please wait while we save your Shoap.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            form.append('shop', formData.shop);


            const url = "/api/dropshipper/shopify/connect";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: form,
            });

            const result = await response.json(); // Parse the result here

            if (!response.ok) {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Creation Failed",
                    text: result.message || result.error || "An error occurred",
                });


                if (result.error && typeof result.error === 'object') {
                    const entries = Object.entries(result.error);
                    let focused = false;

                    entries.forEach(([key, message]) => {
                        setValidationErrors((prev) => ({
                            ...prev,
                            [key]: message,
                        }));

                        if (!focused) {
                            setTimeout(() => {
                                const input = document.querySelector(`[name="${key}"]`);
                                if (input) input.focus();
                            }, 300);

                            focused = true;
                        }
                    });
                }
            } else {
                Swal.close();
                Swal.fire({
                    icon: "success",
                    title: "Shop Created",
                    text: `The Shop has been created successfully!`,
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        setFormData({ name: '' });
                        router.push(result.installUrl)

                    }
                });
            }

        } catch (error) {
            console.error("Error:", error);
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Submission Error",
                text: error.message || "Something went wrong. Please try again.",
            });
            setError(error.message || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleShopSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.clear("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            Swal.fire({
                title: 'Updating Shoap...',
                text: 'Please wait while we save your Shoap.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            form.append('name', selectedShop.name);

            if (selectedShop?.logo instanceof File) {
                form.append('logo', selectedShop.logo); // Single file
            }



            const url = `/api/dropshipper/shopify/${selectedShop?.id}`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: form,
            });

            const result = await response.json(); // Parse the result here

            if (!response.ok) {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Failed",
                    text: result.message || result.error || "An error occurred",
                });



            } else {
                Swal.close();
                Swal.fire({
                    icon: "success",
                    title: "Shop Updated",
                    text: `The Shop has been Updated successfully!`,
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        fetchStores();
                        setModalOpen(false);
                        setSelectedShop('');

                    }
                });
            }

        } catch (error) {
            console.error("Error:", error);
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Submission Error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };
    const handleChangeShop = (e) => {
        const { name, value, files } = e.target;

        setSelectedShop((prev) => ({
            ...prev,
            [name]: name === 'logo' ? files[0] : value
        }));
    };


    const canCreate = hasPermission("Shopify", "Create");
    const canDestory = hasPermission("Shopify", "Permanent Delete");
    const canRestore = hasPermission("Shopify", "Restore");
    const canSoftDelete = hasPermission("Shopify", "Soft Delete");
    const canEdit = hasPermission("Shopify", "Update");
    const canViewTrashed = hasPermission("Shopify", "Trash Listing");
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    return (
        <>
            <section className="">
                <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl w-full p-5">
                        <h2 className='text-2xl font-bold pb-4'>Add New Store </h2>
                        {canCreate ? (

                            <form onSubmit={handleSubmit}>
                                <div className=" ">
                                    <div>
                                        <label htmlFor="name" className="font-bold block text-[#232323]">
                                            Shop Name <span className='text-red-500 text-lg'>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="shop"
                                            value={formData?.shop || ''}
                                            id="shop"
                                            onChange={handleChange}
                                            className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold  ${validationErrors.name ? "border-red-500" : "border-[#E0E5F2]"
                                                } `} />
                                        {validationErrors.shop && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.shop}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-5">
                                    <button type="submit" className="bg-orange-500 text-white md:px-15 rounded-md p-3">
                                        {loading ? 'Connecting...' : 'Connect'}
                                    </button>
                                    <button type="button" className="bg-gray-500 text-white md:px-15 rounded-md p-3" onClick={() => router.back()}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className='capitalize'>You have not permission to perform this action </p>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl overflow-auto w-full p-5">
                        <h2 className='text-2xl font-bold pb-4'>Store List</h2>
                        {shopifyStores.length > 0 ? (
                            <div className="w-full overflow-x-auto">
                                <table className="w-max md:w-full border border-[#E0E5F2] text-sm">
                                    <thead className="border border-[#E0E5F2]">
                                        <tr>
                                            <th className="border border-[#E0E5F2] text-left px-2 py-1">SR</th>
                                            <th className="border border-[#E0E5F2] text-left px-2 py-1">Name</th>
                                            <th className="border border-[#E0E5F2] text-left px-2 py-1">Logo</th>
                                            <th className="border border-[#E0E5F2] px-2 py-1">Domain</th>
                                            <th className="border border-[#E0E5F2] text-left px-2 py-1">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shopifyStores.map((item, index) => (
                                            <tr key={item.id} className="border border-[#E0E5F2]">
                                                <td className="border border-[#E0E5F2] px-2 py-1 capitalize">{index + 1}</td>
                                                <td className="border border-[#E0E5F2] px-2 py-1 whitespace-nowrap capitalize">
                                                    {item.name || 'NIL'}
                                                </td>
                                                <td className="border border-[#E0E5F2] px-2 py-1 capitalize">
                                                    <Image
                                                        src={fetchImages(item.logo)}
                                                        alt={item.name}
                                                        height={40}
                                                        width={40}
                                                    />
                                                </td>
                                                <td className="border border-[#E0E5F2] px-2 py-1 text-center">
                                                    {item.domain || item.shop}
                                                </td>
                                                <td className="border border-[#E0E5F2] px-2 py-1 text-center">
                                                    {canEdit ? (
                                                        <button
                                                            onClick={() => {
                                                                setModalOpen(true);
                                                                setSelectedShop(item);
                                                            }}
                                                            className="bg-green-500 p-2 rounded-md text-white"
                                                        >
                                                            Edit Shop
                                                        </button>
                                                    ) : (
                                                        <p className="capitalize">You have no permission to edit store</p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center">No Data Available</p>
                        )}

                    </div>
                </div>

            </section>
            {modalOpen && (
                <div className="fixed inset-0 p-4 bg-[#0000007a] bg-opacity-40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Edit Shopify Store</h2>

                        {/* Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Shop Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={selectedShop.name}
                                    onChange={handleChangeShop}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Logo</label>
                                <input
                                    type="file"
                                    name="logo"
                                    onChange={handleChangeShop}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded bg-gray-300 text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleShopSubmit}
                                    className="px-4 py-2 rounded bg-green-600 text-white"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
