"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HashLoader from "react-spinners/HashLoader";
import { IoFilterSharp } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import 'datatables.net-dt/css/dataTables.dataTables.css';

const STATUS_LIST = [
    "Cancelled", "Shipped", "Pending", "Damaged", "Delivered", "Progress", "In Transit", "Lost", "Not Serviceable",
    "Order Placed", "Out for Delivery", "Picked Up", "Pickup Cancelled", "Confirmed",
    "Pickup Pending", "Pickup Scheduled", "RTO Delivered", "RTO Failed", "RTO In Transit"
];
function Reporting() {
    const router = useRouter();
    const [showShipmentDetailsFilter, setShowShipmentDetailsFilter] = useState(false);
    const [showCustomerFilter, setShowCustomerFilter] = useState(false);
    const [showPaymentFilter, setShowPaymentFilter] = useState(false);
    const [selected, setSelected] = useState('');
    const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([]);
    const togglePaymentStatus = (status) => {
        setSelectedPaymentStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };

    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const filteredStatusList = STATUS_LIST.filter((status) =>
        status.toLowerCase().includes(search.toLowerCase())
    );

    const toggleStatus = (status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };
    const [showFilter, setShowFilter] = useState(false);
    const [showStatus, setShowStatus] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [filterOptions, setFilterOptions] = useState([]); // dropdown if needed

    const [selectedVariants, setSelectedVariants] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleViewVariants = (items) => {
        const variants = items.map(item => item.variant?.supplierProductVariant?.variant).filter(Boolean);
        setSelectedVariants(variants);
        setShowModal(true);
    };
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reporting, setReporting] = useState([]);

    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d;
    });

    const [toDate, setToDate] = useState(new Date());

    const formatDate = (date) => date.toISOString().split("T")[0];

    const fetchReporting = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/order/report?from=${formatDate(
                    fromDate
                )}&to=${formatDate(toDate)}`,
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
                    title: "Something went wrong!",
                    text:
                        errorMessage.error ||
                        errorMessage.message ||
                        "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message || errorMessage.error);
            }

            const result = await response.json();
            setReporting(result?.reportAnalytics || []);
            setOrders(result?.orders || []);
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [router, fromDate, toDate]);
    useEffect(() => {
        if (typeof window !== 'undefined' && orders.length > 0 && !loading) {
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
                if ($.fn.DataTable.isDataTable('#orderTable')) {
                    $('#orderTable').DataTable().destroy();
                    $('#orderTable').empty();
                }

                // Reinitialize DataTable with new data
                const isMobile = window.innerWidth <= 768;
                const pagingType = isMobile ? 'simple' : 'simple_numbers';

                table = $('#orderTable').DataTable({
                    pagingType,
                    language: {
                        paginate: {
                            previous: "<",
                            next: ">"
                        }
                    }
                });
            }).catch((error) => {
                console.error('Failed to load DataTables dependencies:', error);
            });
        }
    }, [orders, loading]);

    useEffect(() => {
        fetchReporting();
    }, [fetchReporting]);

    return (
        <div className="p-6 bg-white rounded-xl">
            <h2 className="text-3xl font-bold py-5 text-center">Reporting Page</h2>
            {/* Date Filters */}
            <div className="flex flex-wrap items-end gap-4 mb-6">
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">From Date</label>
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => setFromDate(date)}
                        maxDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        className="border border-gray-200 rounded px-3 py-2 w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">To Date</label>
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => setToDate(date)}
                        maxDate={new Date()}
                        minDate={fromDate}
                        dateFormat="yyyy-MM-dd"
                        className="border border-gray-200 rounded px-3 py-2 w-full"
                    />
                </div>
                <button
                    onClick={fetchReporting}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                    Search
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <HashLoader color="orange" />
                </div>
            ) : (
                (reporting?.shipowl || reporting?.selfship) ? (
                    <>
                        <div className="overflow-x-auto p-4 bg-white rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] border border-gray-200">

                            <table className="rounded-md border-[#DFEAF2] w-full text-sm text-left text-gray-700">
                                <thead className="text-xs uppercase text-gray-700">
                                    <tr className="border-b border-[#DFEAF2]">
                                        <th className="px-6 py-3 whitespace-nowrap">Shipping Method</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Order Count</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Total Product Cost</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Total COD Collected</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Total Shipping Cost</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Total Deduction</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Remittance to Dropshipper</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Delivered Orders</th>
                                        <th className="px-6 py-3 whitespace-nowrap">RTO Orders</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Shipowl Row */}
                                    <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Shipowl</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.shipowl?.orderCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.shipowl?.totalProductCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.shipowl?.totalCODCollected}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.shipowl?.totalShippingCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.shipowl?.totalDeduction}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.shipowl?.remittanceToDropshipper}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.shipowl?.deliveredOrder}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.shipowl?.rtoOrder}</td>
                                    </tr>

                                    {/* Selfship - Prepaid */}
                                    <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Selfship - Prepaid</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.prepaid?.orderCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.prepaid?.totalProductCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.prepaid?.totalCODCollected}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.prepaid?.totalShippingCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.prepaid?.totalDeduction}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.prepaid?.remittanceToDropshipper}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.prepaid?.deliveredOrder}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.prepaid?.rtoOrder}</td>
                                    </tr>

                                    {/* Selfship - Postpaid */}
                                    <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Selfship - Postpaid</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.postpaid?.orderCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.postpaid?.totalProductCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.postpaid?.totalCODCollected}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.postpaid?.totalShippingCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.postpaid?.totalDeduction}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{reporting.selfship?.postpaid?.remittanceToDropshipper}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.postpaid?.deliveredOrder}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{reporting.selfship?.postpaid?.rtoOrder}</td>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                        <h2 className="text-xl font-bold pt-5 text-center">Orders Details</h2>
                        <div className="overflow-x-auto main-outer-wrapper p-4 mt-5 bg-white rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] border border-gray-200">

                            <table className="md:w-full w-auto display main-tables" id="orderTable">
                                <thead>
                                    <tr className="text-[#A3AED0] uppercase border-b border-[#E9EDF7]">
                                        <th className="p-3 px-5 whitespace-nowrap">SR.</th>

                                        <th className="p-3 px-5 whitespace-nowrap overflow-visible relative" >
                                            <button onClick={() => {
                                                setShowFilter(!showFilter);
                                                setShowStatus(false);
                                                setShowCustomerFilter(false);
                                                setShowPaymentFilter(false);
                                                setShowShipmentDetailsFilter(false)
                                            }} className='flex gap-2 uppercase items-center'> Order Details <IoFilterSharp className="w-4 h-4" /></button>
                                            {showFilter && (
                                                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4">
                                                    {/* Header */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-medium text-gray-700">Order ID:</label>
                                                        <button
                                                            onClick={() => {
                                                                setOrderId('');

                                                            }}
                                                            className="text-green-600 text-xs hover:underline"
                                                        >
                                                            Reset All
                                                        </button>
                                                    </div>

                                                    {/* Input Search */}
                                                    <input
                                                        type="text"
                                                        value={orderId}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setOrderId(value);

                                                        }}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring focus:ring-green-500"
                                                        placeholder="Enter order ID"
                                                    />

                                                    {/* Optional Dropdown Filter */}
                                                    <div className="mt-4">
                                                        <label className="text-sm font-medium text-gray-700">Filter:</label>
                                                        {filterOptions.length === 0 ? (
                                                            <p className="text-xs text-gray-400 mt-1">No items found</p>
                                                        ) : (
                                                            <select className="w-full mt-1 px-2 py-2 text-sm border rounded-md">
                                                                {filterOptions.map((opt) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>

                                                    {/* Apply Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                window.$('#orderTable').DataTable().search(orderId).draw();
                                                            }
                                                            setShowFilter(false);
                                                            setShowStatus(false);
                                                        }}
                                                        className="mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            )}

                                        </th>
                                        <th className="p-3 px-5 whitespace-nowrap relative uppercase">
                                            <button onClick={() => {
                                                setShowStatus(!showStatus);
                                                setShowFilter(false);
                                                setShowCustomerFilter(false);
                                                setShowPaymentFilter(false);
                                                setShowShipmentDetailsFilter(false)
                                            }} className='flex gap-2 uppercase items-center'> Shipment Status <IoFilterSharp className="w-4 h-4" /></button>

                                            {showStatus && (
                                                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4">
                                                    <h3 className="font-medium text-gray-700 mb-2">Filter by Status:</h3>

                                                    <input
                                                        type="text"
                                                        placeholder="Search"
                                                        className="w-full mb-2 px-3 py-1 border border-gray-300 rounded text-sm"
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                    />

                                                    <div className="h-60 overflow-y-auto border border-gray-200 rounded p-2">
                                                        {filteredStatusList.map((status) => (
                                                            <label key={status} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedStatuses.includes(status)}
                                                                    onChange={() => toggleStatus(status)}
                                                                    className="h-4 w-4"
                                                                />
                                                                {status}
                                                            </label>
                                                        ))}
                                                        {filteredStatusList.length === 0 && (
                                                            <p className="text-gray-400 text-sm mt-2">No items found</p>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex justify-between items-center gap-2">
                                                        {/* Reset All */}
                                                        <button
                                                            onClick={() => {
                                                                setSearch("");
                                                                setSelectedStatuses([]);
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().column(2).search('').draw();
                                                                }
                                                            }}
                                                            className="text-green-600 text-sm hover:underline"
                                                        >
                                                            Reset All
                                                        </button>

                                                        {/* Clear only checkboxes */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStatuses([]);
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().column(2).search('').draw();
                                                                }
                                                            }}
                                                            className="text-gray-600 text-sm hover:underline"
                                                        >
                                                            Clear
                                                        </button>

                                                        {/* Apply */}
                                                        <button
                                                            className={`px-4 py-1 rounded text-white text-sm ${selectedStatuses.length
                                                                ? "bg-green-600 hover:bg-green-700"
                                                                : "bg-gray-300 cursor-not-allowed"
                                                                }`}
                                                            onClick={() => {
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    const regex = selectedStatuses.join('|');
                                                                    window.$('#orderTable').DataTable().column(2).search(regex, true, false).draw();
                                                                }
                                                                setShowStatus(false);
                                                                setShowFilter(false);
                                                            }}
                                                            disabled={!selectedStatuses.length}
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}


                                        </th>


                                        <th className="p-3 px-5 whitespace-nowrap relative">
                                            <button
                                                onClick={() => {
                                                    setShowCustomerFilter(!showCustomerFilter);
                                                    setShowShipmentDetailsFilter(false);
                                                    setShowStatus(false);
                                                    setShowPaymentFilter(false);
                                                    setShowFilter(false);
                                                }}
                                                className="flex gap-2 uppercase items-center"
                                            >
                                                Customer Info <IoFilterSharp className="w-4 h-4" />
                                            </button>
                                            {showCustomerFilter && (
                                                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4">
                                                    <h3 className="font-medium text-gray-700 mb-2">Filter by Customer:</h3>

                                                    <input
                                                        type="text"
                                                        value={orderId}
                                                        onChange={(e) => setOrderId(e.target.value)}
                                                        placeholder="Name, Phone, or Email..."
                                                        className="w-full px-3 py-1 mb-2 border border-gray-300 rounded text-sm"
                                                    />

                                                    <div className="flex justify-between items-center gap-2">
                                                        <button
                                                            className={`flex-1 px-4 py-1 rounded text-white text-sm ${orderId ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
                                                                }`}
                                                            onClick={() => {
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().search(orderId).draw();
                                                                }
                                                                setShowCustomerFilter(false);
                                                                setOrderId('');
                                                            }}
                                                            disabled={!orderId}
                                                        >
                                                            Apply
                                                        </button>

                                                        <button
                                                            className="flex-1 px-4 py-1 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-100"
                                                            onClick={() => {
                                                                setOrderId('');
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().search('').draw();
                                                                }
                                                            }}
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            )}


                                        </th>


                                        <th className="p-3 px-5 whitespace-nowrap relative">
                                            <button
                                                onClick={() => {
                                                    setShowPaymentFilter(!showPaymentFilter);
                                                    setShowCustomerFilter(false);
                                                    setShowShipmentDetailsFilter(false);
                                                    setShowStatus(false);
                                                    setShowFilter(false);
                                                }}
                                                className="flex gap-2 uppercase items-center"
                                            >
                                                Payment Details <IoFilterSharp className="w-4 h-4" />
                                            </button>
                                            {showPaymentFilter && (
                                                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4">
                                                    <h3 className="font-medium text-gray-700 mb-2">Filter by Payment:</h3>

                                                    {/* Transaction ID input */}
                                                    <input
                                                        type="text"
                                                        value={orderId}
                                                        onChange={(e) => setOrderId(e.target.value)}
                                                        placeholder="Transaction ID..."
                                                        className="w-full px-3 py-1 mb-2 border border-gray-300 rounded text-sm"
                                                    />

                                                    {/* Payment Status checkboxes */}
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                                                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-700">
                                                            {["failed", "success", "pending"].map((status) => (
                                                                <label key={status} className="flex items-center gap-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedPaymentStatuses.includes(status)}
                                                                        onChange={() => togglePaymentStatus(status)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    {status}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Buttons */}
                                                    <div className="flex justify-between items-center mt-4 gap-2">
                                                        <button
                                                            className={`flex-1 px-4 py-1 rounded text-white text-sm ${orderId || selectedPaymentStatuses.length
                                                                ? "bg-green-600 hover:bg-green-700"
                                                                : "bg-gray-300 cursor-not-allowed"
                                                                }`}
                                                            onClick={() => {
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().search(orderId).draw();
                                                                    const regex = selectedPaymentStatuses.join('|');
                                                                    window.$('#orderTable').DataTable().column(4).search(regex, true, false).draw();
                                                                }
                                                                setShowPaymentFilter(false);
                                                                setShowFilter(false);
                                                            }}
                                                            disabled={!orderId && selectedPaymentStatuses.length === 0}
                                                        >
                                                            Apply
                                                        </button>

                                                        <button
                                                            className="flex-1 px-4 py-1 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-100"
                                                            onClick={() => {
                                                                setOrderId('');
                                                                setSelectedPaymentStatuses([]);
                                                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                    window.$('#orderTable').DataTable().search('').draw();
                                                                    window.$('#orderTable').DataTable().column(4).search('').draw();
                                                                }
                                                            }}
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                        </th>
                                        <th className="p-3 px-5 whitespace-nowrap relative">
                                            <button
                                                onClick={() => {
                                                    setShowShipmentDetailsFilter(!showShipmentDetailsFilter);
                                                    setShowCustomerFilter(false);
                                                    setShowPaymentFilter(false);
                                                    setShowStatus(false);
                                                    setShowFilter(false);
                                                }}
                                                className="flex gap-2 uppercase items-center"
                                            >
                                                Shipment Details <IoFilterSharp className="w-4 h-4" />
                                            </button>
                                            {showShipmentDetailsFilter && (
                                                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4">
                                                    <h3 className="font-medium text-gray-700 mb-2">Filter by Shipment:</h3>
                                                    <input
                                                        type="text"
                                                        placeholder="AWB number..."
                                                        value={orderId}
                                                        onChange={(e) => {
                                                            setOrderId(e.target.value);

                                                        }}
                                                        className="w-full px-3 py-1 mb-2 border border-gray-300 rounded text-sm"
                                                    />
                                                    <button
                                                        className="mt-2 block px-4 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700"
                                                        onClick={() => {
                                                            if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                                                window.$('#orderTable').DataTable().search(orderId).draw();
                                                            }
                                                            setOrderId('');
                                                            setShowShipmentDetailsFilter(false);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            )}

                                        </th>

                                        <th className="p-3 px-5 whitespace-nowrap">Return Tracking #</th>
                                        <th className="p-3 px-5 whitespace-nowrap">delivered Status</th>
                                        <th className="p-3 px-5 whitespace-nowrap">delivered Date</th>
                                        <th className="p-3 px-5 whitespace-nowrap">Total</th>

                                        <th className="p-3 px-5 whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    {orders.map((order, index) => {

                                        return (
                                            <tr key={order.id} className="text-[#364e91] font-semibold border-b border-[#E9EDF7] align-top">
                                                {/* Order ID */}
                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    <div className="flex items-center">

                                                        <label className="flex items-center cursor-pointer mr-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.includes(order.id)}
                                                                onChange={() => handleCheckboxChange(order.id)}
                                                                className="peer hidden"
                                                            />
                                                            <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                                <FaCheck className="peer-checked:block text-white w-3 h-3" />
                                                            </div>
                                                        </label>

                                                        {index + 1}</div></td>

                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    {order.orderNumber}
                                                    <span className="block">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</span>
                                                </td>
                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    {order.status}

                                                </td>


                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    {order.shippingName}
                                                    <br />
                                                    <span className="text-sm block">
                                                        {order.shippingPhone}
                                                    </span>
                                                    <span className="text-sm text-[#01b574]">
                                                        {order.shippingEmail}
                                                    </span>
                                                </td>

                                                <td className="p-3 px-5 whitespace-nowrap font-semibold">

                                                    <p>Method: <span className="font-bold">{order.shippingApiResult?.data?.payment_mode || "-"}</span></p>


                                                    <p>Transaction Id: <span className="font-bold">{order.payment?.transactionId || "-"}</span></p>


                                                    <p>Amount: <span className="font-bold">{order.payment?.amount || "-"}</span></p>


                                                    <p>
                                                        <span className={`font-bold uppercase ${order.payment?.status === "failed"
                                                            ? "text-red-500"
                                                            : order.payment?.status === "pending"
                                                                ? "text-yellow-500"
                                                                : "text-green-500"
                                                            }`}>
                                                            {order.payment?.status || "-"}
                                                        </span>
                                                    </p>

                                                </td>

                                                <td className="p-3 px-5 whitespace-nowrap">

                                                    {order.shippingApiResult?.data?.order_number || "-"}

                                                    <br />
                                                    {order.shippingAddress || "-"}

                                                    <br />
                                                    <span className="text-green-500">
                                                        {order.shippingPhone || "-"}

                                                    </span>
                                                    <br />
                                                    {order.shippingApiResult?.data?.awb_number || "-"}

                                                </td>

                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    {order.items
                                                        .map((item) => (
                                                            item.supplierRTOResponse?.trackingNumber || "-"

                                                        ))
                                                        .reduce((prev, curr) => [prev, ", ", curr])}
                                                </td>
                                                <td className="p-3 px-5 whitespace-nowrap capitalize">
                                                    {order.delivered ? (
                                                        <span className="text-green-600">Delivered</span>
                                                    ) : order.rtoDelivered ? (
                                                        <span className="text-orange-500">RTO Delivered</span>
                                                    ) : (
                                                        <span className="text-red-500">Pending</span>
                                                    )}

                                                </td>

                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    {order.deliveredDate ? (
                                                        <span>{new Date(order.deliveredDate).toLocaleDateString()}</span>
                                                    ) : order.rtoDeliveredDate ? (
                                                        <span>{new Date(order.rtoDeliveredDate).toLocaleDateString()}</span>
                                                    ) : (
                                                        <span className="text-red-500">Pending</span>
                                                    )}

                                                </td>
                                                <td className="p-3 px-5 whitespace-nowrap">
                                                    ₹{order.totalAmount}
                                                </td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleViewVariants(order.items)}
                                                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                                                    >
                                                        View Variants
                                                    </button>
                                                </td>

                                            </tr>
                                        )


                                    })}
                                </tbody>
                            </table>



                            {/* Model */}
                            {showModal && (
                                <div className="fixed inset-0 flex items-center justify-center bg-[#000000ba] bg-opacity-50 z-50">
                                    <div className="bg-white w-full max-w-3xl border-2 border-orange-500 p-6 rounded-md shadow-lg relative">
                                        <button
                                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                                            onClick={() => setShowModal(false)}
                                        >
                                            ✕
                                        </button>
                                        <h2 className="text-xl font-semibold mb-4">Product Variants</h2>
                                        {
                                            selectedVariants.length > 0 ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4">
                                                    {selectedVariants.map((variant, idx) => (
                                                        <div key={idx} className="border hover:border-orange-400 border-[#DFEAF2] p-4 rounded-md shadow-sm">
                                                            <div className="flex gap-2 mb-2 overflow-x-auto">
                                                                {(variant.image || '')
                                                                    .split(',')
                                                                    .filter((img) => img.trim() !== '')
                                                                    .map((imgUrl, imgIdx) => (
                                                                        <img
                                                                            key={imgIdx}
                                                                            src={imgUrl.trim()}
                                                                            alt={`Variant ${idx} `}
                                                                            className="h-24 w-24 object-cover rounded border border-[#DFEAF2]"
                                                                        />
                                                                    ))}
                                                            </div>
                                                            <p><strong>Name:</strong> {variant.name}</p>
                                                            <p><strong>Color:</strong> {variant.color}</p>
                                                            <p><strong>Model:</strong> {variant.model}</p>
                                                            <p><strong>SKU:</strong> {variant.sku}</p>
                                                            <p><strong>Suggested Price:</strong> ₹{variant.suggested_price}</p>
                                                        </div>
                                                    ))}

                                                </div>

                                            ) : (
                                                <p className="text-center">No Variants Found</p>
                                            )
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500">No Orders Found</p>
                )
            )}


        </div>
    );
}

export default Reporting;
