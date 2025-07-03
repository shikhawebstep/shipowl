"use client";
import { useEffect, useCallback, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AiOutlineDelete } from "react-icons/ai";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";

export default function List() {
    const [isTrashed, setIsTrashed] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [countryData, setCountryData] = useState([]);
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("high-rto", "highRtos");


    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "High RTO" &&
                perm.action === action &&
                perm.status === true
        );

    const canViewTrashed = hasPermission("Trash Listing");
    const canAdd = hasPermission("Create");
    const canDelete = hasPermission("Permanent Delete");
    const canEdit = hasPermission("Update");
    const canSoftDelete = hasPermission("Soft Delete");
    const canRestore = hasPermission("Restore");


    const fetchCity = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/city`);
            const result = await response.json();
            setCityData(result?.cities || []);
        } catch (error) {
            console.error("Failed to fetch cities:", error);
        }
    }, []);


    const fetchState = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state`);
            const result = await response.json();
            setStateData(result?.states || []);
        } catch (error) {
            console.error("Failed to fetch states:", error);
        }
    }, []);

    const fetchCountry = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`);
            const result = await response.json();
            setCountryData(result?.countries || []);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
        }
    }, []);


    // Initial Auth + fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            await verifyAdminAuth();
            await checkAdminRole();
            await fetchAll(setData, setLoading);

            // Fetch all countries, states, and cities unconditionally
            await Promise.all([
                fetchCountry(),
                fetchState(),
                fetchCity()
            ]);
        };

        fetchInitialData();
    }, [fetchAll, fetchCity, fetchState, fetchCountry]);


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
        if (typeof window !== "undefined" && data.length > 0 && !loading) {
          Promise.all([
                import('jquery'),
                import('datatables.net'),
                import('datatables.net-dt'),
                import('datatables.net-buttons'),
                import('datatables.net-buttons-dt')
            ]).then(([jQuery]) => {
                window.jQuery = window.$ = jQuery.default;

                // Destroy existing DataTable if it exists
                if ($.fn.DataTable.isDataTable('#highRto')) {
                    $('#highRto').DataTable().destroy();
                    $('#highRto').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#highRto').DataTable({
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
                        $('#highRto').empty();
                    }
                };
            }).catch(console.error);
        }
    }, [data, loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl md:w-10/12 p-5">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#2B3674]">High Rto List</h2>
                <div className="flex gap-3 flex-wrap items-center">
                    <div className="md:flex hidden justify-start gap-5 items-end">
                        {canViewTrashed && <button
                            className={`p-3 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                            onClick={handleToggleTrash}
                        >
                            {isTrashed ? "Bad Pincodes Listing (Simple)" : "Trashed Pincodes"}
                        </button>
                        }
                        {canAdd && <Link href="/admin/high-rto/create">
                            <button className='bg-[#4285F4] text-white rounded-md p-3 px-8'>Add New</button>
                        </Link>
                        }
                    </div>
                    <button
                        onClick={() => setIsPopupOpen(prev => !prev)}
                        className="bg-[#F4F7FE] p-2 rounded-lg relative"
                    >
                        <MoreHorizontal className="text-[#F98F5C]" />
                        {isPopupOpen && (
                            <div className="absolute md:left-0 mt-2 w-40 right-0 bg-white rounded-md shadow-lg z-10">
                                <ul className="py-2 text-sm text-[#2B3674]">
                                    <li className="px-4 py-2 hover:bg-gray-100 block md:hidden cursor-pointer">
                                        {canViewTrashed && <button
                                            className={`p-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                            onClick={handleToggleTrash}
                                        >
                                            {isTrashed ? "Bad Pincodes Listing (Simple)" : "Trashed Pincodes"}
                                        </button>
                                        }

                                    </li>
                                    <li className="px-4 py-2 hover:bg-gray-100 block md:hidden cursor-pointer">
                                        {canAdd && <Link href="/admin/high-rto/create">
                                            <button className='bg-[#4285F4] text-white rounded-md p-3 px-8'>Add New</button>
                                        </Link>
                                        }

                                    </li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                </ul>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {data.length > 0 ? (
                <div className="overflow-x-auto relative main-outer-wrapper w-full">
                    <table className="md:w-full w-auto display main-tables" id="highRto">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Country</th>
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">State</th>
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">City</th>
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Pincode</th>
                                <th className="p-2 whitespace-nowrap px-5 text-end uppercase flex justify-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="px-6 py-4">
                                        {countryData.find((c) => c.id === item.countryId)?.name || 'NIL'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {stateData.find((s) => s.id === item.stateId)?.name || 'NIL'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {cityData.find((c) => c.id === item.cityId)?.name || 'NIL'}
                                    </td>
                                    <td className="p-2 whitespace-nowrap px-5 text-left">{item.pincode}</td>
                                    <td className="p-2 px-5 text-[#8F9BBA] text-center">
                                        <div className="flex justify-end gap-2">
                                            {isTrashed ? (
                                                <>
                                                    {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item.id)} className="cursor-pointer text-3xl text-green-500" />}
                                                    {canDelete && <AiOutlineDelete onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl" />}
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && <MdModeEdit onClick={() => router.push(`/admin/high-rto/update?id=${item.id}`)} className="cursor-pointer text-3xl" />}
                                                    {canSoftDelete && <AiOutlineDelete onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-3xl" />}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center">No Rto Found</p>
            )}
        </div>
    );
}
