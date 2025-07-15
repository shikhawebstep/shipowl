"use client";
import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import Image from "next/image";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { BadgePlus, Trash2, RotateCcw, Pencil } from "lucide-react";
import { useImageURL } from "@/components/ImageURLContext";
import { IoFilterSharp } from "react-icons/io5";

export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/category", "categories");
    const { fetchImages, handleBulkDelete } = useImageURL();

    const [categoryName, setCategoryName] = useState('');
    const [showFilter, setShowFilter] = useState(null);
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
    const [descriptionFilter, setDescriptionFilter] = useState('');

    const handleClearFilters = () => {
        setCategoryName('');
        setDescriptionFilter('');
        setStatusFilter('');
        setSelected([])

        // Clear all filters from DataTable
        if ($.fn.DataTable.isDataTable("#categoryTable")) {
            const table = $("#categoryTable").DataTable();
            table.search('').columns().search('').draw(); // clear global + column filters
        }

        // Hide all filter popups (optional)
        setShowFilter(false);
        setShowDescriptionFilter(false);
        setShowStatusFilter(false);
    };

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setCategoryData, setLoading);
            setLoading(false)

        };

        fetchInitialData();
    }, [fetchAll]);

    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setCategoryData, setLoading);
        } else {
            await fetchAll(setCategoryData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setCategoryData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setCategoryData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setCategoryData, setLoading));
    useEffect(() => {
        if (typeof window !== 'undefined' && categoryData.length > 0 && !loading) {
            let table = null;

            Promise.all([
                import('jquery'),
                import('datatables.net'),
                import('datatables.net-dt'),
                import('datatables.net-buttons'),
                import('datatables.net-buttons-dt')
            ]).then(([jQuery]) => {
                window.jQuery = window.$ = jQuery.default;

                if ($.fn.DataTable.isDataTable('#categoryTable')) {
                    $('#categoryTable').DataTable().destroy();
                    $('#categoryTable').empty();
                }

                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#categoryTable').DataTable({
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
                        $('#categoryTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [categoryData, loading]);

    const exportCsv = () => {
        const table = $('#categoryTable').DataTable();
        table.button('.buttons-csv').trigger();
    };
    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Category" &&
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
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 main-outer-wrapper">
                    <div className="flex border border-[#E9EDF7] rounded-md p-3 justify-between items-center mb-4">
                        <h2 className="md:text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed Category List" : "Category List"}
                        </h2>

                        <div className="flex gap-3  items-center">
                            <button
                                onClick={() => {
                                    const allIds = categoryData.map(data => data.id);
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
                                            apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/category/bulk`,
                                            setSelected,
                                            setLoading,
                                        });
                                        await fetchAll(setCategoryData, setLoading);
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                            )}
                            <div className="md:flex w-full justify-end gap-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md transition-all duration-200"
                                >
                                    Clear Filters
                                </button>
                                {canViewTrashed && (
                                    <button
                                        className={`text-sm p-2  gap-2 md:flex hidden text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                        onClick={handleToggleTrash}
                                    >
                                        <Trash2 className="text-sm" /> {isTrashed ? "Category Listing (Simple)" : "Trashed Category"}
                                    </button>
                                )}
                                {canAdd && (
                                    <button
                                        className="bg-[#4285F4] gap-2 md:flex hidden text-sm  text-white rounded-md p-2 px-4"
                                    >
                                        <BadgePlus className="text-sm" />  <Link href="/admin/category/create"> Add Category</Link>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsPopupOpen((prev) => !prev)}
                                className="border border-orange-500 p-1 rounded-lg relative"
                            >
                                <MoreHorizontal className="text-[#F98F5C] text-sm" />
                                {isPopupOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                        <ul className="py-2 text-sm text-[#2B3674] text-left">
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => exportCsv()}>
                                                Export CSV
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleBulkDelete()}>
                                                Bulk Delete
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer"><Link href="/admin/category/create"> Add Category</Link></li>
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer" onClick={handleToggleTrash}>{isTrashed ? "Category Listing (Simple)" : "Trashed Category"}</li>
                                        </ul>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {categoryData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table id="categoryTable" className="display main-tables">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Category Image</th>
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Created At </th>
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">

                                            <button
                                                onClick={() => setShowFilter(!showFilter)}
                                                className="flex gap-2 uppercase items-center ml-2"
                                            >
                                                Category Name <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            // Clean up
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    {/* Header */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Category Name</label>
                                                        <button
                                                            onClick={() => {
                                                                setCategoryName("");
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().search("").draw();
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    {/* Input Search */}
                                                    <input
                                                        type="text"
                                                        value={categoryName}
                                                        onChange={(e) => setCategoryName(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring focus:ring-orange-500"
                                                        placeholder="Enter category name"
                                                    />

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowFilter(false); // Close filter
                                                            }}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().search(categoryName).draw();
                                                                }
                                                                setShowFilter(false); // Close filter
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={() => setShowDescriptionFilter(!showDescriptionFilter)}
                                                className="flex gap-2 items-center uppercase"
                                            >
                                                Description <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showDescriptionFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowDescriptionFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Description</label>
                                                        <button
                                                            onClick={() => {
                                                                setDescriptionFilter('');
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().column(3).search("").draw(); // column index: Description
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={descriptionFilter}
                                                        onChange={(e) => setDescriptionFilter(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                        placeholder="Enter description"
                                                    />

                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => setShowDescriptionFilter(false)}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().column(3).search(descriptionFilter).draw();
                                                                }
                                                                setShowDescriptionFilter(false);
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={() => setShowStatusFilter(!showStatusFilter)}
                                                className="flex gap-2 items-center uppercase"
                                            >
                                                Status <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showStatusFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-50 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowStatusFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                                        <button
                                                            onClick={() => {
                                                                setStatusFilter('');
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().column(4).search("").draw(); // column index: Status
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                    >
                                                        <option value="">All</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>

                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => setShowStatusFilter(false)}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#categoryTable")) {
                                                                    $("#categoryTable").DataTable().column(4).search(statusFilter).draw();
                                                                }
                                                                setShowStatusFilter(false);
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryData.map((item) => {



                                        return (
                                            <tr
                                                key={item.id}
                                                className="bg-transparent border-b border-[#E9EDF7] text-[#2B3674] font-semibold"
                                            >
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

                                                            {item.image && (
                                                                <Swiper
                                                                    key={item.id}
                                                                    modules={[Navigation]}
                                                                    slidesPerView={1}
                                                                    loop={item.image?.split(",").length > 1}
                                                                    navigation={true}
                                                                    className="mySwiper xl:w-[250px] md:w-[100px]  md:h-[100px] lg:h-[200px] w-[50px] ms-2 h-[50px]"
                                                                >
                                                                    {item.image?.split(",").map((img, index) => (
                                                                        <SwiperSlide key={index}>
                                                                            <Image
                                                                                src={fetchImages(img)} alt={`Image ${index + 1}`}
                                                                                width={200}
                                                                                height={200}
                                                                                className="me-3 h-full w-full object-cover rounded"
                                                                            />
                                                                        </SwiperSlide>
                                                                    ))}
                                                                </Swiper>
                                                            )}
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

                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                    {item.description}
                                                </td>

                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                    {item.status ? (
                                                        <span className="bg-green-100 text-green-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-2 bg-transparent px-5 text-[#8F9BBA] border-0">
                                                    <div className="flex justify-center gap-2">
                                                        {isTrashed ? (
                                                            <>
                                                                {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-2xl text-green-500" />
                                                                }
                                                                {canDelete && (
                                                                    <div className="relative group inline-block">
                                                                        <Trash2
                                                                            onClick={() => handleDestroy(item.id)}
                                                                            className="cursor-pointer text-2xl text-red-600"
                                                                        />
                                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                            Permanent Delete
                                                                        </span>
                                                                    </div>
                                                                )}

                                                            </>
                                                        ) : (
                                                            <>
                                                                {canEdit && (
                                                                    <Pencil
                                                                        onClick={() =>
                                                                            router.push(`/admin/category/update?id=${item.id}`)
                                                                        }
                                                                        className="cursor-pointer text-2xl"
                                                                    />

                                                                )}
                                                                {canSoftDelete && (
                                                                    <div className="relative group inline-block">
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
                                                                    <div className="relative group inline-block">
                                                                        <Trash2
                                                                            onClick={() => handleDestroy(item.id)}
                                                                            className="cursor-pointer text-2xl text-red-600"
                                                                        />
                                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                            Permanent Delete
                                                                        </span>
                                                                    </div>
                                                                )}




                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-[#A3AED0] text-lg font-medium">
                            No category found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}