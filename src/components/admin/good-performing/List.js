"use client";
import { useEffect, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
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

    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("good-pincode", "goodPincodes");

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

                    if ($.fn.DataTable.isDataTable("#rto-table")) {
                        $("#rto-table").DataTable().destroy();
                        $("#rto-table").empty();
                    }

                    table = $("#rto-table").DataTable();
                })
                .catch((error) => {
                    console.error("Failed to load DataTables dependencies:", error);
                });

            return () => {
                if (table) {
                    table.destroy();
                    $("#rto-table").empty();
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
                <h2 className="text-2xl font-bold text-[#2B3674]">Good Pincodes List</h2>
                <div className="flex gap-3 flex-wrap items-center">
                    <button
                        onClick={() => setIsPopupOpen((prev) => !prev)}
                        className="bg-[#F4F7FE] p-2 rounded-lg relative"
                    >
                        <MoreHorizontal className="text-[#F98F5C]" />
                        {isPopupOpen && (
                            <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                <ul className="py-2 text-sm text-[#2B3674]">
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                </ul>
                            </div>
                        )}
                    </button>
                    <div className="flex justify-start gap-5 items-end">
                        {canViewTrashed && <button
                            className={`p-3 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                            onClick={handleToggleTrash}
                        >
                            {isTrashed ? "Good Pincodes Listing (Simple)" : "Trashed Pincodes"}
                        </button>
                        }
                        {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-3 px-8">
                            <Link href="/admin/good-pincodes/create">Add New</Link>
                        </button>
                        }
                    </div>
                </div>
            </div>

            {data.length > 0 ? (
                <div className="overflow-x-auto relative main-outer-wrapper w-full">
                    <table className="md:w-full w-auto display main-tables" id="rto-table">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 px-5 text-left uppercase">SR.</th>
                                <th className="p-2 px-5 text-left uppercase">Pincode</th>
                                <th className="p-2 px-5 text-left uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 px-5 text-left">{index + 1}</td>
                                    <td className="p-2 px-5 text-left">{item.pincode}</td>
                                    <td className="p-2 px-5 text-right">

                                        <div className="flex justify-center gap-2">{isTrashed ? (
                                            <>
                                                {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item.id)} className="cursor-pointer text-3xl text-green-500" />}
                                                {canDelete && <AiOutlineDelete onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl" />}
                                            </>
                                        ) : (
                                            <>
                                                {canEdit && <MdModeEdit onClick={() => router.push(`/admin/good-pincodes/update?id=${item.id}`)} className="cursor-pointer text-3xl" />}
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
                <p className="text-center">No Pincode Found</p>
            )}
        </div>
    );
}
