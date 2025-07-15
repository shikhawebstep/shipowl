"use client";
import { useEffect, useCallback, useState } from "react";
import { Trash2, RotateCcw, Pencil, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useImageURL } from "@/components/ImageURLContext";
import Image from "next/image";
import { IoFilterSharp } from "react-icons/io5";

export default function List() {
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    const [selected, setSelected] = useState([]);
    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    const handleClearAllFilters = () => {
        setNameFilter('');
        setEmailFilter('');
        setRoleFilter('');
        setPhoneFilter('');
        setActiveFilter(null);

        if ($.fn.DataTable.isDataTable('#subuserAdmin')) {
            const table = $('#subuserAdmin').DataTable();
            table.columns().every(function () {
                this.search('');
            });
            table.draw();
        }
    };

    const { fetchImages, handleBulkDelete } = useImageURL();
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff`,
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
                    text: result.message || result.error || "Network Error.",
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/trashed`,
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
                if ($.fn.DataTable.isDataTable('#subuserAdmin')) {
                    $('#subuserAdmin').DataTable().destroy();
                    $('#subuserAdmin').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#subuserAdmin').DataTable({
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
                        $('#subuserAdmin').empty();
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/${item.id}`,
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/${item?.id}/restore`,
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/${item.id}/destroy`,
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
                                <div className="absolute md:left-0 mt-2 w-40 right-0 bg-white rounded-md shadow-lg z-10">
                                    <ul className="py-2 text-sm text-[#2B3674]">
                                        <li className="md:hidden block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                            {canViewTrashed && <button
                                                className={`p-2 text-white rounded-md ${isTrashed ? 'bg-green-500' : 'bg-red-500'}`}
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

                                        </li>
                                        <li className="md:hidden block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                            {canAdd && <button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/sub-user/create">Add New</Link></button>}

                                        </li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                    </ul>
                                </div>
                            )}
                        </button>
                        <button
                            onClick={handleClearAllFilters}
                            className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"

                        >
                            Clear All Filters
                        </button>
                        {selected.length > 0 && (
                            <button
                                onClick={async () => {
                                    await handleBulkDelete({
                                        selected,
                                        apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/bulk`,
                                        setSelected,
                                        setLoading,
                                    });
                                    await fetchUsers();
                                }}
                                className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                        )}
                        <div className="md:flex hidden justify-start gap-5 items-end">

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
                                    switch (activeFilter.key) {
                                        case 'name':
                                            setNameFilter('');
                                            break;
                                        case 'email':
                                            setEmailFilter('');
                                            break;
                                        case 'role':
                                            setRoleFilter('');
                                            break;
                                        case 'phone':
                                            setPhoneFilter('');
                                            break;
                                        default:
                                            break;
                                    }
                                    setActiveFilter(null);
                                    if ($.fn.DataTable.isDataTable('#subuserAdmin')) {
                                        $('#subuserAdmin')
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
                                activeFilter.key === 'name' ? nameFilter :
                                    activeFilter.key === 'email' ? emailFilter :
                                        activeFilter.key === 'role' ? roleFilter :
                                            activeFilter.key === 'phone' ? phoneFilter :
                                                ''
                            }
                            onChange={(e) => {
                                const val = e.target.value;
                                switch (activeFilter.key) {
                                    case 'name':
                                        setNameFilter(val);
                                        break;
                                    case 'email':
                                        setEmailFilter(val);
                                        break;
                                    case 'role':
                                        setRoleFilter(val);
                                        break;
                                    case 'phone':
                                        setPhoneFilter(val);
                                        break;
                                    default:
                                        break;
                                }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            placeholder={`Enter ${activeFilter.label}`}
                        />

                        <div className="flex justify-between mt-4">
                            <button onClick={() => setActiveFilter(null)} className="text-sm text-gray-500 hover:underline">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    let value = '';
                                    switch (activeFilter.key) {
                                        case 'name':
                                            value = nameFilter;
                                            break;
                                        case 'email':
                                            value = emailFilter;
                                            break;
                                        case 'role':
                                            value = roleFilter;
                                            break;
                                        case 'phone':
                                            value = phoneFilter;
                                            break;
                                        default:
                                            break;
                                    }

                                    if ($.fn.DataTable.isDataTable('#subuserAdmin')) {
                                        $('#subuserAdmin').DataTable().column(activeFilter.columnIndex).search(value).draw();
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
                        <table className="md:w-full w-auto display main-tables" id="subuserAdmin">
                            <thead>
                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">SR.</th>

                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                        <button
                                            onClick={(e) =>
                                                setActiveFilter({
                                                    key: 'name',
                                                    label: 'Name',
                                                    columnIndex: 1,
                                                    position: e.currentTarget.getBoundingClientRect(),
                                                })
                                            }
                                            className="flex items-center gap-2 uppercase"
                                        >
                                            Name <IoFilterSharp />
                                        </button>
                                    </th>

                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                        <button
                                            onClick={(e) =>
                                                setActiveFilter({
                                                    key: 'email',
                                                    label: 'Email',
                                                    columnIndex: 2,
                                                    position: e.currentTarget.getBoundingClientRect(),
                                                })
                                            }
                                            className="flex items-center gap-2 uppercase"
                                        >
                                            Email <IoFilterSharp />
                                        </button>
                                    </th>

                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                        <button
                                            onClick={(e) =>
                                                setActiveFilter({
                                                    key: 'role',
                                                    label: 'Role',
                                                    columnIndex: 3,
                                                    position: e.currentTarget.getBoundingClientRect(),
                                                })
                                            }
                                            className="flex items-center gap-2 uppercase"
                                        >
                                            Role <IoFilterSharp />
                                        </button>
                                    </th>

                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                        <button
                                            onClick={(e) =>
                                                setActiveFilter({
                                                    key: 'phone',
                                                    label: 'Phone Number',
                                                    columnIndex: 4,
                                                    position: e.currentTarget.getBoundingClientRect(),
                                                })
                                            }
                                            className="flex items-center gap-2 uppercase"
                                        >
                                            Phone Number <IoFilterSharp />
                                        </button>
                                    </th>

                                    <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Profile Picture</th>
                                    <th className="p-2 whitespace-nowrap px-5 text-end uppercase flex justify-end">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">

                                        <td className="p-2 whitespace-nowrap text-left px-5">{index + 1}</td>
                                        <td className="p-2 whitespace-nowrap px-5"><div className="flex items-center">
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
                                        </div></td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.email || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">  {item.role ? item.role.replace(/_/g, ' ') : 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.phoneNumber || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5"><Image height={50} width={50} src={fetchImages(item.profilePicture)} /></td>
                                        <td className="p-2 px-5 text-[#8F9BBA] text-center">

                                            <div className="flex justify-end gap-2">{isTrashed ? (
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
