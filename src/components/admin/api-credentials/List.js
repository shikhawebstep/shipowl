"use client";
import { useEffect, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { AiOutlineDelete } from "react-icons/ai";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";

export default function List() {
    const [isTrashed, setIsTrashed] = useState(false);
    const [selected, setSelected] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const { verifyAdminAuth, isAdminStaff, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("api", "apis");

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Initial Auth + fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await verifyAdminAuth();
            await fetchAll(setData, setLoading);
            setLoading(false);

        };

        fetchInitialData();
    }, [fetchAll]);


    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setData, setLoading);
        } else {
            await fetchAll(setData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setData, setLoading));
    useEffect(() => {
        if (typeof window !== 'undefined' && data.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#apiTable')) {
                    $('#apiTable').DataTable().destroy();
                    $('#apiTable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#apiTable').DataTable({
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
                        $('#apiTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [data, loading]);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Api" &&
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
        <>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="md:text-2xl font-bold text-[#2B3674]">Api Credentials</h2>
                    <div className="flex gap-3  flex-wrap items-center">

                        <div className="md:flex hidden justify-start gap-5 items-end">
                            {
                                canViewTrashed && <button
                                    className={`p-3 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                    onClick={handleToggleTrash}
                                >
                                    {isTrashed ? "Api Listing (Simple)" : "Trashed Api"}
                                </button>
                            }
                            {canAdd && (<button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/api/create">Add New</Link></button>
                            )}

                        </div>
                        <button
                            onClick={() => setIsPopupOpen((prev) => !prev)}
                            className="bg-[#F4F7FE] p-2 rounded-lg relative"
                        >
                            <MoreHorizontal className="text-[#F98F5C]" />
                            {isPopupOpen && (
                                <div className="absolute md:left-0 right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                    <ul className="py-2 text-sm text-[#2B3674]">
                                        <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer"> {
                                            canViewTrashed && <button
                                                className={`p-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                                onClick={handleToggleTrash}
                                            >
                                                {isTrashed ? "Api Listing (Simple)" : "Trashed Api"}
                                            </button>
                                        }

                                        </li>
                                        <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer">
                                            {canAdd && (<button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/api/create">Add New</Link></button>
                                            )}
                                        </li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                        
                                        
                                    </ul>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
                {data.length > 0 ? (
                    <div className="overflow-x-auto relative main-outer-wrapper w-full">
                        <table className="md:w-full w-auto display main-tables" id="apiTable">
                            <thead>
                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">API Key</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Title</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">description</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                        <td className="p-2 whitespace-nowrap px-5">
                                            <div className="flex items-center">
                                                <label className="flex items-center cursor-pointer me-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(item.id)}
                                                        onChange={() => handleCheckboxChange(item.id)}
                                                        className="peer hidden"
                                                    />
                                                    <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                                           peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                        <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                                    </div>
                                                </label>
                                                {item.name}
                                            </div>

                                        </td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.code}<br /></td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.description}<br /></td>
                                        <td className="p-2 px-5 text-[#8F9BBA] text-center">

                                            <div className="flex gap-2"> {isTrashed ? (
                                                <>
                                                    {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item.id)} className="cursor-pointer text-3xl text-green-500" />}
                                                    {canDelete && <AiOutlineDelete onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl" />}
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && <MdModeEdit onClick={() => router.push(`/admin/api/update?id=${item.id}`)} className="cursor-pointer text-3xl" />}
                                                    {canSoftDelete && <AiOutlineDelete onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-3xl" />}
                                                </>
                                            )}</div>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center">No Api Found</p>
                )}


            </div>


        </>
    )
}
