"use client";
import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'swiper/css';
import 'swiper/css/navigation';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { Trash2, RotateCcw, Pencil } from "lucide-react";
import { useImageURL } from "@/components/ImageURLContext";
import { IoFilterSharp } from "react-icons/io5";

export default function List() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [roleData, setRoleData] = useState([]);
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("admin/role", "roles");
    const { handleBulkDelete } = useImageURL();

    const [roleName, setRoleName] = useState('');
    const [showFilter, setShowFilter] = useState(null);
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
    const [descriptionFilter, setDescriptionFilter] = useState('');
    const [tabStatus, setTabStatus] = useState("active");
    const inactiveRoles = roleData.filter((role) => !role.status);
    const isDisabled = inactiveRoles.length === 0;

    const filteredRoles = roleData.filter((item) =>
        tabStatus === "active" ? item.status === true : item.status === false
    );

    const handleClearFilters = () => {
        setRoleName('');
        setDescriptionFilter('');
        setStatusFilter('');
        setSelected([])

        // Clear all filters from DataTable
        if ($.fn.DataTable.isDataTable("#RoleTable")) {
            const table = $("#RoleTable").DataTable();
            table.search('').columns().search('').draw(); // clear global + column filters
        }

        // Hide all filter popups (optional)
        setShowFilter(false);
        setShowDescriptionFilter(false);
        setShowStatusFilter(false);
    };

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await checkAdminRole();
            await verifyAdminAuth();
            await fetchAll(setRoleData, setLoading);
            setLoading(false)

        };

        fetchInitialData();
    }, [fetchAll]);

    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setRoleData, setLoading);
        } else {
            await fetchAll(setRoleData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setRoleData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setRoleData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setRoleData, setLoading));



