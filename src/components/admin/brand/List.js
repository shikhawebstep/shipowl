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
import { IoFilterSharp } from "react-icons/io5";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { BadgePlus, Trash2, RotateCcw, Pencil } from "lucide-react";
import { useImageURL } from "@/components/ImageURLContext";

export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);

    const [brandData, setBrandData] = useState([]);
    const [brandName, setBrandName] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [activeFilter, setActiveFilter] = useState(null);
    const [localInputValue, setLocalInputValue] = useState('');

    const { fetchImages } = useImageURL();
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/brand", "brands");
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setBrandData, setLoading);
            setLoading(false);
        };
        fetchInitialData();
    }, [fetchAll]);

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setBrandData, setLoading);
        } else {
            await fetchAll(setBrandData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setBrandData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setBrandData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setBrandData, setLoading));

    const handleClearFilters = () => {
        setBrandName('');
        setDescriptionFilter('');
        setStatusFilter('');
        if ($.fn.DataTable.isDataTable("#brandTable")) {
            const table = $("#brandTable").DataTable();
            table.search('').columns().search('').draw();
        }
    };

    const exportCsv = () => {
        const table = $('#brandTable').DataTable();
        table.button('.buttons-csv').trigger();
    };

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;
    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Brand" && perm.action === action && perm.status === true
        );

    const canViewTrashed = hasPermission("Trash Listing");
    const canAdd = hasPermission("Create");
    const canDelete = hasPermission("Permanent Delete");
    const canEdit = hasPermission("Update");
    const canSoftDelete = hasPermission("Soft Delete");
    const canRestore = hasPermission("Restore");

    useEffect(() => {
        if (activeFilter) {
            setLocalInputValue(activeFilter.value || '');
        }
    }, [activeFilter]);

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
                if ($.fn.DataTable.isDataTable('#brandTable')) {
                    $('#brandTable').DataTable().destroy();
                    $('#brandTable').empty();
                }
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#brandTable').DataTable({
                    pagingType,
                    language: {
                        paginate: { previous: "<", next: ">" }
                    }
                });

                return () => {
                    if (table) {
                        table.destroy();
                        $('#brandTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('DataTables init error:', error);
            });
        }
    }, [brandData, loading]);

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
                                onClick={handleClearFilters}
                                className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                            >
                                Clear Filters
                            </button>
                            {canViewTrashed && (
                                <button
                                    className={`text-sm px-4 py-2 flex items-center gap-2 uppercase rounded-md text-white ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                    onClick={handleToggleTrash}
                                >
                                    <Trash2 size={16} /> {isTrashed ? "Brand Listing" : "Trashed Brand"}
                                </button>
                            )}
                            {canAdd && (
                                <Link href="/admin/brand/create" className="bg-[#4285F4] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 uppercase">
                                    <BadgePlus size={16} /> Add Brand
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ✅ FILTER POPUP */}
                    {activeFilter && (
                        <div
                            className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                            style={{
                                top: activeFilter.position.bottom + window.scrollY + 5 + 'px',
                                left: activeFilter.position.left + 'px',
                            }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">{activeFilter.label}</label>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue('');
                                        setActiveFilter(null);
                                        if ($.fn.DataTable.isDataTable('#brandTable')) {
                                            $('#brandTable').DataTable().column(activeFilter.columnIndex).search('').draw();
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
                                        <option key={idx} value={opt}>{opt}</option>
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
                                        if ($.fn.DataTable.isDataTable('#brandTable')) {
                                            $('#brandTable').DataTable().column(activeFilter.columnIndex).search(localInputValue).draw();
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

                    <div className="overflow-x-auto">
                        <table id="brandTable" className="display main-tables w-full">
                            <thead>
                                <tr className="uppercase border-b text-[#A3AED0] border-[#E9EDF7]">
                                    <th>Brand Image</th>
                                    <th>Created At</th>
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

                                                        <Swiper
                                                            key={item.id}
                                                            modules={[Navigation]}
                                                            slidesPerView={1}
                                                            loop={item.image?.split(',').length > 1}
                                                            navigation={true}
                                                            className="mySwiper xl:w-[250px] md:w-[100px]  md:h-[100px] lg:h-[200px] w-[50px] ms-2 h-[50px]">                                                            {item.image?.split(',').map((img, index) => (
                                                                <SwiperSlide key={index}>
                                                                    <Image
                                                                        src={fetchImages(img)}
                                                                        alt={`Image ${index + 1}`}
                                                                        width={200}
                                                                        height={200}
                                                                        className="me-3 w-full h-full text-center object-cover rounded"
                                                                    />
                                                                </SwiperSlide>
                                                            ))}
                                                        </Swiper>

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
                                                        {canSoftDelete && <Trash2 onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-2xl" />}
                                                    </>
                                                )}</div>
                                            </td>
                                        </tr>

                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
