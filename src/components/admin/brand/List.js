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
export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [brandData, setBrandData] = useState([]);
    const { fetchImages } = useImageURL();
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();

    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/brand", "brands");

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
            await fetchAll(setBrandData, setLoading);
            setLoading(false)

        };

        fetchInitialData();
    }, [fetchAll]);

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


    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 main-outer-wrapper">
                    <div className="grid grid-cols-2 border border-[#E9EDF7] rounded-md p-3 justify-between items-center mb-4">
                        <h2 className="md:text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed Brand List" : "Brand List"}
                        </h2>
                        <div className="flex gap-3  items-center">

                            <div className="md:flex w-full justify-end gap-2">
                                {canViewTrashed && <button
                                    className={`text-sm p-2  gap-2 md:flex hidden items-center text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                    onClick={handleToggleTrash}
                                >
                                    <Trash2 className="text-sm" /> {isTrashed ? "Brand Listing (Simple)" : "Trashed Brand"}
                                </button>
                                }

                                {canAdd && <button
                                    className="bg-[#4285F4] gap-2 md:flex hidden text-sm  text-white rounded-md p-2 px-4"
                                >
                                    <BadgePlus className="text-sm" />  <Link href="/admin/brand/create"> Add Brand</Link>
                                </button>}

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
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer"><Link href="/admin/brand/create"> Add Brand</Link></li>
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer" onClick={handleToggleTrash}>{isTrashed ? "Brand Listing (Simple)" : "Trashed Brand"}</li>
                                        </ul>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {brandData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table id="brandTable" className="display main-tables">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Brand Image</th>
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Brand Name</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Description</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Status</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
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
                    ) : (
                        <div className="text-center py-20 text-[#A3AED0] text-lg font-medium">
                            No brand found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}