useEffect(() => {
    let table = null;

    const initializeDataTable = async () => {
        if (typeof window === 'undefined' || loading || roleData.length === 0) return;

        try {
            const [
                jQuery,
                DataTables,
                DataTablesDT,
                DataTablesButtons,
                DataTablesButtonsDT
            ] = await Promise.all([
                import('jquery'),
                import('datatables.net'),
                import('datatables.net-dt'),
                import('datatables.net-buttons'),
                import('datatables.net-buttons-dt')
            ]);

            window.$ = window.jQuery = jQuery.default;

            const $table = $('#RoleTable');

            if ($.fn.DataTable.isDataTable($table)) {
                $table.DataTable().destroy();
            }

            const isMobile = window.innerWidth <= 768;
            const pagingType = isMobile ? 'simple' : 'simple_numbers';

            table = $table.DataTable({
                pagingType,
                language: {
                    paginate: {
                        previous: "<",
                        next: ">"
                    }
                }
            });

            table.on('order.dt search.dt draw.dt', function () {
                table
                    .column(0, { search: 'applied', order: 'applied' })
                    .nodes()
                    .each((cell, i) => {
                        cell.innerHTML = i + 1;
                    });
            });

            // Apply default filter on 5th column (index 4)
            table.column(4).search("^active$", true, false).draw();
        } catch (error) {
            console.error('Failed to load DataTables dependencies:', error);
        }
    };

    initializeDataTable();

    return () => {
        if (table) {
            table.destroy();
        }
    };
}, [roleData, loading]);



    const exportCsv = () => {
        const table = $('#RoleTable').DataTable();
        table.button('.buttons-csv').trigger();
    };
    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Role" &&
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
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 main-outer-wrapper">
                    <div className="flex p-3 justify-between items-center mb-4">
                        <h2 className="md:text-2xl font-bold text-[#2B3674]">
                            {isTrashed ? "Trashed Role List" : "Role List"}
                        </h2>

                        <div className="flex gap-3  items-center">
                            <button
                                onClick={() => {
                                    const allIds = filteredRoles.map(data => data.id);
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
                                            apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/permission/role/bulk`,
                                            setSelected,
                                            setLoading,
                                        });
                                        await fetchAll(setRoleData, setLoading);
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                            )}
                            <div className="md:flex w-full justify-end gap-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md transition-all duration-200"
                                >
                                    Clear Filters
                                </button>
                                {canViewTrashed && (
                                    <button
                                        className={`text-sm p-2  gap-2 md:flex hidden text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                        onClick={handleToggleTrash}
                                    >
                                      {isTrashed ? "Role Listing (Simple)" : "Trashed Role"}
                                    </button>
                                )}
                                {canAdd && (
                                    <button
                                        className="bg-[#4285F4] gap-2 md:flex hidden text-sm  text-white rounded-md p-2 px-4"
                                    >
                                        <Link href="/admin/permission/role/create"> Add Role</Link>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsPopupOpen((prev) => !prev)}
                                className="border border-orange-500 p-1 rounded-lg relative"
                            >
                                <MoreHorizontal className="text-[#F98F5C] text-sm" />
                                {isPopupOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                        <ul className="py-2 text-sm text-[#2B3674] text-left">
                                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => exportCsv()}>
                                                Export CSV
                                            </li>
                                            
                                            
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer"><Link href="/admin/permission/role/create"> Add Role</Link></li>
                                            <li className="px-4 block md:hidden py-2 hover:bg-gray-100 cursor-pointer" onClick={handleToggleTrash}>{isTrashed ? "Role Listing (Simple)" : "Trashed Role"}</li>
                                        </ul>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4 border-b border-gray-200 mb-6">
                        <button
                            onClick={() => {
                                setTabStatus('active');
                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                    $("#RoleTable").DataTable().column(4).search("^active$", true, false).draw();
                                }
                            }}
                            className={`px-4 py-2 font-medium border-b-2 transition-all duration-200
            ${tabStatus === 'active'
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-500 hover:text-orange-600"
                                }`}
                        >
                            Active Role
                        </button>

                        <div className="relative group inline-block">
                            <button
                                disabled={isDisabled}
                                onClick={() => {
                                    setTabStatus('inactive');
                                    if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                        $("#RoleTable").DataTable().column(4).search("^inactive$", true, false).draw();
                                    }
                                }}
                                className={`px-4 py-2 font-medium border-b-2 transition-all duration-200 relative
                ${tabStatus === 'inactive'
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-500 hover:text-orange-600"
                                    }
                ${isDisabled ? 'cursor-not-allowed' : ''}
            `}
                            >
                                Inactive Role
                            </button>

                            {isDisabled && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                                    No inactive Role
                                    <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>




                    {roleData.length > 0 ? (
                        <div className="overflow-x-auto w-full relative">
                            <table id="RoleTable" className="display main-tables w-full">
                                <thead>
                                    <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Sr.</th>
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Created At </th>
                                        <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">

                                            <button
                                                onClick={() => setShowFilter(!showFilter)}
                                                className="flex gap-2 uppercase items-center ml-2"
                                            >
                                                Role Name <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            // Clean up
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    {/* Header */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Role Name</label>
                                                        <button
                                                            onClick={() => {
                                                                setRoleName("");
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().search("").draw();
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    {/* Input Search */}
                                                    <input
                                                        type="text"
                                                        value={roleName}
                                                        onChange={(e) => setRoleName(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring focus:ring-orange-500"
                                                        placeholder="Enter role name"
                                                    />

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowFilter(false); // Close filter
                                                            }}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().search(roleName).draw();
                                                                }
                                                                setShowFilter(false); // Close filter
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={() => setShowDescriptionFilter(!showDescriptionFilter)}
                                                className="flex gap-2 items-center uppercase"
                                            >
                                                Description <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showDescriptionFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowDescriptionFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Description</label>
                                                        <button
                                                            onClick={() => {
                                                                setDescriptionFilter('');
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().column(3).search("").draw(); // column index: Description
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={descriptionFilter}
                                                        onChange={(e) => setDescriptionFilter(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                        placeholder="Enter description"
                                                    />

                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => setShowDescriptionFilter(false)}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().column(3).search(descriptionFilter).draw();
                                                                }
                                                                setShowDescriptionFilter(false);
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={() => setShowStatusFilter(!showStatusFilter)}
                                                className="flex gap-2 items-center uppercase"
                                            >
                                                Status <IoFilterSharp className="w-4 h-4" />
                                            </button>

                                            {showStatusFilter && (
                                                <div
                                                    className="absolute z-10 mt-2 w-50 bg-white border rounded-xl shadow-lg p-4"
                                                    ref={(ref) => {
                                                        if (ref) {
                                                            const handleClickOutside = (e) => {
                                                                if (!ref.contains(e.target)) setShowStatusFilter(false);
                                                            };
                                                            document.addEventListener("mousedown", handleClickOutside);
                                                            return () => {
                                                                document.removeEventListener("mousedown", handleClickOutside);
                                                            };
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                                        <button
                                                            onClick={() => {
                                                                setStatusFilter('');
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().column(4).search("").draw(); // column index: Status
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>

                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                    >
                                                        <option value="">All</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>

                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => setShowStatusFilter(false)}
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if ($.fn.DataTable.isDataTable("#RoleTable")) {
                                                                    $("#RoleTable").DataTable().column(4).search(statusFilter).draw();
                                                                }
                                                                setShowStatusFilter(false);
                                                            }}
                                                            className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>
                                        <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleData.map((item, index) => {
                                        return (
                                            <tr
                                                key={item.id}
                                                className="bg-transparent border-b border-[#E9EDF7] text-[#2B3674] font-semibold"
                                            >
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">
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
                                                        {index + 1}

                                                    </label>
                                                </td>
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">

                                                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </td>
                                                <td className="p-2 bg-transparent whitespace-nowrap border-0 pe-5">

                                                    {item.name}
                                                </td>

                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                    {item.description}
                                                </td>

                                                <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                                    {item.status ? (
                                                        <span className="bg-green-100 text-green-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 text-md font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-2 bg-transparent px-5 text-[#8F9BBA] border-0">
                                                    <div className="flex justify-center gap-2">
                                                        {isTrashed ? (
                                                            <>
                                                                {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-2xl text-green-500" />
                                                                }
                                                                {canDelete && (
                                                                    <div className="relative group inline-block">
                                                                        <Trash2
                                                                            onClick={() => handleDestroy(item.id)}
                                                                            className="cursor-pointer text-2xl text-red-600"
                                                                        />
                                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-red-700 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                            Permanent Delete
                                                                        </span>
                                                                    </div>
                                                                )}

                                                            </>
                                                        ) : (
                                                            <>
                                                                {canEdit && (
                                                                    <Pencil
                                                                        onClick={() =>
                                                                            router.push(`/admin/permission/role/update?id=${item.id}`)
                                                                        }
                                                                        className="cursor-pointer text-2xl"
                                                                    />

                                                                )}
                                                                {canSoftDelete && (
                                                                    <div className="relative group inline-block">
                                                                        <Trash2
                                                                            onClick={() => handleSoftDelete(item.id)}
                                                                            className="cursor-pointer text-2xl"
                                                                        />
                                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10">
                                                                            Soft Delete
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {canDelete && (
                                                                    <div className="relative group inline-block">
                                                                        <Trash2
                                                                            onClick={() => handleDestroy(item.id)}
                                                                            className="cursor-pointer text-2xl text-red-600"
                                                                        />
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-[#A3AED0] text-lg font-medium">
                            No role found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}