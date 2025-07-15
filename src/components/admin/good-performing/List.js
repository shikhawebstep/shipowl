"use client";
import { useEffect, useState } from "react";
import { Trash2, RotateCcw, Pencil, MoreHorizontal } from "lucide-react";
import { FaCheck } from "react-icons/fa";
import Link from "next/link";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { IoFilterSharp } from "react-icons/io5";
import { useImageURL } from "@/components/ImageURLContext";
export default function List() {
    const { handleBulkDelete } = useImageURL();
    const [isTrashed, setIsTrashed] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [selected, setSelected] = useState([]);
    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("good-pincode", "goodPincodes");
    const [pincodeFilter, setPincodeFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    // Initial Auth + fetch
    useEffect(() => {
        verifyAdminAuth();
        checkAdminRole();
        fetchAll(setData, setLoading);
    }, []);

    // DataTables setup
    useEffect(() => {
        if (typeof window !== "undefined" && data.length > 0 && !loading) {
            let table = null;

            Promise.all([
                import("jquery"),
                import("datatables.net"),
                import("datatables.net-dt"),
                import("datatables.net-buttons"),
                import("datatables.net-buttons-dt"),
            ])
                .then(([jQuery]) => {
                    window.jQuery = window.$ = jQuery.default;

                    if ($.fn.DataTable.isDataTable("#goodPincodes")) {
                        $("#goodPincodes").DataTable().destroy();
                        $("#goodPincodes").empty();
                    }

                    if ($.fn.DataTable.isDataTable("#goodPincodes")) {
                        $("#goodPincodes").DataTable().destroy();
                        $("#goodPincodes").empty();
                    }

                    const isMobile = window.innerWidth <= 768;
                    const pagingType = isMobile ? 'simple' : 'simple_numbers';

                    table = $('#goodPincodes').DataTable({
                        pagingType,
                        language: {
                            paginate: {
                                previous: "<",
                                next: ">"
                            }
                        }
                    });
                })
                .catch((error) => {
                    console.error("Failed to load DataTables dependencies:", error);
                });

            return () => {
                if (table) {
                    table.destroy();
                    $("#goodPincodes").empty();
                }
            };
        }
    }, [data, loading]);

    const handleToggleTrash = async () => {
        setIsTrashed((prev) => !prev);
        if (!isTrashed) {
            await fetchTrashed(setData, setLoading);
        } else {
            await fetchAll(setData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setData, setLoading));

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
                perm.module === "Good Pincode" &&
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
        <div className="bg-white rounded-3xl md:w-8/12 p-5">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="md:text-2xl font-bold text-[#2B3674]">Good Pincodes List</h2>
                <div className="flex gap-3 flex-wrap items-center">
                    <button
                        onClick={() => setIsPopupOpen((prev) => !prev)}
                        className="bg-[#F4F7FE] p-2 rounded-lg relative"
                    >
                        <MoreHorizontal className="text-[#F98F5C]" />
                        {isPopupOpen && (
                            <div className="absolute md:left-0 mt-2 w-40 right-0 bg-white rounded-md shadow-lg z-10">
                                <ul className="py-2 text-sm text-[#2B3674]">
                                    <li className="md:hidden block px-4 py-2 hover:bg-gray-100 cursor-pointer">   {canViewTrashed && <button
                                        className={`p-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                        onClick={handleToggleTrash}
                                    >
                                        {isTrashed ? "Good Pincodes Listing (Simple)" : "Trashed Pincodes"}
                                    </button>
                                    }

                                    </li>
                                    <li className="md:hidden block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                        {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-3 px-8">
                                            <Link href="/admin/good-pincodes/create">Add New</Link>
                                        </button>
                                        }

                                    </li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                </ul>
                            </div>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setPincodeFilter('');
                            setSelected([])
                            if (window.$.fn.DataTable.isDataTable('#goodPincodes')) {
                                window.$('#goodPincodes').DataTable().columns().search('').draw();
                            }
                        }}
                        className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                    >
                        Clear All Filters
                    </button>
                     <button
                        onClick={() => {
                            const allIds = data.map(data => data.id);
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
                                    apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/good-pincode/bulk`,
                                    setSelected,
                                    setLoading,
                                });
                                await fetchAll(setData, setLoading);
                            }}
                            className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                    )}
                    <div className="md:flex hidden justify-start gap-5 items-end">

                        {canViewTrashed && <button
                            className={`p-3 py-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                            onClick={handleToggleTrash}
                        >
                            {isTrashed ? "Good Pincodes Listing (Simple)" : "Trashed Pincodes"}
                        </button>
                        }
                        {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-3 py-2 px-8">
                            <Link href="/admin/good-pincodes/create">Add New</Link>
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
                                setActiveFilter(null);
                                if (window.$.fn.DataTable.isDataTable('#goodPincodes')) {
                                    window.$('#goodPincodes')
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
                        value={
                            activeFilter.key === 'pincode' ? pincodeFilter : ''
                        }
                        onChange={(e) => activeFilter.setValue(e.target.value)}
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
                                if (window.$.fn.DataTable.isDataTable('#goodPincodes')) {
                                    window.$('#goodPincodes')
                                        .DataTable()
                                        .column(activeFilter.columnIndex)
                                        .search(
                                            activeFilter.key === 'pincode' ? pincodeFilter : ''
                                        )
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

            {data.length > 0 ? (
                <div className="overflow-x-auto relative main-outer-wrapper w-full">
                    <table className="md:w-full w-auto display main-tables" id="goodPincodes">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 px-5 text-left uppercase">SR.</th>
                                <th className="p-2 px-5 text-left uppercase">Created At</th>

                                <th className="p-2 px-5 text-left uppercase relative">
                                    <button
                                        onClick={(e) =>
                                            setActiveFilter({
                                                key: 'pincode',
                                                label: 'Pincode',
                                                setValue: setPincodeFilter,
                                                getValue: () => pincodeFilter,
                                                columnIndex: 2,
                                                position: e.currentTarget.getBoundingClientRect()
                                            })
                                        }
                                        className="flex items-center gap-2 uppercase"
                                    >
                                        Pincode <IoFilterSharp />
                                    </button>
                                </th>

                                <th className="p-2 px-5 text-left uppercase">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 px-5 text-left">

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


                                            </label>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">

                                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric"
                                        })}
                                    </td>
                                    <td className="p-2 px-5 text-left">{item.pincode}</td>
                                    <td className="p-2 px-5 text-right">

                                        <div className="flex justify-center gap-2">{isTrashed ? (
                                            <>
                                                {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-3xl text-green-500" />}
                                                {canDelete && <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl" />}
                                            </>
                                        ) : (
                                            <>
                                                {canEdit && <Pencil onClick={() => router.push(`/admin/good-pincodes/update?id=${item.id}`)} className="cursor-pointer text-3xl" />}
                                                {canSoftDelete && (
                                                    <div className="relative group inline-block">
                                                        <Trash2 onClick={() => handleSoftDelete(item.id)} className="cursor-pointer text-3xl" />
                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                            Soft Delete
                                                        </span>
                                                    </div>
                                                )}

                                                {canDelete && (
                                                    <div className="relative group inline-block">

                                                        <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl text-red-500" />
                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                            Permanent Delete
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center">No Pincode Found</p>
            )}
        </div>
    );
}
