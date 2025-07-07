"use client";
import { useEffect, useCallback, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AiOutlineDelete } from "react-icons/ai";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useDropshipper } from "../middleware/DropshipperMiddleWareContext";

export default function Payments() {
    const [isTrashed, setIsTrashed] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const { verifyDropShipperAuth, hasPermission } = useDropshipper();
    const router = useRouter();
    const [selected, setSelected] = useState([]);
    const canCreate = hasPermission("Payment", "Create");
    const canDestory = hasPermission("Payment", "Permanent Delete");
    const canRestore = hasPermission("Payment", "Restore");
    const canSoftDelete = hasPermission("Payment", "Soft Delete");
    const canEdit = hasPermission("Payment", "Update");
    const canViewTrashed = hasPermission("Payment", "Trash Listing");

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    const fetchPayments = useCallback(async () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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

            setData(result?.payments || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const trashedPayments = useCallback(async () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment/trashed`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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
                setData(result?.payments || []);
            }
        } catch (error) {
            console.error("Error fetching trashed Payments:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setData]);
    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifyDropShipperAuth();
            await fetchPayments();
            setLoading(false);
        };
        fetchData();
    }, [fetchPayments, verifyDropShipperAuth]);

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
                if ($.fn.DataTable.isDataTable('#payments')) {
                    $('#payments').DataTable().destroy();
                    $('#payments').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#payments').DataTable({
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
                        $('#payments').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [data, loading]);

    const handleEditItem = (item) => {
        router.push(`/dropshipping/payments/update?id=${item.id}`);
    };


    const handleDelete = async (item) => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment/${item.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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

            await fetchPayments();
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
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment/${item?.id}/restore`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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
                    text: `Payment Has Been Restored Successfully !`,
                });
                await trashedPayments();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashedPayments]);

    const handlePermanentDelete = async (item) => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment/${item.id}/destroy`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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

            await trashedPayments();
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
        <div className="bg-white lg:w-8/12 rounded-3xl p-5">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#2B3674]">Payments</h2>
                <div className="flex gap-3 flex-wrap items-center">
                    <button
                        onClick={() => setIsPopupOpen((prev) => !prev)}
                        className="bg-[#F4F7FE] p-2 rounded-lg relative"
                    >
                        <MoreHorizontal className="text-[#F98F5C]" />
                        {isPopupOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                <ul className="py-2 text-sm text-[#2B3674]">
                                    <li className="md:hidden block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                        {canViewTrashed && <button
                                            className={`p-3 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                                            onClick={async () => {
                                                if (isTrashed) {
                                                    setIsTrashed(false);
                                                    await fetchPayments();
                                                } else {
                                                    setIsTrashed(true);
                                                    await trashedPayments();

                                                }
                                            }}
                                        >
                                            {isTrashed ? "Payments Listing (Simple)" : "Trashed Payments"}
                                        </button>}
                                    </li>
                                    <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer">{canCreate && <Link href="/dropshipping/payments/create">
                                        <button className="bg-[#4285F4] text-white rounded-md p-3 px-8">Add New</button>
                                    </Link>}</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                </ul>
                            </div>
                        )}
                    </button>
                    {canViewTrashed && <button
                        className={`p-3 text-white hidden md:block rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
                        onClick={async () => {
                            if (isTrashed) {
                                setIsTrashed(false);
                                await fetchPayments();
                            } else {
                                setIsTrashed(true);
                                await trashedPayments();

                            }
                        }}
                    >
                        {isTrashed ? "Payments Listing (Simple)" : "Trashed Payments"}
                    </button>}
                    {canCreate && <Link href="/dropshipping/payments/create">
                        <button className="bg-[#4285F4] text-white  hidden md:block rounded-md p-3 px-8">Add New</button>
                    </Link>}
                </div>
            </div>
            {
                data.length > 0 ? (
                    <div className="overflow-x-auto relative main-outer-wrapper w-full">
                        <table className="md:w-full w-auto display main-tables" id="payments">
                            <thead>
                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7] text-sm">
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-left">#</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-left">Date</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-left">Transaction ID</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-left">Cycle</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-right">Amount</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-center">Status</th>
                                    <th className="p-2 px-5 uppercase whitespace-nowrap text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-medium text-sm">
                                        <td className="p-2 px-5 whitespace-nowrap">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(item.id)}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                    className="peer hidden"
                                                />
                                                <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                      peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                    <FaCheck className="peer-checked:block text-white w-3 h-3" />
                                                </div>
                                            </label>
                                        </td>
                                        <td className="p-2 px-5 whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString("en-IN", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td className="p-2 px-5 whitespace-nowrap">{item.transactionId}</td>
                                        <td className="p-2 px-5 whitespace-nowrap">{item.cycle}</td>
                                        <td className="p-2 px-5 whitespace-nowrap text-right">₹{item.amount.toLocaleString()}</td>
                                        <td className="p-2 px-5 whitespace-nowrap text-center">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status.toLowerCase() === "success"
                                                    ? "bg-green-100 text-green-600"
                                                    : item.status.toLowerCase() === "pending"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-600"
                                                    }`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-2 px-5 whitespace-nowrap text-center">
                                            <div className="flex justify-end gap-2">{isTrashed ? (
                                                <>
                                                    {canRestore && <MdRestoreFromTrash onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />}
                                                    {canDestory && <AiOutlineDelete onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />}
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
                    <p className="text-center">
                        No Payments Available
                    </p>
                )
            }



        </div>
    );
}
