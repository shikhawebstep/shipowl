"use client";
import { useEffect, useCallback, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AiOutlineDelete } from "react-icons/ai";
import HashLoader from "react-spinners/HashLoader";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import 'datatables.net-dt/css/dataTables.dataTables.css';


export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [country, setCountry] = useState([]);
    const router = useRouter();



    const fetchState = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state`,
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
                setStateData(result?.states || []);
                setCountry(result?.countries || []);
            }
        } catch (error) {
            console.error("Error fetching state:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setStateData]);

    const trashState = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/trashed`,
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
                setStateData(result?.states || []);
                setCountry(result?.countries || []);

            }
        } catch (error) {
            console.error("Error fetching trashed state:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setStateData]);


    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "State" &&
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
            await fetchState();
            setLoading(false);
        };
        fetchData();
    }, [fetchState, verifyAdminAuth]);

    useEffect(() => {
        if (typeof window !== 'undefined' && stateData.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#statetable')) {
                    $('#statetable').DataTable().destroy();
                    $('#statetable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#statetable').DataTable({
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
                        $('#statetable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [stateData, loading]);

    const handleEditItem = (item) => {
        router.push(`/admin/state/update?id=${item.id}`);
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${item.id}`,
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

            await fetchState();
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

    const handleBulkDelete = async () => {
        if (selected.length === 0) {
            Swal.fire("No items selected", "", "info");
            return;
        }

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: `You will delete ${selected.length} state!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete them!",
        });

        if (!confirmResult.isConfirmed) return;

        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const admintoken = adminData?.security?.token;

        try {
            Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading() });
            setLoading(true);

            const results = await Promise.all(
                selected.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${admintoken}`,
                        },
                    })
                )
            );

            Swal.close();
            await fetchState();
            setSelected([]);
            Swal.fire("Deleted!", `${results.length} state were deleted.`, "success");
        } catch (error) {
            Swal.close();
            Swal.fire("Error", error.message || "Failed to delete", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        const table = $('#statetable').DataTable();
        table.button('.buttons-csv').trigger();
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${item?.id}/restore`,
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
                await trashState();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashState]);

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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${item.id}/destroy`,
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

            await trashState();
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

    return (
        <div className="">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 main-outer-wrapper">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                        <h2 className="md:text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed State List" : "State List"}
                        </h2>

                        <div className="flex gap-3 flex-wrap items-center">
                            <button
                                onClick={() => setIsPopupOpen((prev) => !prev)}
                                className="bg-[#F4F7FE] p-2 rounded-lg relative"
                            >
                                <MoreHorizontal className="text-[#F98F5C]" />
                                {isPopupOpen && (
                                    <div className="absolute md:left-0 mt-2 w-40 right-0 bg-white rounded-md shadow-lg z-10">
                                        <ul className="py-2 text-sm text-[#2B3674]">
                                           
                                            <li className="px-4 md:hidden block py-2 hover:bg-gray-100 cursor-pointer">
                                                {canViewTrashed && <button
                                                    className={`p-2 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                                    onClick={async () => {
                                                        if (isTrashed) {
                                                            setIsTrashed(false);
                                                            await fetchState();
                                                        } else {
                                                            setIsTrashed(true);
                                                            await trashState();
                                                        }
                                                    }}
                                                >
                                                    {isTrashed ? "state Listing (Simple)" : "Trashed state"}
                                                </button>}

                                            </li>
                                            <li className="px-4 md:hidden block py-2 hover:bg-gray-100 cursor-pointer">
                                                {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-2 px-4" >
                                                    <Link href="/admin/state/create">Add state</Link>
                                                </button>
                                                }
                                            </li>
                                             <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => exportCsv()}>
                                                Export CSV
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleBulkDelete()}>
                                                Bulk Delete
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                        </ul>
                                    </div>
                                )}
                            </button>
                            <div className="md:flex hidden justify-end gap-2">
                                {canViewTrashed && <button
                                    className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                    onClick={async () => {
                                        if (isTrashed) {
                                            setIsTrashed(false);
                                            await fetchState();
                                        } else {
                                            setIsTrashed(true);
                                            await trashState();
                                        }
                                    }}
                                >
                                    {isTrashed ? "state Listing (Simple)" : "Trashed state"}
                                </button>}
                                {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-2 px-4" >
                                    <Link href="/admin/state/create">Add state</Link>
                                </button>
                                }
                            </div>
                        </div>
                    </div>

                    {stateData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table className="display main-tables w-full" id="statetable">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">State Name</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">ISO 2 CODE</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Country</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Type</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stateData.map((item, index) => (
                                        <tr key={index} className="bg-white border-b border-[#E9EDF7] hover:bg-gray-50">
                                            <td className="px-6 py-4">{item.name}</td>
                                            <td className="px-6 py-4">{item.iso2}</td>
                                            <td className="px-6 py-4">
                                                {
                                                    (() => {
                                                        const filtered = country.filter((c) => {
                                                            const match = c.id === item.countryId;
                                                            return match;
                                                        });


                                                        const names = filtered.map((c) => {
                                                            return c.name;
                                                        });
                                                        return names.join(', ');
                                                    })()
                                                }
                                            </td>



                                            <td className="px-6 py-4">{item.type}</td>
                                            <td className="p-2 bg-transparent px-5 text-[#8F9BBA] border-0">
                                                <div className="flex justify-center gap-2">
                                                    {isTrashed ? (
                                                        <>
                                                            {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />}
                                                            {canDelete && <AiOutlineDelete onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {canEdit && <MdModeEdit onClick={() => handleEditItem(item)} className="cursor-pointer text-3xl" />}
                                                            {canSoftDelete && <AiOutlineDelete onClick={() => handleDelete(item)} className="cursor-pointer text-3xl" />}
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
                        <div className="text-center py-20 text-[#A3AED0] text-lg font-medium">
                            No State found.
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}