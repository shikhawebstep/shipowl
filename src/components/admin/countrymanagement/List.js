"use client";
import { useContext, useEffect, useCallback, useState } from "react";
import { MdModeEdit, MdRestoreFromTrash } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
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
    const [countryData, setCountryData] = useState([]);
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const fetchcountry = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`,
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
                setCountryData(result?.countries || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setCountryData]);

    const trashCountry = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/trashed`,
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
                setCountryData(result?.countries || []);
            }
        } catch (error) {
            console.error("Error fetching trashed categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setCountryData]);

    useEffect(() => {
        const fetchData = async () => {
            setIsTrashed(false);
            setLoading(true);
            await verifyAdminAuth();
            await checkAdminRole();
            await fetchcountry();
            setLoading(false);
        };
        fetchData();
    }, [fetchcountry, verifyAdminAuth]);

    useEffect(() => {
        if (typeof window !== 'undefined' && countryData.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#countryTable')) {
                    $('#countryTable').DataTable().destroy();
                    $('#countryTable').empty();
                }

                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#countryTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    }
                });

                // Reinitialize DataTable with new data

                return () => {
                    if (table) {
                        table.destroy();
                        $('#countryTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [countryData, loading]);

    const handleEditItem = (item) => {
        router.push(`/admin/country/update?id=${item.id}`);
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${item.id}`,
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

            await fetchcountry();
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
            text: `You will delete ${selected.length} categories!`,
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
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${admintoken}`,
                        },
                    })
                )
            );

            Swal.close();
            await fetchcountry();
            setSelected([]);
            Swal.fire("Deleted!", `${results.length} categories were deleted.`, "success");
        } catch (error) {
            Swal.close();
            Swal.fire("Error", error.message || "Failed to delete", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        const table = $('#countryTable').DataTable();
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${item?.id}/restore`,
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
                await trashCountry();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [router, trashCountry]);

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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${item.id}/destroy`,
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

            await trashCountry();
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

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Country" &&
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
        <div className="">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 main-outer-wrapper">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                        <h2 className="md:text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed Country List" : "Country List"}
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
                                                            await fetchcountry();
                                                        } else {
                                                            setIsTrashed(true);
                                                            await trashCountry();
                                                        }
                                                    }}
                                                >
                                                    {isTrashed ? "Country Listing (Simple)" : "Trashed Country"}
                                                </button>}

                                            </li>
                                            <li className="px-4 md:hidden block py-2 hover:bg-gray-100 cursor-pointer">
                                                {canAdd && <button className="bg-[#4285F4] text-white rounded-md p-2 px-4" >
                                                    <Link href="/admin/country/create">Add country</Link>
                                                </button>
                                                }
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" >
                                                Export CSV
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" >
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
                                            await fetchcountry();
                                        } else {
                                            setIsTrashed(true);
                                            await trashCountry();
                                        }
                                    }}
                                >
                                    {isTrashed ? "Country Listing (Simple)" : "Trashed Country"}
                                </button>}
                                {
                                    canAdd && <button
                                        className="bg-[#4285F4] text-white rounded-md p-2 px-4"
                                    >
                                        <Link href="/admin/country/create">Add country</Link>
                                    </button>
                                }

                            </div>
                        </div>
                    </div>

                    {countryData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table id="countryTable" className="display main-tables">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Name</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">ISO2 Code</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">iso3 code</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">phonecode</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">currency</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase">nationality</th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {countryData.map((item) => (
                                        <tr key={item.id} className=" text-left bg-transparent border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap border-0 pe-5">
                                                <div className="flex items-center">
                                                    <label className="flex items-center cursor-pointer me-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.includes(item.id)}
                                                            onChange={() => handleCheckboxChange(item.id)}
                                                            className="peer hidden"
                                                        />
                                                        <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                            <FaCheck className="peer-checked:block text-white w-3 h-3" />
                                                        </div>
                                                    </label>
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap px-5 border-0">{item.iso2}</td>
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap px-5 border-0">{item.iso3}</td>
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap px-5 border-0">{item.phonecode}</td>
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap px-5 border-0">{item.currency}</td>
                                            <td className="p-2 bg-transparent text-start whitespace-nowrap px-5 border-0">{item.nationality}</td>

                                            <td className="p-2 bg-transparent text-start px-5 text-[#8F9BBA] border-0">
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
                            No country found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}