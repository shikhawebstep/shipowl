"use client"
import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import { IoFilterSharp } from "react-icons/io5";

function DropshipperBankChange() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);

    const [dropshipperNameFilter, setDropshipperNameFilter] = useState('');
    const [accountNumberFilter, setAccountNumberFilter] = useState('');
    const [bankNameFilter, setBankNameFilter] = useState('');
    const [ifscFilter, setIfscFilter] = useState('');


    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


    const canAction = shouldCheckPermissions
        ? extractedPermissions.some(
            (perm) =>
                perm.module === "dropshipper" &&
                perm.action === "Bank Account Change Request Review" &&
                perm.status === true
        )
        : true;

    const fetchRequests = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/bank-account/change-request`,
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
                    title: "Something went wrong!",
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Network Error.",
                });
                throw new Error(
                    errorMessage.message || errorMessage.error || "Something went wrong!"
                );
            }

            const result = await response.json();
            setRequests(result?.requests || []); // update key based on API shape
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        verifyAdminAuth();
        checkAdminRole();
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (requestId, action) => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const token = adminData?.security?.token;

        try {
            // Show loading Swal
            Swal.fire({
                title: `${action === "accept" ? "Accepting" : "Rejecting"} request...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/bank-account/change-request/${requestId}/review`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: action }), // "accept" or "reject"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                Swal.fire("Error", result.message || "Failed to update status", "error");
                return;
            }

            Swal.fire("Success", result.message || `Request ${action}ed successfully`, "success");
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Action error:", error);
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && requests.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#bankTable')) {
                    $('#bankTable').DataTable().destroy();
                    $('#bankTable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#bankTable').DataTable({
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
                        $('#bankTable').empty();
                    }
                };
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [loading]);

    const handleClearFilters = () => {
        setDropshipperNameFilter('');
        setAccountNumberFilter('');
        setBankNameFilter('');
        setIfscFilter('');
        setActiveFilter(null);

        if ($.fn.DataTable.isDataTable('#bankTable')) {
            $('#bankTable').DataTable().search('').columns().search('').draw();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    if(requests.length== 0){
         return (
            <div className="flex items-center justify-center h-[80vh]">
              <p className="font-bold">No Bank Requests Found</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between my-4">
                <h2 className="text-xl font-semibold ">Bank Account Change Requests</h2>
                <button
                    onClick={handleClearFilters}
                    className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
                >
                    Clear Filters
                </button>
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
                                if ($.fn.DataTable.isDataTable('#bankTable')) {
                                    $('#bankTable').DataTable().column(activeFilter.columnIndex).search('').draw();
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
                            activeFilter.key === 'dropshipperName' ? dropshipperNameFilter :
                                activeFilter.key === 'accountNumber' ? accountNumberFilter :
                                    activeFilter.key === 'bankName' ? bankNameFilter :
                                        activeFilter.key === 'ifsc' ? ifscFilter : ''
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
                                if ($.fn.DataTable.isDataTable('#bankTable')) {
                                    $('#bankTable')
                                        .DataTable()
                                        .column(activeFilter.columnIndex)
                                        .search(
                                            activeFilter.key === 'dropshipperName' ? dropshipperNameFilter :
                                                activeFilter.key === 'accountNumber' ? accountNumberFilter :
                                                    activeFilter.key === 'bankName' ? bankNameFilter :
                                                        activeFilter.key === 'ifsc' ? ifscFilter : ''
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

            <div className="bg-white p-4 rounded-md">
                <div className="overflow-x-auto relative main-outer-wrapper w-full">
                    <table className="md:w-full w-auto display main-tables" id="bankTable">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">
                                    <button
                                        onClick={(e) =>
                                            setActiveFilter({
                                                key: 'dropshipperName',
                                                label: 'Dropshipper Name',
                                                value: dropshipperNameFilter,
                                                setValue: setDropshipperNameFilter,
                                                columnIndex: 0,
                                                position: e.currentTarget.getBoundingClientRect()
                                            })
                                        }
                                        className="flex items-center gap-2 uppercase"
                                    >
                                        Dropshipper Name <IoFilterSharp />
                                    </button>
                                </th>

                                <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">
                                    <button
                                        onClick={(e) =>
                                            setActiveFilter({
                                                key: 'accountNumber',
                                                label: 'Account Number',
                                                value: accountNumberFilter,
                                                setValue: setAccountNumberFilter,
                                                columnIndex: 1,
                                                position: e.currentTarget.getBoundingClientRect()
                                            })
                                        }
                                        className="flex items-center gap-2 uppercase"
                                    >
                                        Account Number <IoFilterSharp />
                                    </button>
                                </th>

                                <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">
                                    <button
                                        onClick={(e) =>
                                            setActiveFilter({
                                                key: 'bankName',
                                                label: 'Bank Name',
                                                value: bankNameFilter,
                                                setValue: setBankNameFilter,
                                                columnIndex: 2,
                                                position: e.currentTarget.getBoundingClientRect()
                                            })
                                        }
                                        className="flex items-center gap-2 uppercase"
                                    >
                                        Bank Name <IoFilterSharp />
                                    </button>
                                </th>

                                <th className="p-2 whitespace-nowrap pe-5 text-left uppercase relative">
                                    <button
                                        onClick={(e) =>
                                            setActiveFilter({
                                                key: 'ifsc',
                                                label: 'IFSC',
                                                value: ifscFilter,
                                                setValue: setIfscFilter,
                                                columnIndex: 3,
                                                position: e.currentTarget.getBoundingClientRect()
                                            })
                                        }
                                        className="flex items-center gap-2 uppercase"
                                    >
                                        IFSC <IoFilterSharp />
                                    </button>
                                </th>

                                <th className="p-2 whitespace-nowrap pe-5 text-left uppercase">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 bg-transparent whitespace-nowrap text-left  border-0">{req?.dropshipper?.name || req?.admin?.name || "-"}</td>
                                    <td className="p-2 bg-transparent whitespace-nowrap text-left  border-0">{req.accountNumber}</td>
                                    <td className="p-2 bg-transparent whitespace-nowrap text-left  border-0">{req.bankName}</td>
                                    <td className="p-2 bg-transparent whitespace-nowrap text-left  border-0">{req.ifscCode}</td>
                                    <td className="p-2 bg-transparent whitespace-nowrap text-center  border-0 space-x-2">
                                        <button
                                            disabled={!canAction}
                                            className="bg-green-500 text-white px-3 py-1 rounded"
                                            onClick={() => handleAction(req.id, "accept")}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            disabled={!canAction}
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                            onClick={() => handleAction(req.id, "reject")}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">
                                        No requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DropshipperBankChange;
