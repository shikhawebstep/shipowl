"use client"
import React, { useState, useEffect, useCallback } from 'react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from '../middleware/AdminMiddleWareContext';
import { useRouter } from 'next/navigation';
import HashLoader from "react-spinners/HashLoader";
export default function List() {
    const { verifyAdminAuth ,isAdminStaff,extractedPermissions} = useAdmin();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [emails, setEmails] = useState([]);
    const [selectedDescription, setSelectedDescription] = useState('');
    const [loading, setLoading] = useState(null);
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config`,
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
                    text: errorMessage.message || "Network Error.",
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
        router.push(`/admin/email-settings/update?id=${id}`)
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

                tableInstance = $('#emailTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    }
                });
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
            <h2 className='text-center text-2xl font-bold py-4'>Email Settings</h2>
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                <div className="overflow-x-auto p-4 bg-white main-outer-wrapper  rounded-xl shadow border border-gray-200">
                    <table className="w-full main-tables text-sm text-left text-gray-700" id="emailTable">
                        <thead className="text-xs uppercase text-gray-700">
                            <tr className="border-b border-gray-200">
                                <th className="px-6 py-3 whitespace-nowrap">SR.</th>
                                <th className="px-6 py-3 whitespace-nowrap">Panel</th>
                                <th className="px-6 py-3 whitespace-nowrap">Module</th>
                                <th className="px-6 py-3 whitespace-nowrap">Action</th>
                                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 whitespace-nowrap">Subject</th>
                                <th className="px-6 py-3 whitespace-nowrap">Body</th>
                                <th className="px-6 py-3 whitespace-nowrap">To Mails</th>
                                <th className="px-6 py-3 whitespace-nowrap">CC Mail</th>
                                <th className="px-6 py-3 whitespace-nowrap">BCC Mails</th>
                                <th className="px-6 py-3 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-left font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.panel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.module}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.action}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded text-white ${item.status === true ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {item.status ? "Active" : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.subject}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.html_template ? (
                                            <button onClick={() => handleView(item.html_template)} className="text-blue-600 hover:underline">
                                                View
                                            </button>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {parseAndRenderEmails(item.to)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.cc ? parseAndRenderEmails(item.cc) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.bcc ? parseAndRenderEmails(item.bcc) : "-"}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {
                                            canEdit && <button className="text-indigo-600 hover:underline" onClick={() => handleEdit(item.id)}>Edit</button>
                                        }
                                        
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Model */}
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
