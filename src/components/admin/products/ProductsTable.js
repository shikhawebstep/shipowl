"use client";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import React, { useState, useContext, useCallback, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { useAdmin } from '../middleware/AdminMiddleWareContext';
import { ProductContextEdit } from './ProductContextEdit';
import { useAdminActions } from '@/components/commonfunctions/MainContext';
import Image from 'next/image';
import { ProductContext } from '../addproducts/ProductContext';
import { Trash2, RotateCcw, Pencil } from "lucide-react";
import { useImageURL } from "@/components/ImageURLContext";
import { IoFilterSharp } from "react-icons/io5";
const ProductTable = () => {
    const { fetchImages, getProductDescription } = useImageURL();
    const { setActiveTab } = useContext(ProductContextEdit);
    const { setActiveTabs } = useContext(ProductContext)
    const [showVariantPopup, setShowVariantPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [showRtoLiveCount, setShowRtoLiveCount] = useState(false);
    const [selectedModel, setSelectedModel] = useState('');
    const [category, setCategory] = useState('');
    const [categoryData, setCategoryData] = useState([]);
    const [products, setProducts] = useState([]);
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const [isTrashed, setIsTrashed] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [viewType, setViewType] = useState("table"); // "table" or "grid"

    const fetchDescription = (id) => {
        getProductDescription(id, setDescription);

    }

    const [productNameFilter, setProductNameFilter] = useState("");
    const [skuFilter, setSkuFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modelFilter, setModelFilter] = useState("");
    const [rtoStatusFilter, setRtoStatusFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState(null); // { key, label, value, setValue, columnIndex }

    const [filterInputValue, setFilterInputValue] = useState("");


    const [selected, setSelected] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 7);
    });
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/product", "products");

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    const handleBulkDelete = async () => {
        if (selected.length === 0) {
            Swal.fire("No Product selected", "Please select at least one image.", "info");
            return;
        }

        try {
            Swal.fire({
                title: "Deleting selected Product...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const raw = JSON.stringify({
                ids: selected.join(","),
            });

            const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
            if (dropshipperData?.project?.active_panel !== "admin") {
                localStorage.removeItem("shippingData");
                router.push("/admin/auth/login");
                return;
            }

            const token = dropshipperData?.security?.token;
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/product/bulk`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`, // insert token here
                    },
                    body: raw,
                }
            );

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Delete Failed",
                    text: errorMessage.message || "An error occurred",
                });
                return;
            }

            Swal.close();
            Swal.fire("Deleted!", "Selected Product deleted.", "success");

            fetchAll(setProducts, setLoading);
            setSelected([]);

        } catch (error) {
            Swal.close();
            Swal.fire("Error", error.message || "Something went wrong.", "error");
        }
    };

    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setProducts, setLoading);
        } else {
            await fetchAll(setProducts, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setProducts, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setProducts, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setProducts, setLoading));



    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setProducts, setLoading);
            setLoading(false);
        };
        fetchData();
    }, [verifyAdminAuth]);

    const getColumnIndex = (key) => {
        const baseColumns = [
            "",
            "name",         // 0
            "description",  // 1
            "sku",          // 2
        ];

        // If RTO count is shown, insert "liveRtoStock"
        if (showRtoLiveCount) {
            baseColumns.push("liveRtoStock"); // 3
            baseColumns.push("status");       // 4
            baseColumns.push("rtoStatus");    // 5
        } else {
            baseColumns.push("status");       // 3
            baseColumns.push("model");        // 4
        }

        baseColumns.push("viewVariant");
        baseColumns.push("action");

        return baseColumns.indexOf(key);
    };



    useEffect(() => {
        if (typeof window !== 'undefined' && products.length > 0 && !loading) {
            let table = null;

            Promise.all([
                import('jquery'),
                import('datatables.net'),
                import('datatables.net-dt'),
                import('datatables.net-buttons'),
                import('datatables.net-buttons-dt')
            ]).then(([jQuery]) => {
                window.jQuery = window.$ = jQuery.default;

                // Destroy existing DataTable if it exists
                if ($.fn.DataTable.isDataTable('#productTable')) {
                    $('#productTable').DataTable().destroy();
                    $('#productTable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#productTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    }
                });

                return () => {
                    if (table) {
                        table.destroy();
                        $('#productTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [products, viewType]);

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Product" &&
                perm.action === action &&
                perm.status === true
        );

    const canViewTrashed = hasPermission("Trash Listing");
    const canAdd = hasPermission("Create");
    const canDelete = hasPermission("Permanent Delete");
    const canEdit = hasPermission("Update");
    const canSoftDelete = hasPermission("Soft Delete");
    const canRestore = hasPermission("Restore");


    const handleClearFilters = () => {
        // Clear all filter states
        setProductNameFilter('');
        setSkuFilter('');
        setStatusFilter('');
        setModelFilter('');
        setRtoStatusFilter('');
        setFilterInputValue('');
        setActiveFilter(null);
        setSelected([])

        // Clear all filters in DataTable
        if ($.fn.DataTable.isDataTable('#productTable')) {
            const table = $('#productTable').DataTable();
            table.columns().search(''); // clear all column searches
            table.draw();
        }
    };

    return (
        <div className="">
            <div className="md:flex flex-wrap justify-between items-center gap-2 mb-4">
                <div className="grid lg:w-4/12 md:grid-cols-2 gap-4 items-end">


                    <div className="">
                        <label className="block text-sm font-medium text-gray-700">Select Model</label>
                        <select
                            className="w-full mt-1 px-3 py-3 border-[#DFEAF2] uppercase bg-white border rounded-lg text-sm"
                        >
                            <option value="">All</option>
                            {/* {[...new Set((products ?? []).map(item => item.list_as).filter(Boolean))].map((model) => (
                                <option key={model} value={model}>{model}</option>
                            ))} */}

                        </select>
                    </div>

                    <div className="">
                        <label className="block text-sm font-medium text-gray-700">Filter By Category</label>
                        <select
                            className="w-full mt-1 px-3 py-3 border-[#DFEAF2] bg-white border rounded-lg text-sm"
                        >
                            <option value="">All</option>
                            {/* {[...new Set((products ?? []).map(item => item.categoryId).filter(Boolean))].map((catId) => {
                                const cat = (categoryData ?? []).find(c => c.id === catId);
                                return (
                                    <option key={catId} value={catId}>
                                        {cat ? cat.name : catId}
                                    </option>
                                );
                            })} */}
                        </select>
                    </div>




                </div>
                <div className='flex gap-1 flex-wrap mt-3 md:mt-0 items-center'>
                    <button
                        onClick={handleClearFilters}
                        className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md transition-all duration-200"
                    >
                        Clear Filters
                    </button>
                    {/* <button className="bg-[#EE5D50] text-white px-4 py-2 rounded-lg text-sm">Details for approval</button>
                    <button className="bg-[#2B3674] text-white px-4 py-2 rounded-lg text-sm">Import Inventory</button>
                    <button className="bg-[#05CD99] text-white px-4 py-2 rounded-lg text-sm">Export</button>
                    <button className="bg-[#3965FF] text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">Import</button> */}
                    <button
                        onClick={() => {
                            const allIds = products.map(product => product.id);
                            setSelected(allIds);
                        }}
                        className="bg-[#3965FF] text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
                    >
                        Select All
                    </button>

                    {
                        canAdd && <button className="bg-[#F98F5C] text-white px-4 py-2 rounded-lg text-sm" onClick={() => {
                            setActiveTab('product-details');
                            setActiveTabs('product-details')
                        }}>
                            <Link href="/admin/products/create">Add New</Link>
                        </button>
                    }
                    {
                        canViewTrashed && <button
                            className={`text-sm p-2  gap-2 flex md:hidden items-center text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                            onClick={handleToggleTrash}
                        >
                            <Trash2 className="text-sm" /> {isTrashed ? "Product Listing (Simple)" : "Trashed Product"}
                        </button>
                    }
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl mt-5 p-4">
                    <div className="flex flex-wrap md:flex-nowrap  justify-between md:items-start lg:items-center mb-4">
                        <h2 className="md:text-2xl font-bold whitespace-nowrap text-[#2B3674]">Product Details</h2>
                        <label className=" flex md:hidden items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" checked={showRtoLiveCount} onChange={() => setShowRtoLiveCount(!showRtoLiveCount)} />
                            <div className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${showRtoLiveCount ? "bg-orange-500" : ""}`}>
                                <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${showRtoLiveCount ? "translate-x-5" : ""}`}></div>
                            </div>
                            <span className="ml-2 text-sm  text-gray-600">RTO Count</span>
                        </label>
                        <div className="flex gap-3 justify-between md:justify-end w-full  flex-wrap items-center md:mt-0 mt-4">
                            <label className="md:flex hidden items-center cursor-pointer">
                                <input type="checkbox" className="sr-only" checked={showRtoLiveCount} onChange={() => setShowRtoLiveCount(!showRtoLiveCount)} />
                                <div className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${showRtoLiveCount ? "bg-orange-500" : ""}`}>
                                    <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${showRtoLiveCount ? "translate-x-5" : ""}`}></div>
                                </div>
                                <span className="ml-2  text-sm text-gray-600">Show RTO Live Count</span>
                            </label>
                            {selected < 1 && <span className="font-semibold md:block hidden text-[#2B3674]">Total: {products.length} Products</span>}
                            {selected.length > 0 && (
                                <h5 className="font-semibold text-[#2B3674] bg-[#DFE9FF] p-3 flex rounded-md gap-7">
                                    {selected.length} Products Selected{" "}
                                    <span className="text-[#EE5D50] cursor-pointer " onClick={() => setSelected([])}>
                                        Clear
                                    </span>
                                </h5>
                            )}
                            {selected.length > 0 && (
                                <button className='bg-red-500 text-white p-2 rounded-md' onClick={handleBulkDelete}>Delete Selected</button>
                            )}

                            <button className="bg-[#F4F7FE] w-9/12 md:w-auto rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">
                                {/* Month Input */}
                                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="outline-0 w-full" />
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
                            <div className="justify-end gap-2  md:flex hidden">
                                {
                                    canViewTrashed && <button
                                        className={`text-sm p-2  gap-2 flex items-center text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                        onClick={handleToggleTrash}
                                    >
                                        <Trash2 className="text-sm" /> {isTrashed ? "Product Listing (Simple)" : "Trashed Product"}
                                    </button>
                                }


                            </div>
                        </div>
                    </div>

                    {activeFilter && (
                        <div
                            className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                            style={{
                                top: activeFilter.position.bottom + window.scrollY + 5 + 'px',
                                left: activeFilter.position.left + 'px',
                            }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    {activeFilter.label}
                                </label>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue('');
                                        setFilterInputValue('');
                                        setActiveFilter(null);
                                        if ($.fn.DataTable.isDataTable('#productTable')) {
                                            $('#productTable')
                                                .DataTable()
                                                .column(activeFilter.columnIndex)
                                                .search('')
                                                .draw();
                                        }
                                    }}
                                    className="text-red-500 text-xs hover:underline"
                                >
                                    Reset
                                </button>
                            </div>

                            <input
                                type="text"
                                value={filterInputValue}
                                onChange={(e) => setFilterInputValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                placeholder={`Enter ${activeFilter.label}`}
                            />

                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={() => setActiveFilter(null)}
                                    className="text-sm text-gray-500 hover:underline"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue(filterInputValue);
                                        if ($.fn.DataTable.isDataTable('#productTable')) {
                                            $('#productTable')
                                                .DataTable()
                                                .column(activeFilter.columnIndex)
                                                .search(filterInputValue)
                                                .draw();
                                        }
                                        setActiveFilter(null);
                                    }}
                                    className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            onClick={() => setViewType("table")}
                            className={`px-4 py-2 rounded ${viewType === "table" ? "bg-[#F98F5C] text-white" : "bg-gray-200 text-gray-700"}`}
                        >
                            Table View
                        </button>
                        <button
                            onClick={() => setViewType("grid")}
                            className={`px-4 py-2 rounded ${viewType === "grid" ? "bg-[#F98F5C] text-white" : "bg-gray-200 text-gray-700"}`}
                        >
                            Grid View
                        </button>
                    </div>
                    {
                        viewType === "grid" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 h-full">
                                {products.map((item) => {
                                    // Ensure gallery is a valid string and split to array
                                    const imageUrl = typeof item?.gallery === 'string' && item.gallery.trim() !== ''
                                        ? item.gallery.split(',')
                                        : [];

                                    // Try to parse imageSortingIndex safely
                                    let imageSortingIndex = {};
                                    try {
                                        imageSortingIndex = item?.imageSortingIndex
                                            ? JSON.parse(item.imageSortingIndex)
                                            : {};
                                    } catch (err) {
                                        console.error('Failed to parse imageSortingIndex:', err);
                                    }

                                    // Ensure gallery inside imageSortingIndex is an array
                                    const productImageSortingIndex = Array.isArray(imageSortingIndex?.gallery)
                                        ? [...imageSortingIndex.gallery].sort((a, b) => parseInt(a.value) - parseInt(b.value))
                                        : [];

                                    // Get the first index safely, default to 0
                                    const firstImageIndex = productImageSortingIndex.length > 0
                                        ? productImageSortingIndex[0]?.index || 0
                                        : 0;

                                    return (
                                        <div key={item.id} className="border border-gray-200 h-full rounded-lg shadow-sm p-4 bg-white relative">
                                            <Image
                                                src={imageUrl[firstImageIndex]}
                                                alt={item.name}
                                                height={100}
                                                width={100}
                                                className="w-full h-[150px] object-cover backface-hidden"
                                            />
                                            <div className=" mt-2 flex justify-between items-center mb-2">
                                                <div className="font-semibold text-[#2B3674] truncate">{item.name || 'NIL'}</div>
                                                <span className="text-xs px-2 py-1 rounded-sm border font-medium
${item.status ? 'bg-green-100 text-green-800 border-green-400' : 'bg-red-100 text-red-800 border-red-400'}">
                                                    {item.status ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">SKU: {item.main_sku || 'NIL'}</p>
                                            {showRtoLiveCount && <p className="text-sm text-blue-500 mb-2">Live RTO Stock: {item.liveRtoStock || 'NIL'}</p>}
                                            {!showRtoLiveCount && <p className="text-sm text-gray-700 mb-2">Model: {item.list_as || 'NIL'}</p>}
                                            {showRtoLiveCount && (
                                                <p className={`text-sm font-semibold mb-2 text-white px-2 py-1 inline-block rounded 
${item.rtoStatus === "Free" ? "bg-green-500" : item.rtoStatus === "Pending" ? "bg-[#FFB547]" : "bg-red-500"}`}>
                                                    {item.rtoStatus || 'NIL'}
                                                </p>
                                            )}
                                            <div className="mt-3">

                                                <div className="flex mb-2 gap-2">
                                                    {isTrashed ? (
                                                        <>
                                                            {canRestore && (
                                                                <div className="bg-white p-2 rounded shadow-sm">
                                                                    <RotateCcw
                                                                        onClick={() => handleRestore(item.id)}
                                                                        className="cursor-pointer text-2xl text-green-500"
                                                                    />
                                                                </div>
                                                            )}

                                                            {canDelete && (
                                                                <div className="bg-white p-2 rounded shadow-sm">
                                                                    <Trash2
                                                                        onClick={() => handleDestroy(item.id)}
                                                                        className="cursor-pointer text-2xl text-red-500"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {canEdit && (
                                                                <div className="bg-white p-2 rounded shadow-sm">
                                                                    <Pencil
                                                                        onClick={() => {
                                                                            setActiveTab('product-details');
                                                                            router.push(`/admin/products/update?id=${item.id}`);
                                                                        }}
                                                                        className="cursor-pointer text-2xl"
                                                                    />
                                                                </div>
                                                            )}

                                                            {canSoftDelete && (
                                                                <div className="relative group inline-block bg-white p-2 rounded shadow-sm">
                                                                    <Trash2
                                                                        onClick={() => handleSoftDelete(item.id)}
                                                                        className="cursor-pointer text-2xl"
                                                                    />
                                                                    <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                        Soft Delete
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {canDelete && (
                                                                <div className="relative group inline-block bg-white p-2 rounded shadow-sm">
                                                                    <Trash2
                                                                        onClick={() => handleDestroy(item.id)}
                                                                        className="cursor-pointer text-2xl text-red-500"
                                                                    />
                                                                    <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                        Permanent Delete
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(item);
                                                            setShowVariantPopup(true);
                                                        }}
                                                        className="text-white bg-[#3965FF]  p-2 rounded text-sm"
                                                    >
                                                        View Variants
                                                    </button>
                                                    <button
                                                        onClick={() => fetchDescription(item.id)}
                                                        className="bg-[#2B3674] text-white p-2 rounded-lg text-sm"
                                                    >
                                                        View Description
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    )
                                }
                                )}
                            </div>
                        )
                    }
                    {viewType === "table" && (
                        <div>
                            {
                                products.length > 0 ? (
                                    <div className="overflow-x-auto relative main-outer-wrapper w-full">
                                        <table className="md:w-full w-auto display main-tables" id="productTable">
                                            <thead>
                                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        Gallery
                                                    </th>
                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        <button
                                                            onClick={(e) => {
                                                                setFilterInputValue(productNameFilter);
                                                                setActiveFilter({
                                                                    key: 'name',
                                                                    label: 'Product Name',
                                                                    value: productNameFilter,
                                                                    setValue: setProductNameFilter,
                                                                    columnIndex: getColumnIndex('name'),
                                                                    position: e.currentTarget.getBoundingClientRect()
                                                                });
                                                            }}
                                                            className="flex gap-2 items-center uppercase"
                                                        >
                                                            Name <IoFilterSharp className="w-4 h-4" />
                                                        </button>
                                                    </th>

                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        Description
                                                    </th>

                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        <button
                                                            onClick={(e) => {
                                                                setFilterInputValue(skuFilter);
                                                                setActiveFilter({
                                                                    key: 'sku',
                                                                    label: 'SKU',
                                                                    value: skuFilter,
                                                                    setValue: setSkuFilter,
                                                                    columnIndex: getColumnIndex('sku'),
                                                                    position: e.currentTarget.getBoundingClientRect()
                                                                });
                                                            }}
                                                            className="flex gap-2 items-center uppercase"
                                                        >
                                                            SKU <IoFilterSharp className="w-4 h-4" />
                                                        </button>
                                                    </th>

                                                    {showRtoLiveCount && (
                                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase text-blue-500">
                                                            Live RTO Stock
                                                        </th>
                                                    )}

                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        <button
                                                            onClick={(e) => {
                                                                setFilterInputValue(statusFilter);
                                                                setActiveFilter({
                                                                    key: 'status',
                                                                    label: 'Status',
                                                                    value: statusFilter,
                                                                    setValue: setStatusFilter,
                                                                    columnIndex: getColumnIndex('status'),
                                                                    position: e.currentTarget.getBoundingClientRect()
                                                                });
                                                            }}
                                                            className="flex gap-2 items-center uppercase"
                                                        >
                                                            Status <IoFilterSharp className="w-4 h-4" />
                                                        </button>
                                                    </th>

                                                    {!showRtoLiveCount && (
                                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                            <button
                                                                onClick={(e) => {
                                                                    setFilterInputValue(modelFilter);
                                                                    setActiveFilter({
                                                                        key: 'model',
                                                                        label: 'Model',
                                                                        value: modelFilter,
                                                                        setValue: setModelFilter,
                                                                        columnIndex: getColumnIndex('model'),
                                                                        position: e.currentTarget.getBoundingClientRect()
                                                                    });
                                                                }}
                                                                className="flex gap-2 items-center uppercase"
                                                            >
                                                                Model <IoFilterSharp className="w-4 h-4" />
                                                            </button>
                                                        </th>
                                                    )}

                                                    {showRtoLiveCount && (
                                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                            <button
                                                                onClick={(e) => {
                                                                    setFilterInputValue(rtoStatusFilter);
                                                                    setActiveFilter({
                                                                        key: 'rtoStatus',
                                                                        label: 'RTO Status',
                                                                        value: rtoStatusFilter,
                                                                        setValue: setRtoStatusFilter,
                                                                        columnIndex: getColumnIndex('rtoStatus'),
                                                                        position: e.currentTarget.getBoundingClientRect()
                                                                    });
                                                                }}
                                                                className="flex gap-2 items-center uppercase"
                                                            >
                                                                RTO Status <IoFilterSharp className="w-4 h-4" />
                                                            </button>
                                                        </th>
                                                    )}

                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        View Variant
                                                    </th>

                                                    <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {products.map((item) => {
                                                    const imageUrl = typeof item?.gallery === 'string' && item.gallery.trim() !== ''
                                                        ? item.gallery.split(',')
                                                        : [];

                                                    // Try to parse imageSortingIndex safely
                                                    let imageSortingIndex = {};
                                                    try {
                                                        imageSortingIndex = item?.imageSortingIndex
                                                            ? JSON.parse(item.imageSortingIndex)
                                                            : {};
                                                    } catch (err) {
                                                        console.error('Failed to parse imageSortingIndex:', err);
                                                    }

                                                    // Ensure gallery inside imageSortingIndex is an array
                                                    const productImageSortingIndex = Array.isArray(imageSortingIndex?.gallery)
                                                        ? [...imageSortingIndex.gallery].sort((a, b) => parseInt(a.value) - parseInt(b.value))
                                                        : [];

                                                    // Get the first index safely, default to 0
                                                    const firstImageIndex = productImageSortingIndex.length > 0
                                                        ? productImageSortingIndex[0]?.index || 0
                                                        : 0;

                                                    return (
                                                        <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">
                                                            <td className="p-2 px-5  text-left whitespace-nowrap">
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
                                                                    <Image
                                                                        src={imageUrl[firstImageIndex]}
                                                                        alt={item.name}
                                                                        height={100}
                                                                        width={50}
                                                                        className="w-[60px] h-[50px] rounded-md object-cover backface-hidden"
                                                                    />

                                                                </div>
                                                            </td>
                                                            <td className="p-2 px-5  text-left whitespace-nowrap">
                                                                <span className="truncate"> {item.name || 'NIL'}</span>
                                                            </td>
                                                            <td className="p-2 px-5 text-left whitespace-nowrap">
                                                                <button
                                                                    onClick={() => fetchDescription(item.id)}
                                                                    className="text-blue-600"
                                                                >
                                                                    View Description
                                                                </button>

                                                            </td>

                                                            <td className="p-2 px-5  text-left whitespace-nowrap">{item.main_sku || 'NIL'}</td>
                                                            {showRtoLiveCount && <td className="p-2 px-5  text-left whitespace-nowrap text-blue-500">{item.liveRtoStock || 'NIL'}</td>}

                                                            <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                                {item.status ? (
                                                                    <span className="bg-green-100 text-green-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">Active</span>
                                                                ) : (
                                                                    <span className="bg-red-100 text-red-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">Inactive</span>
                                                                )}
                                                            </td>

                                                            {!showRtoLiveCount && (
                                                                <td className="p-2 px-5  text-left  whitespace-nowrap">
                                                                    <button
                                                                        className={`py-2 text-white rounded-md text-sm p-3  min-w-[95px] 
    ${item.list_as?.toLowerCase() === "shipowl" ? "bg-[#01B574]" : "bg-[#5CA4F9]"}`}
                                                                    >
                                                                        {item.list_as || 'NIL'}
                                                                    </button>
                                                                </td>
                                                            )}
                                                            {showRtoLiveCount && (
                                                                <td className="p-2 px-5  text-left whitespace-nowrap">
                                                                    {" "}
                                                                    <button
                                                                        className={` py-2 text-white rounded-md text-sm p-3  min-w-[95px]
            ${item.rtoStatus === "Free" ? "bg-green-500" : item.rtoStatus === "Pending" ? "bg-[#FFB547]" : "bg-red-500"}`}
                                                                    >
                                                                        {item.rtoStatus || 'NIL'}
                                                                    </button>
                                                                </td>
                                                            )}
                                                            <td className="p-2 px-5 text-left whitespace-nowrap">
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
                                                            <td className="p-2 bg-transparent px-5 text-[#8F9BBA] border-0">

                                                                <div className="flex justify-center gap-2"> {isTrashed ? (
                                                                    <>
                                                                        {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-2xl text-green-500" />}
                                                                        {canDelete && <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-2xl text-red-500" />}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {canEdit && <Pencil onClick={() => {
                                                                            setActiveTab('product-details')
                                                                            router.push(`/admin/products/update?id=${item.id}`)
                                                                        }} className="cursor-pointer text-2xl" />}
                                                                        {canSoftDelete && (
                                                                            <div className="relative group inline-block">
                                                                                <Trash2 onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-2xl " />
                                                                                <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                                    Soft Delete
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {canDelete && (
                                                                            <div className="relative group inline-block">

                                                                                <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-2xl text-red-500" />
                                                                                <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                                    Permanent Delete
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}</div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>


                                    </div>

                                ) : (
                                    <div className='text-center'>No Products available</div>

                                )}

                        </div>
                    )}



                </div>
            )}

            {showVariantPopup && selectedProduct && (
                <div className="fixed inset-0  p-4 bg-[#00000054] bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white overflow-auto  h-[500px] p-6 rounded-lg w-full max-w-5xl shadow-xl relative">
                        <h2 className="text-xl font-semibold mb-4">Variant Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedProduct?.variants?.map((variant, idx) => {


                                const varinatExists = selectedProduct?.isVarientExists ? 'yes' : 'no';
                                const isExists = varinatExists === 'yes';

                                return (
                                    <div
                                        key={variant.id || idx}
                                        className="bg-white p-4 rounded-md  border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                                    >
                                        <div className='flex gap-2 relative'>


                                            <div className="w-full text-center bg-orange-500 p-2 text-white ">Suggested Price :{variant.suggested_price}</div>


                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="text-sm text-gray-700 w-full  border-gray-200">
                                                <tbody>
                                                    <tr className='border border-gray-200'>
                                                        <th className="text-left border-gray-200 border p-2 font-semibold ">Model:</th>
                                                        <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.model || "NIL"}</td>
                                                        <th className="text-left border-gray-200 border p-2 font-semibold ">Name:</th>
                                                        <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.name || "NIL"}</td>


                                                    </tr>

                                                    {isExists && (
                                                        <>
                                                            <tr className='border border-gray-200'>


                                                                <th className="text-left border-gray-200 border p-2 font-semibold ">SKU:</th>
                                                                <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.sku || "NIL"}</td>

                                                                <th className="text-left border-gray-200 border p-2 font-semibold ">Color:</th>
                                                                <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.color || "NIL"}</td>
                                                            </tr>
                                                        </>
                                                    )}

                                                </tbody>
                                            </table>
                                        </div>


                                    </div>
                                );

                            })}
                        </div>


                        <button
                            onClick={() => setShowVariantPopup(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            {description && (
                <div className="fixed p-4 inset-0 z-50 m-auto  flex items-center justify-center bg-black/50">
                    <div className="bg-white w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 relative shadow-lg popup-boxes">
                        {/* Close Button */}
                        <button
                            onClick={() => setDescription(null)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl"
                        >
                            &times;
                        </button>

                        {/* HTML Description Content */}
                        {description ? (
                            <div
                                className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        ) : (
                            <p className="text-gray-500">NIL</p>
                        )}
                    </div>
                </div>
            )}
        </div>

    );
};

export default ProductTable;
