"use client";
import { useEffect, useCallback, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AiOutlineDelete } from "react-icons/ai";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useImageURL } from "@/components/ImageURLContext";
import Image from "next/image";
export default function List() {
    const { fetchImages } = useImageURL();
    const [isTrashed, setIsTrashed] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const router = useRouter();
    const fetchUsers = useCallback(async () => {
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
                `/api/admin/staff`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: result.message || result.error || "Your session has expired. Please log in again.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }

            setData(result?.admins || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const trashedUsers = useCallback(async () => {
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
                `/api/admin/staff/trashed`,
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
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Your session has expired. Please log in again.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result) {
                setData(result?.admins || []);
            }
        } catch (error) {
            console.error("Error fetching trashed Subuser:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setData]);

    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

   const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

const hasPermission = (action) =>
  !shouldCheckPermissions ||
  extractedPermissions.some(
    (perm) =>
      perm.module === "Sub User" &&
      perm.action === action &&
      perm.status === true
  );

const canViewTrashed = hasPermission("Trash Listing");
const canAdd = hasPermission("Create");
const canDelete = hasPermission("Permanent Delete");
const canEdit = hasPermission("Update");
const canSoftDelete = hasPermission("Soft Delete");
const canRestore = hasPermission("Restore");


    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifyAdminAuth();
            await checkAdminRole();
            await fetchUsers();
            setLoading(false);
        };
        fetchData();
    }, [fetchUsers, verifyAdminAuth]);

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
                if ($.fn.DataTable.isDataTable('#rto-table')) {
                    $('#rto-table').DataTable().destroy();
                    $('#rto-table').empty();
                }

                // Reinitialize DataTable with new data
                table = $('#rto-table').DataTable();

                return () => {
                    if (table) {
                        table.destroy();
                        $('#rto-table').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [data, loading]);

    const handleEditItem = (item) => {
        router.push(`/admin/sub-user/update?id=${item.id}`);
    };


    const handleDelete = async (item) => {
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

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            setLoading(true);

            const response = await fetch(
                `/api/admin/staff/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
                    },
                }
            );

            Swal.close();

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMessage.error || errorMessage.message || "Failed to delete.",
                });
                setLoading(false);
                return;
            }

            const result = await response.json();

            Swal.fire({
                icon: "success",
                title: "Trash!",
                text: result.message || `${item.name} has been Trashed successfully.`,
            });

            await fetchUsers();
        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };
    const handleRestore = useCallback(async (item) => {
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
                `/api/admin/staff/${item?.id}/restore`,
                {
                    method: "PATCH",
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
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Your session has expired. Please log in again.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result.status) {
                Swal.fire({
                    icon: "success",
                    text: `${item.name} Has Been Restored Successfully !`,
                });
                await trashedUsers();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashedUsers]);

    const handlePermanentDelete = async (item) => {
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

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            setLoading(true);

            const response = await fetch(
                `/api/admin/staff/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
                    },
                }
            );

            Swal.close();

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMessage.error || errorMessage.message || "Failed to delete.",
                });
                setLoading(false);
                return;
            }

            const result = await response.json();

            Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: result.message || `${item.name} has been deleted successfully.`,
            });

            await trashedUsers();
        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }



    return (
        <>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674]">Subuser List</h2>
                    <div className="flex gap-3  flex-wrap items-center">
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
                                className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                onClick={async () => {
                                    if (isTrashed) {
                                        setIsTrashed(false);
                                        await fetchUsers();
                                    } else {
                                        setIsTrashed(true);
                                        await trashedUsers();
                                    }
                                }}
                            >
                                {isTrashed ? "Subuser Listing (Simple)" : "Trashed Subuser"}
                            </button>}
                            {canAdd && <button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/sub-user/create">Add New</Link></button>}
                        </div>
                    </div>
                </div>
                {data.length > 0 ? (
                    <div className="overflow-x-auto relative main-outer-wrapper w-full">
                        <table className="md:w-full w-auto display main-tables" id="rto-table">
                            <thead>
                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">SR.</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Name</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Email</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Role</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Phone Number</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Profile Picture</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-end uppercase flex justify-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">

                                        <td className="p-2 whitespace-nowrap text-left px-5">{index + 1}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.name || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.email || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">  {item.role ? item.role.replace(/_/g, ' ') : 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.phoneNumber || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5"><Image height={50} width={50} src={fetchImages(item.profilePicture)} /></td>
                                        <td className="p-2 px-5 text-[#8F9BBA] text-center">

                                            <div className="flex justify-end gap-2">{isTrashed ? (
                                                <>
                                                    {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />}
                                                    {canDelete && <AiOutlineDelete onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />}
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && <MdModeEdit onClick={() => handleEditItem(item)} className="cursor-pointer text-3xl" />}
                                                    {canSoftDelete && <AiOutlineDelete onClick={() => handleDelete(item)} className="cursor-pointer text-3xl" />}
                                                </>
                                            )}</div>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center">No Subuser Found</p>
                )}


            </div>


        </>
    )
}
