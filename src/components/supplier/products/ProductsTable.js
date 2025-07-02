"use client";
import 'datatables.net-dt/css/dataTables.dataTables.css';

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import React, { useState, useCallback, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { FaCheck } from "react-icons/fa";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
import Image from 'next/image';
const ProductTable = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("my");
    const [showRtoLiveCount, setShowRtoLiveCount] = useState(false);
    const [selectedModel, setSelectedModel] = useState('');
    const [category, setCategory] = useState('');
    const [categoryData, setCategoryData] = useState([]);
    const [products, setProducts] = useState([]);
    const { verifySupplierAuth } = useSupplier();
    const [isTrashed, setIsTrashed] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [showVariantPopup, setShowVariantPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const filteredProducts = products.filter((item) => {
        const matchesCategory = category
            ? String(item.categoryId) === String(category)
            : true;

        const matchesModel = selectedModel
            ? String(item.list_as) === String(selectedModel)
            : true;


        return matchesCategory && matchesModel;
    });
    const tabs = [
        { key: "my", label: "My Products" },
        { key: "all", label: "All Products" },
        { key: "notmy", label: "Not My Products" },
    ];
    const [showPopup, setShowPopup] = useState(false);
    const [inventoryData, setInventoryData] = useState({
        productId: "",
        variant: [],
        id: ''
    });
    const handleVariantChange = (id, field, value) => {
        setInventoryData((prevData) => ({
            ...prevData,
            variant: prevData.variant.map((v) =>
                v.id === id ? { ...v, [field]: field === 'qty' || field === 'shipowl_price' ? Number(value) : value } : v
            ),
        }));
    };


    const fetchProduct = useCallback(async (type) => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product/my-inventory?type=${type}`, {
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
                setProducts(result?.products || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setProducts]);


    const trashProducts = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product/my-inventory/trashed`, {
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
                setProducts(result?.products || []);
            }
        } catch (error) {
            console.error("Error fetching trashed categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setProducts]);
    const fetchCategory = useCallback(async () => {
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
                `/api/supplier/category`,
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
                    text: errorMessage.message || errorMessage.error || errorMessage || "Your session has expired. Please log in again.",
                });
                return
            }

            const result = await response.json();
            const category = result?.categories || {};
            setCategoryData(category)


        } catch (error) {
            console.error("Error fetching category:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);


    const handleDelete = async (item) => {
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
                `/api/supplier/product/my-inventory/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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

            await fetchProduct('my');
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
    const handlePermanentDelete = async (item) => {
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
                `/api/supplier/product/my-inventory/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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

    const handleRestore = useCallback(async (item) => {
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
                `/api/supplier/product/my-inventory/${item?.id}/restore`,
                {
                    method: "PATCH",
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

    const [selected, setSelected] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 7);
    });
    const handleCheckboxChange = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifySupplierAuth();
            await fetchProduct(activeTab);
            await fetchCategory();
            setLoading(false);
        };
        fetchData();
    }, [fetchProduct, verifySupplierAuth]);

    useEffect(() => {
        if (typeof window !== "undefined" && products.length > 0 && !loading) {
            let table = null;

            Promise.all([import("jquery"), import("datatables.net"), import("datatables.net-dt"), import("datatables.net-buttons"), import("datatables.net-buttons-dt")])
                .then(([jQuery]) => {
                    window.jQuery = window.$ = jQuery.default;

                    // Destroy existing DataTable if it exists
                    if ($.fn.DataTable.isDataTable("#productTable")) {
                        $("#productTable").DataTable().destroy();
                        $("#productTable").empty();
                    }

                    // Reinitialize DataTable with new product
                    table = $("#productTable").DataTable();

                    return () => {
                        if (table) {
                            table.destroy();
                            $("#productTable").empty();
                        }
                    };
                })
                .catch((error) => {
                    console.error("Failed to load DataTables dependencies:", error);
                });
        }
    }, [products, loading]);
    const handleEdit = async (item, id) => {
        setIsEdit(true);
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
                `/api/supplier/product/my-inventory/${item.id}`,
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
                    text: errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const items = result?.supplierProduct || {};

            setInventoryData({
                productId: items.productId || "",
                id: id, // or items.product?.id if you prefer
                variant: (items.variants || []).map((v) => ({
                    variantId: v.id || v.variantId,
                    stock: v.stock,
                    price: v.price,
                    status: v.status,
                    color: v.variant?.color || '',
                    sku: v.variant?.sku || '',
                    image: v.variant?.image || '',


                }))
            });

            setShowPopup(true);

        } catch (error) {
            console.error("Error fetching category:", error);
        } finally {
            setLoading(false);
        }

    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "supplier") {
            localStorage.clear("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/supplier/auth/login");
            return;
        }

        try {
            Swal.fire({
                title: 'Creating Product...',
                text: 'Please wait while we save your Product.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            const simplifiedVariants = inventoryData.variant.map((v) => ({
                variantId: v.id || v.variantId,
                stock: v.stock,
                price: v.price,
                status: v.status
            }));

            form.append('productId', inventoryData.productId);
            form.append('variants', JSON.stringify(simplifiedVariants));



            const url = isEdit ? `/api/supplier/product/my-inventory/${inventoryData.id}` : "/api/supplier/product/my-inventory";

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });

            const result = await response.json();

            Swal.close();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: isEdit ? "Updation Failed" : "Creation Failed",
                    text: result.message || result.error || "An error occurred",
                });
                return;
            }

            // On success
            Swal.fire({
                icon: "success",
                title: isEdit ? "Product Updated" : "Product Created",
                text: isEdit
                    ? result.message || "The Product has been updated successfully!"
                    : result.message || "The Product has been created successfully!",
                showConfirmButton: true,
            }).then((res) => {
                if (res.isConfirmed) {
                    setInventoryData({
                        productId: "",
                        variant: [],
                        id: '',
                    });
                    setShowPopup(false);
                    fetchProduct('my');
                    setActiveTab('my');
                    setIsEdit(false);
                }
            });


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

    return (
        <div className="">
            <div className="flex flex-wrap md:justify-end justify-items-center gap-2 mb-4">
                <button className="bg-[#EE5D50] text-white px-4 py-2 rounded-lg text-sm">Details for approval</button>
                <button className="bg-[#2B3674] text-white px-4 py-2 rounded-lg text-sm">Import Inventory</button>
                <button className="bg-[#05CD99] text-white px-4 py-2 rounded-lg text-sm">Export</button>
                <button className="bg-[#3965FF] text-white px-4 py-2 rounded-lg text-sm">Import</button>
                <button className="bg-[#4285F4] text-white px-4 py-2 rounded-lg text-sm">Filters</button>
            </div>

            <div className="flex flex-wrap gap-4 items-end">

                <div className="md:w-4/12">
                    <label className="block text-sm font-medium text-gray-700">Select Model</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full mt-1 px-3 py-3 border-[#DFEAF2] uppercase bg-white border rounded-lg text-sm"
                    >
                        <option value="">All</option>
                        {[...new Set((products ?? []).map(item => item.list_as).filter(Boolean))].map((model, index) => (
                            <option key={index} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:w-4/12">
                    <label className="block text-sm font-medium text-gray-700">Filter By Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-3 border-[#DFEAF2] bg-white border rounded-lg text-sm"
                    >
                        <option value="">All</option>
                        {[...new Set((products ?? []).map(item => item.categoryId).filter(Boolean))].map((catId) => {
                            const cat = (categoryData ?? []).find(c => c.id === catId);
                            return (
                                <option key={catId} value={catId}>
                                    {cat ? cat.name : catId}
                                </option>
                            );
                        })}
                    </select>
                </div>


                <div className="flex justify-end md:w-1/12 items-end">
                    <button className="bg-[#F98F5C] text-white px-6 py-3 rounded-lg text-sm">Save</button>
                </div>
            </div>


            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl mt-5 p-4">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-[#2B3674]">Product Details</h2>
                        <div className="flex gap-3  flex-wrap items-center">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only" checked={showRtoLiveCount} onChange={() => setShowRtoLiveCount(!showRtoLiveCount)} />
                                <div className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${showRtoLiveCount ? "bg-orange-500" : ""}`}>
                                    <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${showRtoLiveCount ? "translate-x-5" : ""}`}></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-600">Show RTO Live Count</span>
                            </label>
                            {selected < 1 && <span className="font-semibold text-[#2B3674]">Total: {filteredProducts.length} Products</span>}
                            {selected.length > 0 && (
                                <h5 className="font-semibold text-[#2B3674] bg-[#DFE9FF] p-3 flex rounded-md gap-7">
                                    {selected.length} Products Selected{" "}
                                    <span className="text-[#EE5D50] cursor-pointer " onClick={() => setSelected([])}>
                                        Clear
                                    </span>
                                </h5>
                            )}

                            <button className="bg-[#F4F7FE] rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">
                                {/* Month Input */}
                                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="outline-0" />
                            </button>
                            <button onClick={() => setIsPopupOpen((prev) => !prev)} className="bg-[#F4F7FE] p-2 rounded-lg relative">
                                <MoreHorizontal className="text-[#F98F5C]" />
                                {isPopupOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                        <ul className="py-2 text-sm text-[#2B3674]">
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                        </ul>
                                    </div>
                                )}
                            </button>
                            {activeTab === "my" && (
                                <div className="flex justify-end gap-2">
                                    <button
                                        className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                        onClick={async () => {
                                            if (isTrashed) {
                                                setIsTrashed(false);
                                                await fetchProduct('my');
                                            } else {
                                                setIsTrashed(true);
                                                await trashProducts('my');
                                            }
                                        }}
                                    >
                                        {isTrashed ? "Product Listing (Simple)" : "Trashed Product"}
                                    </button>

                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-4 border-b border-gray-200 mb-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key),
                                        fetchProduct(tab.key)
                                    setIsTrashed(false)

                                }}
                                className={`px-4 py-2 font-medium border-b-2 transition-all duration-200
            ${activeTab === tab.key
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-500 hover:text-orange-600"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {products.length > 0 ? (
                        <div className="overflow-x-auto relative main-outer-wrapper w-full">
                            <table className="md:w-full w-auto display main-tables" id="productTable">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            Name
                                        </th>
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            Description
                                        </th>
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            SKU
                                        </th>

                                        {activeTab === "notmy" && (
                                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                Add to List
                                            </th>
                                        )}
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            View Variant
                                        </th>
                                        {showRtoLiveCount && (
                                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase text-blue-500">
                                                Live RTO Stock
                                            </th>
                                        )}

                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            Status
                                        </th>

                                        {!showRtoLiveCount && (
                                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                Model
                                            </th>
                                        )}
                                        {showRtoLiveCount && (
                                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                RTO Status
                                            </th>
                                        )}


                                        {activeTab === "my" && (
                                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                Action
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((item) => (
                                        <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                            <td className="p-2 px-5  text-left  capitalize whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <label className="flex items-center cursor-pointer me-2">
                                                        <input type="checkbox" checked={selected.includes(item.id)} onChange={() => handleCheckboxChange(item.id)} className="peer hidden" />
                                                        <div
                                                            className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white"
                                                        >
                                                            <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                                        </div>
                                                    </label>

                                                    <span className="truncate"> {item?.product?.name || item.name || 'NIL'}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 px-5  text-left  capitalize whitespace-nowrap">{item?.product?.description || item.description || 'NIL'}</td>
                                            <td className="p-2 px-5  text-left  capitalize whitespace-nowrap">{item?.product?.main_sku || item.main_sku || 'NIL'}</td>


                                            {activeTab === "notmy" && (
                                                <td className="p-2 px-5 text-left  capitalize whitespace-nowrap">
                                                    <button
                                                        onClick={() => {
                                                            setShowPopup(true),
                                                                setInventoryData({
                                                                    productId: item.id,
                                                                    variant: item.variants,
                                                                    id: item.id,
                                                                })
                                                        }}
                                                        className="py-2 px-4 text-white rounded-md text-sm bg-[#2B3674]"
                                                    >
                                                        Add To Inventory
                                                    </button>

                                                </td>
                                            )}

                                            <td className="p-2 px-5 text-left capitalize whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(item); // `item` is your current product row
                                                        setShowVariantPopup(true);
                                                    }}
                                                    className="py-2 px-4 text-white rounded-md text-sm bg-[#3965FF]"
                                                >
                                                    View Variants
                                                </button>
                                            </td>



                                            {showRtoLiveCount && <td className="p-2 px-5  text-left  capitalize whitespace-nowrap text-blue-500">{item.liveRtoStock || 'NIL'}</td>}

                                            <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                {item.status ? (
                                                    <span className="bg-green-100 text-green-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">Active</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">Inactive</span>
                                                )}
                                            </td>

                                            {!showRtoLiveCount && (
                                                <td className="p-2 px-5  text-center uppercase whitespace-nowrap">
                                                    <button
                                                        className={`py-2 text-white rounded-md text-sm p-3 uppercase min-w-[95px] 
    ${item.list_as?.toLowerCase() === "shipowl" ? "bg-[#01B574]" : "bg-[#5CA4F9]"}`}
                                                    >
                                                        {item?.product?.list_as || item?.list_as || 'NIL'}
                                                    </button>
                                                </td>
                                            )}
                                            {showRtoLiveCount && (
                                                <td className="p-2 px-5  text-left  capitalize whitespace-nowrap">
                                                    {" "}
                                                    <button
                                                        className={` py-2 text-white rounded-md text-sm p-3  min-w-[95px]
                                                        ${item.rtoStatus === "Free" ? "bg-green-500" : item.rtoStatus === "Pending" ? "bg-[#FFB547]" : "bg-red-500"}`}
                                                    >
                                                        {item.rtoStatus || 'NIL'}
                                                    </button>
                                                </td>
                                            )}
                                            {activeTab === "my" && (
                                                <td className="p-2 px-5  text-left  capitalize whitespace-nowrap  text-[#8F9BBA]">
                                                    <div className="flex justify-center gap-2">
                                                        {isTrashed ? (
                                                            <>
                                                                <MdRestoreFromTrash onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />
                                                                <AiOutlineDelete onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MdModeEdit onClick={() => handleEdit(item, item.id)} className="cursor-pointer text-3xl" />
                                                                <AiOutlineDelete onClick={() => handleDelete(item)} className="cursor-pointer text-3xl" />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            )}


                                        </tr>

                                    ))}
                                </tbody>
                            </table>
                            {showPopup && (
                                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                                        <h2 className="text-xl font-semibold mb-4">Add to Inventory</h2>
                                        <table className="min-w-full table-auto border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border px-4 py-2">Image</th>
                                                    <th className="border px-4 py-2">Color</th>
                                                    <th className="border px-4 py-2">Stock</th>
                                                    <th className="border px-4 py-2">Price</th>
                                                    <th className="border px-4 py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryData.variant?.map((variant, index) => (
                                                    <tr key={index}>
                                                        <td className="border px-4 py-2">
                                                            <Image
                                                                height={40}
                                                                width={40}
                                                                src={"https://placehold.co/400" || variant.image}
                                                                alt={variant.color || "NIL"}
                                                            />
                                                        </td>
                                                        <td className="border px-4 py-2">{variant.color || "NIL"}</td>
                                                        <td className="border px-4 py-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Stock"
                                                                name="stock"
                                                                className="w-full border rounded p-2"
                                                                value={variant.stock || ''}
                                                                onChange={(e) =>
                                                                    handleVariantChange(variant.variantId, "stock", e.target.value)
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border px-4 py-2">
                                                            <input
                                                                type="number"
                                                                name="price"
                                                                placeholder="Price"
                                                                className="w-full border rounded p-2"
                                                                value={variant.price || ''}
                                                                onChange={(e) =>
                                                                    handleVariantChange(variant.variantId, "price", e.target.value)
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border px-4 py-2">
                                                            <label className="flex mt-2 items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    name="status"
                                                                    className="sr-only"
                                                                    checked={variant.status || false}
                                                                    onChange={(e) =>
                                                                        handleVariantChange(variant.variantId, "status", e.target.checked)
                                                                    }
                                                                />
                                                                <div
                                                                    className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${variant.status ? "bg-orange-500" : ""
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${variant.status ? "translate-x-5" : ""
                                                                            }`}
                                                                    ></div>
                                                                </div>
                                                                <span className="ms-2 text-sm text-gray-600">Status</span>
                                                            </label>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>




                                        <div className="flex justify-end space-x-3 mt-6">
                                            <button
                                                onClick={() => {
                                                    setShowPopup(false);
                                                    setIsEdit(false);
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={(e) => handleSubmit(e)}
                                                className="px-4 py-2 bg-green-600 text-white rounded"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showVariantPopup && selectedProduct && (
                                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                    <div className="bg-white p-6 rounded-lg w-full max-w-5xl shadow-xl relative">
                                        <h2 className="text-xl font-semibold mb-4">Variant Details</h2>

                                        <table className="min-w-full table-auto border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border px-4 py-2">Image</th>
                                                    <th className="border px-4 py-2">SKU</th>
                                                    <th className="border px-4 py-2">Color</th>
                                                    <th className="border px-4 py-2">Qty</th>
                                                    <th className="border px-4 py-2">ShipOwl Price</th>
                                                    <th className="border px-4 py-2">RTO Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedProduct.variants?.map((v, index) => {
                                                    const imageUrls = v.image
                                                        ? v.image.split(',').map((img) => img.trim()).filter(Boolean)
                                                        : [];
                                                    const variant = v.variant || v;
                                                    return (
                                                        <tr key={index}>
                                                            <td className="border px-4 py-2">
                                                                <div className="flex space-x-2 overflow-x-auto max-w-[200px]">
                                                                    {imageUrls.length > 0 ? (
                                                                        imageUrls.map((url, idx) => (
                                                                            <Image
                                                                                key={idx}
                                                                                height={40}
                                                                                width={40}
                                                                                src={url}
                                                                                alt={variant.name || 'NIL'}
                                                                                className="shrink-0 rounded"
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <Image
                                                                            height={40}
                                                                            width={40}
                                                                            src="https://placehold.co/400"
                                                                            alt="Placeholder"
                                                                            className="shrink-0 rounded"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="border px-4 py-2">{variant.sku || 'NIL'}</td>
                                                            <td className="border px-4 py-2">{variant.color || 'NIL'}</td>
                                                            <td className="border px-4 py-2">{variant.qty ?? 'NIL'}</td>
                                                            <td className="border px-4 py-2">{variant.shipowl_price ?? 'NIL'}</td>
                                                            <td className="border px-4 py-2">{variant.rto_price ?? 'NIL'}</td>
                                                        </tr>
                                                    );
                                                })}

                                            </tbody>
                                        </table>

                                        <button
                                            onClick={() => setShowVariantPopup(false)}
                                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className='text-center'>No Products available</div>
                    )}


                </div>
            )}
        </div>
    );
};

export default ProductTable;
