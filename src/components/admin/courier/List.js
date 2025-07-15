"use client";
import { useEffect, useState } from "react";
import { Trash2, RotateCcw, Pencil, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/navigation";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { useAdminActions } from "@/components/commonfunctions/MainContext";
import { IoFilterSharp } from "react-icons/io5";
import { useImageURL } from "@/components/ImageURLContext";
export default function List() {
    const [isTrashed, setIsTrashed] = useState(false);
    const [selected, setSelected] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const { handleBulkDelete } = useImageURL();

    // States for each filter
    const [courierNameFilter, setCourierNameFilter] = useState('');
    const [courierCodeFilter, setCourierCodeFilter] = useState('');
    const [websiteFilter, setWebsiteFilter] = useState('');
    const [contactEmailFilter, setContactEmailFilter] = useState('');
    const [contactNumberFilter, setContactNumberFilter] = useState('');
    const [rtoChargesFilter, setRtoChargesFilter] = useState('');
    const [flatRateFilter, setFlatRateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [activeFilter, setActiveFilter] = useState(null);

    const { verifyAdminAuth, isAdminStaff, extractedPermissions } = useAdmin();
    const router = useRouter();
    const { fetchAll, fetchTrashed, softDelete, restore, destroy } = useAdminActions("courier-company", "courierCompanies");

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Initial Auth + fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await verifyAdminAuth();
            await fetchAll(setData, setLoading);
            setLoading(false);

        };

        fetchInitialData();
    }, [fetchAll]);


    const handleToggleTrash = async () => {
        setIsTrashed(prev => !prev);
        if (!isTrashed) {
            await fetchTrashed(setData, setLoading);
        } else {
            await fetchAll(setData, setLoading);
        }
    };

    const handleSoftDelete = (id) => softDelete(id, () => fetchAll(setData, setLoading));
    const handleRestore = (id) => restore(id, () => fetchTrashed(setData, setLoading));
    const handleDestroy = (id) => destroy(id, () => fetchTrashed(setData, setLoading));
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
                if ($.fn.DataTable.isDataTable('#courierCompanytable')) {
                    $('#courierCompanytable').DataTable().destroy();
                    $('#courierCompanytable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#courierCompanytable').DataTable({
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
                        $('#courierCompanytable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [data, loading]);


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
                perm.module === "Company" &&
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
        <>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="md:text-2xl font-bold text-[#2B3674]">Courier Company List</h2>
                    <div className="flex gap-3  flex-wrap items-center">

                        <button
                            onClick={() => {
                                setCourierNameFilter('');
                                setCourierCodeFilter('');
                                setWebsiteFilter('');
                                setContactEmailFilter('');
                                setContactNumberFilter('');
                                setRtoChargesFilter('');
                                setFlatRateFilter('');
                                setStatusFilter('');
                                setActiveFilter(null);

                                if ($.fn.DataTable.isDataTable('#courierCompanytable')) {
                                    $('#courierCompanytable').DataTable().columns().search('').draw();
                                }
                            }}
                            className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                        >
                            Clear All Filters
                        </button>
                        {selected.length > 0 && (
                            <button
                                onClick={async () => {
                                    await handleBulkDelete({
                                        selected,
                                        apiEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/courier-company/bulk`,
                                        setSelected,
                                        setLoading,
                                    });
                                    await fetchAll(setData, setLoading);
                                }}
                                className="bg-red-500 text-white p-2 rounded-md w-auto whitespace-nowrap">Delete Selected</button>
                        )}
                        <div className="md:flex hidden justify-start gap-5 items-end">

                            {
                                canViewTrashed && <button
                                    className={`p-3 py-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                    onClick={handleToggleTrash}
                                >
                                    {isTrashed ? "Company Listing (Simple)" : "Trashed Company"}
                                </button>
                            }
                            {canAdd && (<button className='bg-[#4285F4] text-white rounded-md p-3 py-2 px-8'><Link href="/admin/courier/create">Add New</Link></button>
                            )}

                        </div>
                        <button
                            onClick={() => setIsPopupOpen((prev) => !prev)}
                            className="bg-[#F4F7FE] p-2 rounded-lg relative"
                        >
                            <MoreHorizontal className="text-[#F98F5C]" />
                            {isPopupOpen && (
                                <div className="absolute md:left-0 right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                                    <ul className="py-2 text-sm text-[#2B3674]">
                                        <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer"> {
                                            canViewTrashed && <button
                                                className={`p-2 text-white rounded-md ${isTrashed ? "bg-green-500" : "bg-red-500"}`}
                                                onClick={handleToggleTrash}
                                            >
                                                {isTrashed ? "Company Listing (Simple)" : "Trashed Company"}
                                            </button>
                                        }

                                        </li>
                                        <li className="px-4 py-2 md:hidden block hover:bg-gray-100 cursor-pointer">
                                            {canAdd && (<button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/courier/create">Add New</Link></button>
                                            )}
                                        </li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                                    </ul>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {activeFilter && (
                    <div
                        className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                        style={{
                            top: activeFilter.position.bottom + window.scrollY + 5 + 'px',
                            left: activeFilter.position.left + 'px'
                        }}
                    >
                        {/* Label and Reset */}
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                {activeFilter.label}
                            </label>
                            <button
                                onClick={() => {
                                    activeFilter.setValue('');
                                    setActiveFilter(null);
                                    if (window.$.fn.DataTable.isDataTable('#courierCompanytable')) {
                                        window.$('#courierCompanytable')
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

                        {/* Input Field */}
                        <input
                            type="text"
                            value={
                                activeFilter.key === 'courierName' ? courierNameFilter :
                                    activeFilter.key === 'courierCode' ? courierCodeFilter :
                                        activeFilter.key === 'website' ? websiteFilter :
                                            activeFilter.key === 'contactEmail' ? contactEmailFilter :
                                                activeFilter.key === 'contactNumber' ? contactNumberFilter :
                                                    activeFilter.key === 'rtoCharges' ? rtoChargesFilter :
                                                        activeFilter.key === 'flatRate' ? flatRateFilter :
                                                            activeFilter.key === 'status' ? statusFilter : ''
                            }
                            onChange={(e) => activeFilter.setValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            placeholder={`Enter ${activeFilter.label}`}
                        />

                        {/* Actions */}
                        <div className="flex justify-between mt-4">
                            <button
                                onClick={() => setActiveFilter(null)}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (window.$.fn.DataTable.isDataTable('#courierCompanytable')) {
                                        window.$('#courierCompanytable')
                                            .DataTable()
                                            .column(activeFilter.columnIndex)
                                            .search(
                                                activeFilter.key === 'courierName' ? courierNameFilter :
                                                    activeFilter.key === 'courierCode' ? courierCodeFilter :
                                                        activeFilter.key === 'website' ? websiteFilter :
                                                            activeFilter.key === 'contactEmail' ? contactEmailFilter :
                                                                activeFilter.key === 'contactNumber' ? contactNumberFilter :
                                                                    activeFilter.key === 'rtoCharges' ? rtoChargesFilter :
                                                                        activeFilter.key === 'flatRate' ? flatRateFilter :
                                                                            activeFilter.key === 'status' ? statusFilter : ''
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
                        <table className="md:w-full w-auto display main-tables" id="courierCompanytable">
                            <thead>
                                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                    {[
                                        { key: 'courierName', label: 'Courier Name', state: courierNameFilter, setState: setCourierNameFilter, colIndex: 0 },
                                        { key: 'courierCode', label: 'Courier Code', state: courierCodeFilter, setState: setCourierCodeFilter, colIndex: 1 },
                                        { key: 'website', label: 'Website', state: websiteFilter, setState: setWebsiteFilter, colIndex: 2 },
                                        { key: 'contactEmail', label: 'Contact Email', state: contactEmailFilter, setState: setContactEmailFilter, colIndex: 3 },
                                        { key: 'contactNumber', label: 'Contact Number', state: contactNumberFilter, setState: setContactNumberFilter, colIndex: 4 },
                                        { key: 'rtoCharges', label: 'RTO Charges', state: rtoChargesFilter, setState: setRtoChargesFilter, colIndex: 5 },
                                        { key: 'flatRate', label: 'Flat Shipping Rate', state: flatRateFilter, setState: setFlatRateFilter, colIndex: 6 },
                                        { key: 'status', label: 'Status', state: statusFilter, setState: setStatusFilter, colIndex: 7 }
                                    ].map((col) => (
                                        <th key={col.key} className="p-2 whitespace-nowrap px-5 text-left uppercase relative">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: col.key,
                                                        label: col.label,
                                                        getValue: () => col.state,
                                                        setValue: col.setState,
                                                        columnIndex: col.colIndex,
                                                        position: e.currentTarget.getBoundingClientRect()
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                {col.label} <IoFilterSharp />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((item) => (
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
                                        <td className="p-2 whitespace-nowrap px-5">{item.code || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.website || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.email || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.phoneNumber || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.rtoCharges || 'NIL'}</td>
                                        <td className="p-2 whitespace-nowrap px-5">{item.flatShippingRate || 'NIL'}</td>
                                        <td className="p-2 bg-transparent whitespace-nowrap px-5 border-0">
                                            {item.status ? (
                                                <span className="bg-green-100 text-green-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400 border border-green-400">Active</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-red-400 border border-red-400">Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-2 px-5 text-[#8F9BBA] text-center">

                                            <div className="flex gap-2"> {isTrashed ? (
                                                <>
                                                    {canRestore && <RotateCcw onClick={() => handleRestore(item.id)} className="cursor-pointer text-3xl text-green-500" />}
                                                    {canDelete && <Trash2 onClick={() => handleDestroy(item.id)} className="cursor-pointer text-3xl" />}
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && <Pencil onClick={() => router.push(`/admin/courier/update?id=${item.id}`)} className="cursor-pointer text-3xl" />}
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
                    <p className="text-center">No Company Found</p>
                )}


            </div>


        </>
    )
}
