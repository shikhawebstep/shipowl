"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import HashLoader from "react-spinners/HashLoader";
import { IoFilterSharp } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import { Trash2, RotateCcw, Pencil } from "lucide-react";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { useImageURL } from "@/components/ImageURLContext";
import "datatables.net-dt/css/dataTables.dataTables.css";

// Dynamically import BrandSwiper (client-only)
const BrandSwiper = dynamic(() => import("./BrandSwiper"), { ssr: false });

export default function List() {
    const [brandData, setBrandData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [selected, setSelected] = useState([]);
    const [brandName, setBrandName] = useState("");
    const [descriptionFilter, setDescriptionFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState(null);
    const [localInputValue, setLocalInputValue] = useState("");
    const [isClient, setIsClient] = useState(false);

    const router = useRouter();

    const { handleBulkDelete } = useImageURL();
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/brand", "brands");


    const [tabStatus, setTabStatus] = useState("active");

    const inactiveBrandData = brandData.filter((brand) => !brand.status);
    const isDisabled = inactiveBrandData.length === 0;


    const filteredBrandData = brandData.filter((item) =>
        tabStatus === "active" ? item.status === true : item.status === false
    );

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;
    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) => perm.module === "Brand" && perm.action === action && perm.status === true
        );

    const canViewTrashed = hasPermission("Trash Listing");
    const canAdd = hasPermission("Create");
    const canDelete = hasPermission("Permanent Delete");
    const canEdit = hasPermission("Update");
    const canSoftDelete = hasPermission("Soft Delete");
    const canRestore = hasPermission("Restore");

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setBrandData, setLoading);
            setLoading(false);
        };
        fetchData();
    }, [fetchAll]);

    useEffect(() => {
        if (typeof window !== 'undefined' && brandData.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#brandTable')) {
                    $('#brandTable').DataTable().destroy();
                    $('#brandTable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#brandTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    }
                });

                // Apply default filter on 5th column (index 4), e.g. show only 'active' brands
                table.column(4).search("^active$", true, false).draw();

                return () => {
                    if (table) {
                        table.destroy();
                        $('#brandTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [brandData, loading]);


    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleToggleTrash = async () => {
        setIsTrashed((prev) => !prev);
        isTrashed
            ? await fetchAll(setBrandData, setLoading)
            : await fetchTrashed(setBrandData, setLoading);
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setBrandData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setBrandData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setBrandData, setLoading));

    const handleClearFilters = () => {
        setBrandName("");
        setDescriptionFilter("");
        setStatusFilter("");
        setActiveFilter(null);
        setSelected([]);

        if ($.fn.DataTable.isDataTable("#brandTable")) {
            const table = $("#brandTable").DataTable();
            table.search("").columns().search("").draw();
        }
    };

    const exportCsv = () => {
        if ($.fn.DataTable.isDataTable("#brandTable")) {
            $("#brandTable").DataTable().button(".buttons-csv").trigger();
        }
    };

    useEffect(() => {
        if (activeFilter) {
            setLocalInputValue(activeFilter.value || "");
        }
    }, [activeFilter]);
    if(brandData.length === 0){
        return(
            <p className="text-center font-bold">No Brands Found</p>
        )
    }

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed Brand List" : "Brand List"}
                        </h2>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => {
                                    const allIds = filteredBrandData.map(data => data.id);
                                    setSelected(allIds);
                                }}
                                className="bg-[#3965FF] text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
                            >
                                Select All
                            </button>
                            {selected.length > 0 && (
                                <button
                                    onClick={async () => {
                                        await handleBulkDelete({
                                            selected,
                                            apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/brand/bulk`,
                                            setSelected,
                                            setLoading,
                                        });
                                        await fetchAll(setBrandData, setLoading);
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                            )}
                            <button
                                onClick={handleClearFilters}
                                className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                            >
                                Clear Filters
                            </button>
                            {canViewTrashed && (
                                <button
                                    className={`text-sm px-4 py-2 flex items-center gap-2  rounded-md text-white ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                    onClick={handleToggleTrash}
                                >
                                    {isTrashed ? "Brand Listing" : "Trashed Brand"}
                                </button>
                            )}
                            {canAdd && (
                                <Link href="/admin/brand/create" className="bg-[#4285F4] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 ">
                                    Add Brand
                                </Link>
                            )}
                        </div>
                    </div>
                    {isClient && activeFilter && (
                        <div
                            className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                            style={{
                                top: `${activeFilter.position.bottom + window.scrollY + 5}px`,
                                left: `${activeFilter.position.left}px`,
                            }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">{activeFilter.label}</label>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue("");
                                        setActiveFilter(null);
                                        if ($.fn.DataTable.isDataTable("#brandTable")) {
                                            $("#brandTable").DataTable()
                                                .column(activeFilter.columnIndex)
                                                .search("")
                                                .draw();
                                        }
                                    }}
                                    className="text-red-500 text-xs hover:underline"
                                >
                                    Reset
                                </button>
                            </div>

                            {activeFilter.isSelect ? (
                                <select
                                    value={localInputValue}
                                    onChange={(e) => setLocalInputValue(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                >
                                    <option value="">All</option>
                                    {activeFilter.options.map((opt, idx) => (
                                        <option key={idx} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={localInputValue}
                                    onChange={(e) => setLocalInputValue(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                    placeholder={`Enter ${activeFilter.label}`}
                                />
                            )}

                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={() => setActiveFilter(null)}
                                    className="text-sm text-gray-500 hover:underline"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue(localInputValue);
                                        if ($.fn.DataTable.isDataTable("#brandTable")) {
                                            $("#brandTable")
                                                .DataTable()
                                                .column(activeFilter.columnIndex)
                                                .search(localInputValue)
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

                    <div className="flex space-x-4 border-b border-gray-200 mb-6">
                        <button
                            onClick={() => {
                                setTabStatus('active');
                                if ($.fn.DataTable.isDataTable("#brandTable")) {
                                    $("#brandTable").DataTable().column(4).search("^active$", true, false).draw();
                                }
                            }}
                            className={`px-4 py-2 font-medium border-b-2 transition-all duration-200
            ${tabStatus === 'active'
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-500 hover:text-orange-600"
                                }`}
                        >
                            Active Brand
                        </button>

                        <div className="relative group inline-block">
                            <button
                                disabled={isDisabled}
                                onClick={() => {
                                    setTabStatus('inactive');
                                    if ($.fn.DataTable.isDataTable("#brandTable")) {
                                        $("#brandTable").DataTable().column(4).search("^inactive$", true, false).draw();
                                    }
                                }}
                                className={`px-4 py-2 font-medium border-b-2 transition-all duration-200 relative
                ${tabStatus === 'inactive'
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-500 hover:text-orange-600"
                                    }
                ${isDisabled ? 'cursor-not-allowed' : ''}
            `}
                            >
                                Inactive Brand
                            </button>

                            {isDisabled && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                                    No inactive Brand
                                    <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {
                        isClient && !loading && brandData.length > 0 &&

                        <div className="overflow-x-auto">
                            <table id="brandTable" className="display main-tables w-full">
                                <thead>
                                    <tr className="uppercase border-b pb-2 text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="text-left ">Brand Image</th>
                                        <th className="text-left ">Created At</th>
                                        <th>
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'brandName',
                                                        label: 'Brand Name',
                                                        value: brandName,
                                                        setValue: setBrandName,
                                                        columnIndex: 2,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Brand Name <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th>
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'description',
                                                        label: 'Description',
                                                        value: descriptionFilter,
                                                        setValue: setDescriptionFilter,
                                                        columnIndex: 3,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Description <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th>
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'status',
                                                        label: 'Status',
                                                        value: statusFilter,
                                                        setValue: setStatusFilter,
                                                        columnIndex: 4,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                        isSelect: true,
                                                        options: ['Active', 'Inactive'],
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Status <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brandData.map((item) => {

                                        return (
                                            <tr key={item.id} className="bg-transparent border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">
                                                    <div className="flex items-center">
                                                        <label className="flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.includes(item.id)}
                                                                onChange={() => handleCheckboxChange(item.id)}
                                                                className="peer hidden"
                                                            />
                                                            <div className="w-4 me-2 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                                <FaCheck className="peer-checked:block text-white w-3 h-3" />
                                                            </div>
                                                            <BrandSwiper images={item.image?.split(',') || []} />


                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">

                                                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </td>
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">

                                                    {item.name}
                                                </td>

                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">{item.description}</td>
                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                    {item.status ? (
                                                        <span className="bg-green-100 text-green-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">Active</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="p-2 bg-transparent px-5 text-[#8F9BBA] border-0">
                                                    <div className="flex justify-center gap-2"> {isTrashed ? (
                                                        <>
                                                            {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-2xl text-green-500" />}
                                                            {canDelete && <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-2xl" />}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {canEdit && <Pencil onClick={() => router.push(`/admin/brand/update?id=${item.id}`)} className="cursor-pointer text-2xl" />}
                                                            {canSoftDelete && (
                                                                <div className="relative group inline-block">
                                                                    <Trash2 onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-2xl" />
                                                                    <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                        Soft Delete
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {canDelete && (
                                                                <div className="relative group inline-block">

                                                                    <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-red-500 text-2xl" />
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
                    }
                </div>
            )}
        </div>
    );
}
