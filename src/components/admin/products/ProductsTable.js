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

const ProductTable = () => {
    const { fetchImages } = useImageURL();
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
    const [openDescriptionId, setOpenDescriptionId] = useState(null);

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





    const fetchCategory = useCallback(async () => {
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
                `/api/admin/category`,
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
                    text: errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message);
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

    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setProducts, setLoading);
            await fetchCategory();
            setLoading(false);
        };
        fetchData();
    }, [verifyAdminAuth]);

    const tableRef = useRef(null);

    useEffect(() => {
        let $ = null; // declare in parent scope
        let table;

        if (typeof window !== "undefined" && products.length > 0) {
            Promise.all([
                import("jquery"),
                import("datatables.net"),
                import("datatables.net-dt"),
                import("datatables.net-buttons"),
                import("datatables.net-buttons-dt")
            ])
                .then(([jQuery]) => {
                    $ = jQuery.default;
                    window.$ = $;

                    if ($.fn.DataTable.isDataTable(tableRef.current)) {
                        $(tableRef.current).DataTable().clear().destroy(); // Safe destroy
                    }

                    table = $(tableRef.current).DataTable({
                        pagingType: window.innerWidth <= 768 ? "simple" : "simple_numbers",
                        language: {
                            paginate: {
                                previous: "<",
                                next: ">"
                            }
                        }
                    });
                })
                .catch((error) => {
                    console.error("DataTable init failed:", error);
                });
        }

        return () => {
            if ($ && $.fn.DataTable.isDataTable(tableRef.current)) {
                $(tableRef.current).DataTable().clear().destroy(); // Clean up
            }
        };
    }, [products]);


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
                <div className='flex gap-1 flex-wrap mt-3 md:mt-0 items-center'>   <button className="bg-[#EE5D50] text-white px-4 py-2 rounded-lg text-sm">Details for approval</button>
                    <button className="bg-[#2B3674] text-white px-4 py-2 rounded-lg text-sm">Import Inventory</button>
                    <button className="bg-[#05CD99] text-white px-4 py-2 rounded-lg text-sm">Export</button>
                    <button className="bg-[#3965FF] text-white px-4 py-2 rounded-lg text-sm">Import</button>{
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
                    <button className="bg-[#4285F4] text-white px-4 py-2 rounded-lg text-sm">Filters</button></div>
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

                    {products.length > 0 ? (
                        <div className="overflow-x-auto relative main-outer-wrapper w-full">
                            <table ref={tableRef} className="md:w-full w-auto display main-tables" id="productTable">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 px-5  whitespace-nowrap text-left uppercase">
                                            Name
                                        </th>
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            Description
                                        </th>
                                        <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                            SKU
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

                                                        <span className="truncate"> {item.name || 'NIL'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2 px-5 text-left whitespace-nowrap">
                                                    <button
                                                        onClick={() => setOpenDescriptionId(item.description)}
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
                                                            {canDelete && <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-2xl" />}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {canEdit && <Pencil onClick={() => {
                                                                setActiveTab('product-details')
                                                                router.push(`/admin/products/update?id=${item.id}`)
                                                            }} className="cursor-pointer text-2xl" />}
                                                            {canSoftDelete && <Trash2 onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-2xl" />}
                                                        </>
                                                    )}</div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {showVariantPopup && selectedProduct && (
                                <div className="fixed inset-0  p-4 bg-[#00000054] bg-opacity-40 flex items-center justify-center z-50">
                                    <div className="bg-white overflow-auto  h-[500px] p-6 rounded-lg w-full max-w-5xl shadow-xl relative">
                                        <h2 className="text-xl font-semibold mb-4">Variant Details</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedProduct?.variants?.map((variant, idx) => {
                                                const imageUrls = variant.image
                                                    ? variant.image.split(',').map((img) => img.trim()).filter(Boolean)
                                                    : [];

                                                const varinatExists = selectedProduct?.isVarientExists ? 'yes' : 'no';
                                                const isExists = varinatExists === 'yes';

                                                return (
                                                    <div key={variant.id || idx} className="border rounded-lg shadow-sm p-4 bg-white">
                                                        {/* Image Carousel / Scroll */}
                                                        <div className="flex space-x-2 overflow-x-auto mb-4">
                                                            {imageUrls.length > 0 ? (
                                                                imageUrls.map((url, i) => (
                                                                    <Image
                                                                        key={i}
                                                                        height={100}
                                                                        width={100}
                                                                        src={fetchImages(url)}
                                                                        alt={variant.name || 'NIL'}
                                                                        className="shrink-0 rounded border"
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Image
                                                                    height={100}
                                                                    width={100}
                                                                    src="https://placehold.co/400"
                                                                    alt="Placeholder"
                                                                    className="shrink-0 rounded border"
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="space-y-2 text-sm text-gray-700">
                                                            <div><strong>Model:</strong> {variant.model || 'NIL'}</div>
                                                            <div><strong>Product Link:</strong> {variant.product_link || 'NIL'}</div>
                                                            <div><strong>Suggested Price:</strong> {variant.suggested_price ?? 'NIL'}</div>
                                                            <div><strong>SKU:</strong> {variant.sku || 'NIL'}</div>

                                                            {isExists && (
                                                                <>
                                                                    <div><strong>Name:</strong> {variant.name || 'NIL'}</div>
                                                                    <div><strong>Color:</strong> {variant.color || 'NIL'}</div>
                                                                </>
                                                            )}
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

                        </div>
                    ) : (
                        // Render when no admins
                        <div className='text-center'>No Products available</div>
                    )}


                </div>
            )}
             {openDescriptionId && (
                                                    <div className="fixed p-4 inset-0 z-50 m-auto  flex items-center justify-center bg-black/50">
                                                        <div className="bg-white w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 relative shadow-lg popup-boxes">
                                                            {/* Close Button */}
                                                            <button
                                                                onClick={() => setOpenDescriptionId(null)}
                                                                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl"
                                                            >
                                                                &times;
                                                            </button>

                                                            {/* HTML Description Content */}
                                                            {openDescriptionId ? (
                                                                <div
                                                                    className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                                                                    dangerouslySetInnerHTML={{ __html: openDescriptionId }}
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
