"use client"
import React, { useState, useEffect, useCallback } from 'react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from '../middleware/AdminMiddleWareContext';
import { useRouter } from 'next/navigation';
import HashLoader from "react-spinners/HashLoader";
import { IoFilterSharp } from "react-icons/io5";
export default function List() {
    const { verifyAdminAuth, isAdminStaff, extractedPermissions } = useAdmin();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [emails, setEmails] = useState([]);
    const [selectedDescription, setSelectedDescription] = useState('');
    const [loading, setLoading] = useState(null);

    const [panelFilter, setPanelFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    const [tabStatus, setTabStatus] = useState("active");

    const inactiveTemplates = emails.filter((brand) => !brand.status);
    const isDisabled = inactiveTemplates.length === 0;


    const filteredTemplates = emails.filter((item) =>
        tabStatus === "active" ? item.status === true : item.status === false
    );


    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;

    const hasPermission = (action) =>
        !shouldCheckPermissions ||
        extractedPermissions.some(
            (perm) =>
                perm.module === "Mail" && perm.action === action && perm.status === true
        );

    const canEdit = hasPermission("Update");


    const fetchEmails = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config/template`,
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
                    text: errorMessage.message || errorMessage.error || "Network Error.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const emails = result?.mails || {};
            setEmails(emails)


        } catch (error) {
            console.error("Error fetching category:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);


    const handleView = (desc) => {
        setSelectedDescription(desc);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedDescription('');
    };

    const handleEdit = (id) => {
        router.push(`/admin/email-settings/template/update?id=${id}`)
    }
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await verifyAdminAuth(); // in case verifyAdminAuth is async
                await fetchEmails();
            } catch (error) {
                console.error("Initialization error:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);


    useEffect(() => {
        if (typeof window !== "undefined" && emails.length > 0 && !loading) {
            let tableInstance;

            const initializeDataTable = async () => {
                const [{ default: $ }] = await Promise.all([
                    import("jquery"),
                    import("datatables.net"),
                    import("datatables.net-dt"),
                    import("datatables.net-buttons"),
                    import("datatables.net-buttons-dt"),
                ]);

                window.$ = $;
                window.jQuery = $;

                // Destroy existing instance if it exists
                if ($.fn.DataTable.isDataTable("#emailTable")) {
                    $('#emailTable').DataTable().destroy();
                }

                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                // ✅ Correctly assign the table instance here
                tableInstance = $('#emailTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    },
                    columnDefs: [
                        { orderable: false, targets: 0 } // Disable sorting on index column
                    ]
                });

                // 🟧 Add dynamic index update on draw
                tableInstance.on('order.dt search.dt draw.dt', function () {
                    tableInstance
                        .column(0, { search: 'applied', order: 'applied' })
                        .nodes()
                        .each((cell, i) => {
                            cell.innerHTML = i + 1;
                        });
                });

                // Apply default filter on column 4 (5th column, zero-based index)
                tableInstance.column(4).search("^active$", true, false).draw();
            };

            initializeDataTable();

            return () => {
                if (tableInstance) {
                    tableInstance.destroy();
                }
            };
        }
    }, [emails, loading]);



    const parseAndRenderEmails = (data) => {
        try {
            const emails = JSON.parse(data);
            if (!Array.isArray(emails)) return "-";

            return emails.map((entry, idx) => (
                <div key={idx} className="text-sm text-gray-700">
                    {entry.name} &lt;{entry.email}&gt;
                </div>
            ));
        } catch (e) {
            return "-"; // Fallback if JSON is malformed
        }
    };


    return (
        <>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="overflow-x-auto p-4 bg-white main-outer-wrapper  rounded-xl shadow border border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className='text-center text-2xl font-bold py-4'>Email Settings</h2>
                        <button
                            onClick={() => {
                                setPanelFilter('');
                                setModuleFilter('');
                                setActionFilter('');
                                setStatusFilter('');
                                setSubjectFilter('');

                                if (window.$.fn.DataTable.isDataTable('#emailTable')) {
                                    const table = window.$('#emailTable').DataTable();
                                    table.columns().search('').draw();
                                }
                            }}
                            className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                        >
                            Clear All Filters
                        </button>



                    </div>

                    <div className="flex space-x-4 border-b border-gray-200 mb-6">
                        <button
                            onClick={() => {
                                setTabStatus('active');
                                if ($.fn.DataTable.isDataTable("#emailTable")) {
                                    $("#emailTable").DataTable().column(4).search("^active$", true, false).draw();
                                }
                            }}
                            className={`px-4 py-2 font-medium border-b-2 transition-all duration-200
            ${tabStatus === 'active'
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-500 hover:text-orange-600"
                                }`}
                        >
                            Active Templates
                        </button>

                        <div className="relative group inline-block">
                            <button
                                disabled={isDisabled}
                                onClick={() => {
                                    setTabStatus('inactive');
                                    if ($.fn.DataTable.isDataTable("#emailTable")) {
                                        $("#emailTable").DataTable().column(4).search("^inactive$", true, false).draw();
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
                                Inactive Templates
                            </button>

                            {isDisabled && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                                    No inactive Templates
                                    <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    {
                        emails.length > 0 ? (
                            <table className="w-full main-tables text-sm text-left text-gray-700" id="emailTable">
                                <thead className="">
                                    <tr className="uppercase border-b pb-2 text-[#A3AED0] border-[#E9EDF7]">
                                        <th className="whitespace-nowrap">SR.</th>
                                        <th className="whitespace-nowrap">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'panel',
                                                        label: 'Panel',
                                                        setValue: setPanelFilter,
                                                        getValue: () => panelFilter,
                                                        columnIndex: 1,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Panel <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="whitespace-nowrap">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'module',
                                                        label: 'Module',
                                                        setValue: setModuleFilter,
                                                        getValue: () => moduleFilter,
                                                        columnIndex: 2,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Module <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="whitespace-nowrap">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'action',
                                                        label: 'Action',
                                                        setValue: setActionFilter,
                                                        getValue: () => actionFilter,
                                                        columnIndex: 3,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Action <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="whitespace-nowrap">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'status',
                                                        label: 'Status',
                                                        setValue: setStatusFilter,
                                                        getValue: () => statusFilter,
                                                        columnIndex: 4,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Status <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="whitespace-nowrap">
                                            <button
                                                onClick={(e) =>
                                                    setActiveFilter({
                                                        key: 'subject',
                                                        label: 'Subject',
                                                        setValue: setSubjectFilter,
                                                        getValue: () => subjectFilter,
                                                        columnIndex: 5,
                                                        position: e.currentTarget.getBoundingClientRect(),
                                                    })
                                                }
                                                className="flex items-center gap-2 uppercase"
                                            >
                                                Subject <IoFilterSharp />
                                            </button>
                                        </th>
                                        <th className="whitespace-nowrap">Body</th>
                                        <th className="whitespace-nowrap">To Mails</th>
                                        <th className="whitespace-nowrap">CC Mail</th>
                                        <th className="whitespace-nowrap">BCC Mails</th>
                                        <th className="whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emails.map((item, index) => (
                                        <tr key={item.id} className="bg-transparent border-b border-[#E9EDF7] text-[#2B3674] ">
                                            <td className="whitespace-nowrap text-left font-medium text-gray-900">{index + 1}</td>
                                            <td className="whitespace-nowrap">{item.panel}</td>
                                            <td className="whitespace-nowrap">{item.module}</td>
                                            <td className="whitespace-nowrap">{item.action}</td>
                                            <td className="whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded text-white ${item.status === true ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {item.status ? "Active" : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap">{item.subject}</td>
                                            <td className="whitespace-nowrap">
                                                {item.html_template ? (
                                                    <button onClick={() => handleView(item.html_template)} className="text-blue-600 hover:underline">
                                                        View
                                                    </button>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {parseAndRenderEmails(item.to)}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {item.cc ? parseAndRenderEmails(item.cc) : "-"}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {item.bcc ? parseAndRenderEmails(item.bcc) : "-"}
                                            </td>

                                            <td className="whitespace-nowrap text-center">
                                                {
                                                    canEdit && <button className="text-indigo-600 hover:underline" onClick={() => handleEdit(item.id)}>Edit</button>
                                                }

                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className='text-center font-bold'> No Data Found</p>
                        )
                    }


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
                                        if (window.$.fn.DataTable.isDataTable('#emailTable')) {
                                            window.$('#emailTable').DataTable().column(activeFilter.columnIndex).search('').draw();
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
                                    activeFilter.key === 'panel' ? panelFilter :
                                        activeFilter.key === 'module' ? moduleFilter :
                                            activeFilter.key === 'action' ? actionFilter :
                                                activeFilter.key === 'status' ? statusFilter :
                                                    activeFilter.key === 'subject' ? subjectFilter :
                                                        ''
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (activeFilter.key === 'panel') setPanelFilter(val);
                                    if (activeFilter.key === 'module') setModuleFilter(val);
                                    if (activeFilter.key === 'action') setActionFilter(val);
                                    if (activeFilter.key === 'status') setStatusFilter(val);
                                    if (activeFilter.key === 'subject') setSubjectFilter(val);
                                }}
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
                                        const filterValue =
                                            activeFilter.key === 'panel' ? panelFilter :
                                                activeFilter.key === 'module' ? moduleFilter :
                                                    activeFilter.key === 'action' ? actionFilter :
                                                        activeFilter.key === 'status' ? statusFilter :
                                                            activeFilter.key === 'subject' ? subjectFilter :
                                                                '';

                                        if (window.$.fn.DataTable.isDataTable('#emailTable')) {
                                            window.$('#emailTable')
                                                .DataTable()
                                                .column(activeFilter.columnIndex)
                                                .search(filterValue)
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

                    {modalVisible && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white w-[90%] max-w-2xl rounded-lg shadow-lg overflow-y-auto max-h-[90vh] relative">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h3 className="text-lg font-semibold">Description</h3>
                                    <button onClick={closeModal} className="text-gray-500 hover:text-black text-xl">&times;</button>
                                </div>
                                <div className="p-4">
                                    {selectedDescription ? (
                                        <div dangerouslySetInnerHTML={{ __html: selectedDescription }} />
                                    ) : (
                                        <p>No description available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
