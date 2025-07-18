"use client";
import { useEffect, useCallback, useState } from "react";
import { Trash2, RotateCcw, Pencil, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import HashLoader from "react-spinners/HashLoader";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { FaCheck } from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
import { useImageURL } from "@/components/ImageURLContext";


export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [country, setCountry] = useState([]);
    const router = useRouter();
    const [stateNameFilter, setStateNameFilter] = useState('');
    const [isoFilter, setIsoFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const { handleBulkDelete } = useImageURL();
    const [activeFilter, setActiveFilter] = useState(null);

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

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
                        "Network Error.",
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
                        "Network Error.",
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
                                            
                                            
                                        </ul>
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setStateNameFilter('');
                                    setIsoFilter('');
                                    setCountryFilter('');
                                    setTypeFilter('');
                                    setSelected([])
                                    setActiveFilter(null);

                                    if ($.fn.DataTable.isDataTable('#statetable')) {
                                        const table = $('#statetable').DataTable();
                                        table
                                            .search('')
                                            .columns()
                                            .search('')
                                            .draw();
                                    }
                                }}
                                className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                            >
                                Clear All Filters
                            </button>
                            <button
                                onClick={() => {
                                    const allIds = stateData.map(data => data.id);
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
                                            apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/bulk`,
                                            setSelected,
                                            setLoading,
                                        });
                                        await fetchState();
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                            )}
                            <div className="md:flex hidden justify-end gap-2">


                                {canViewTrashed && <button
                                    className={`p-3 py-2 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
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
                    {activeFilter && (
                        <div
                            className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                            style={{
                                top: activeFilter.position.bottom + window.scrollY + 5 + 'px',
                                left: activeFilter.position.left + 'px',
                            }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">{activeFilter.label}</label>
                                <button
                                    onClick={() => {
                                        activeFilter.setValue('');
                                        setActiveFilter(null);
                                        if ($.fn.DataTable.isDataTable('#statetable')) {
                                            $('#statetable').DataTable().column(activeFilter.columnIndex).search('').draw();
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
                                    activeFilter.key === 'stateName'
                                        ? stateNameFilter
                                        : activeFilter.key === 'iso'
                                            ? isoFilter
                                            : activeFilter.key === 'country'
                                                ? countryFilter
                                                : activeFilter.key === 'type'
                                                    ? typeFilter
                                                    : ''
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
                                        if ($.fn.DataTable.isDataTable('#statetable')) {
                                            const searchVal =
                                                activeFilter.key === 'stateName'
                                                    ? stateNameFilter
                                                    : activeFilter.key === 'iso'
                                                        ? isoFilter
                                                        : activeFilter.key === 'country'
                                                            ? countryFilter
                                                            : activeFilter.key === 'type'
                                                                ? typeFilter
                                                                : '';
                                            $('#statetable').DataTable().column(activeFilter.columnIndex).search(searchVal).draw();
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


                    {stateData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table className="display main-tables w-full" id="statetable">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'stateName',
                                                        label: 'State Name',
                                                        value: stateNameFilter,
                                                        setValue: setStateNameFilter,
                                                        columnIndex: 0,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                State Name <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'iso',
                                                        label: 'ISO 2 Code',
                                                        value: isoFilter,
                                                        setValue: setIsoFilter,
                                                        columnIndex: 1,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                ISO 2 CODE <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'country',
                                                        label: 'Country',
                                                        value: countryFilter,
                                                        setValue: setCountryFilter,
                                                        columnIndex: 2,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Country <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'type',
                                                        label: 'Type',
                                                        value: typeFilter,
                                                        setValue: setTypeFilter,
                                                        columnIndex: 3,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Type <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {stateData.map((item, index) => (
                                        <tr key={index} className="bg-white border-b border-[#E9EDF7] hover:bg-gray-50">
                                            <td className="px-6 py-4">
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
                                            <td className="px-6 py-4">
                                                {item.iso2}</td>
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
                                                            {canRestore && <RotateCcw onClick={() => handleRestore(item)} className="cursor-pointer text-3xl text-green-500" />}
                                                            {canDelete && <Trash2 onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl" />}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {canEdit && <Pencil onClick={() => handleEditItem(item)} className="cursor-pointer text-3xl" />}
                                                            {canSoftDelete && (
                                                                <div className="relative group inline-block">
                                                                    <Trash2 onClick={() => handleDelete(item)} className="cursor-pointer text-3xl" />
                                                                    <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                        Soft Delete
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {canDelete && (
                                                                <div className="relative group inline-block">

                                                                    <Trash2 onClick={() => handlePermanentDelete(item)} className="cursor-pointer text-3xl text-red-500" />
                                                                    <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                        Permanent Delete
                                                                    </span>
                                                                </div>
                                                            )}
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