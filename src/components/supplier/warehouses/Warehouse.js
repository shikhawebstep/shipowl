
"use client"
import { useState, useCallback, useEffect } from 'react'
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupplier } from '../middleware/SupplierMiddleWareContext'
import 'datatables.net-dt/css/dataTables.dataTables.css';
import HashLoader from "react-spinners/HashLoader";
import { AiOutlineDelete } from "react-icons/ai";
import Swal from 'sweetalert2';
import Link from 'next/link';
import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
export default function Warehouse() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [WarehouseData, setWarehouseData] = useState([]);
    const { verifySupplierAuth, hasPermission } = useSupplier();
    const router = useRouter();

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };


    const fetchWarehouse = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong !",
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Network Error.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result) {
                setWarehouseData(result?.warehouses || []);
            }
        } catch (error) {
            console.error("Error fetching warehouse:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setWarehouseData]);

    const trashwarehouse = useCallback(async () => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/trashed`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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
                        "Network Error.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something Wrong!"
                );
            }

            const result = await response.json();
            if (result) {
                setWarehouseData(result?.warehouses || []);
            }
        } catch (error) {
            console.error("Error fetching trashed warehouse:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setWarehouseData]);

    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifySupplierAuth();
            await fetchWarehouse();
            setLoading(false);
        };
        fetchData();
    }, [fetchWarehouse, verifySupplierAuth]);

    useEffect(() => {
        if (typeof window !== 'undefined' && WarehouseData.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#warehouseTable')) {
                    $('#warehouseTable').DataTable().destroy();
                    $('#warehouseTable').empty();
                }

                // Reinitialize DataTable with new data
                    const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#warehouseTable').DataTable({
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
                        $('#warehouseTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [WarehouseData, loading]);

    const handleEditItem = (item) => {
        router.push(`/supplier/warehouse/update?id=${item.id}`);
    };


    const handleDelete = async (item) => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));
        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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

            await fetchWarehouse();
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
            text: `You will delete ${selected.length} warehouse!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete them!",
        });

        if (!confirmResult.isConfirmed) return;

        const supplierData = JSON.parse(localStorage.getItem("shippingData"));
        const suppliertoken = supplierData?.security?.token;

        try {
            Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading() });
            setLoading(true);

            const results = await Promise.all(
                selected.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${id}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${suppliertoken}`,
                        },
                    })
                )
            );

            Swal.close();
            await fetchWarehouse();
            setSelected([]);
            Swal.fire("Deleted!", `${results.length} warehouse were deleted.`, "success");
        } catch (error) {
            Swal.close();
            Swal.fire("Error", error.message || "Failed to delete", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        const table = $('#warehouseTable').DataTable();
        table.button('.buttons-csv').trigger();
    };

    const handleRestore = useCallback(async (item) => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));

        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${item?.id}/restore`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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
                        "Network Error.",
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
                await trashwarehouse();
                await fetchWarehouse();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashwarehouse]);

    const handlePermanentDelete = async (item) => {
        const supplierData = JSON.parse(localStorage.getItem("shippingData"));
        if (supplierData?.project?.active_panel !== "supplier") {
            localStorage.removeItem("shippingData");
            router.push("/supplier/auth/login");
            return;
        }

        const suppliertoken = supplierData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${suppliertoken}`,
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

            await trashwarehouse();
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
    const canCreate = hasPermission("Warehouse", "Create");
    const canDestory = hasPermission("Warehouse", "Permanent Delete");
    const canRestore = hasPermission("Warehouse", "Restore");
    const canSoftDelete = hasPermission("Warehouse", "Soft Delete");
    const canEdit = hasPermission("Warehouse", "Update");
    const canViewTrashed = hasPermission("Warehouse", "Trash Listing");
    return (
        <>
            <div>
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <HashLoader color="orange" />
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end gap-5 items-end mb-5">


                        </div>
                        <div className="bg-white rounded-3xl p-5">
                            <div className="flex flex-wrap justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-[#2B3674]">Warehouse</h2>
                                <div className="flex gap-3  flex-wrap items-center">
                                    <button
                                        onClick={() => setIsPopupOpen((prev) => !prev)}
                                        className="bg-[#F4F7FE] p-2 rounded-lg relative"
                                    >
                                        <MoreHorizontal className="text-[#F98F5C]" />
                                        {isPopupOpen && (
                                            <div className="absolute md:left-0 right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                                <ul className="py-2 text-sm text-[#2B3674]">
                                                    <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer"> {canViewTrashed && <button
                                                        className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                                        onClick={async () => {
                                                            if (isTrashed) {
                                                                setIsTrashed(false);
                                                                await fetchWarehouse();
                                                            } else {
                                                                setIsTrashed(true);
                                                                await trashwarehouse();
                                                            }
                                                        }}
                                                    >
                                                        {isTrashed ? "Warehouse Listing (Simple)" : "Trashed Warehouse"}
                                                    </button>}


                                                    </li>
                                                    <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer">


                                                        {canCreate && <button className="bg-[#4285F4] text-white rounded-md p-2 px-4">
                                                            <Link href="/supplier/warehouse/create">Add Warehouse</Link>
                                                        </button>}</li>
                                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
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
                                                    await fetchWarehouse();
                                                } else {
                                                    setIsTrashed(true);
                                                    await trashwarehouse();
                                                }
                                            }}
                                        >
                                            {isTrashed ? "Warehouse Listing (Simple)" : "Trashed Warehouse"}
                                        </button>}

                                        {canCreate && <button className="bg-[#4285F4] text-white rounded-md p-2 px-4">
                                            <Link href="/supplier/warehouse/create">Add Warehouse</Link>
                                        </button>}

                                    </div>
                                </div>
                            </div>
                            {WarehouseData.length > 0 ? (
                                <div className="overflow-x-auto w-full relative main-outer-wrapper">
                                    <table className="w-full display main-tables" id="warehouseTable">
                                        <thead>
                                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Warehouse Name</th>
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Contact Name</th>
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Address</th>
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Pickup Address</th>
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">RTO Address</th>
                                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {WarehouseData.map((item) => (
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
                                                    <td className="p-2 whitespace-nowrap px-5">
                                                        {item.contact_name}<br />
                                                        {item.contact_number}
                                                    </td>
                                                    <td className="p-2 whitespace-nowrap px-5">
                                                        {(() => {
                                                            if (!item?.address_line_1) return "-";
                                                            const parts = item.address_line_1.split(",");
                                                            if (parts.length > 2) {
                                                                const firstPart = parts.slice(0, 2).join(",") + ",";
                                                                const remaining = parts.slice(2).join(",");
                                                                const remainingParts = remaining.split(",");
                                                                if (remainingParts.length > 2) {
                                                                    return (
                                                                        <>
                                                                            {firstPart}
                                                                            <br />
                                                                            {remainingParts.slice(0, 2).join(",")},{" "}
                                                                            <br />
                                                                            {remainingParts.slice(2).join(",")}
                                                                        </>
                                                                    );
                                                                }
                                                                return (
                                                                    <>
                                                                        {firstPart}
                                                                        <br />
                                                                        {remaining}
                                                                    </>
                                                                );
                                                            }
                                                            return item.address_line_1;
                                                        })()}
                                                    </td>
                                                    <td className="p-2 px-5">
                                                        <div className="flex items-center mb-4">
                                                            <label className="flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only" checked={item.pickup_address} readOnly />
                                                                <div className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${item.pickup_address ? "bg-orange-500" : ""}`}>
                                                                    <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${item.pickup_address ? "translate-x-5" : ""}`} />
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 px-5">
                                                        <div className="flex items-center mb-4">
                                                            <label className="flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only" checked={item.rto_address} readOnly />
                                                                <div className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${item.rto_address ? "bg-orange-500" : ""}`}>
                                                                    <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${item.rto_address ? "translate-x-5" : ""}`} />
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 px-5 text-[#8F9BBA]">
                                                        <div className="flex justify-center gap-2">
                                                            {isTrashed ? (
                                                                <>
                                                                    {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />}
                                                                    {canDestory && <AiOutlineDelete onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />}
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
                                <p className="text-center text-gray-500 py-6">No Warehouses Available</p>
                            )}

                        </div>
                    </>
                )}
            </div>
        </>
    )
}
