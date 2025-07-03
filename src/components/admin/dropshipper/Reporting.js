"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HashLoader from "react-spinners/HashLoader";
function Reporting() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reporting, setReporting] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleViewVariants = (items) => {
        const variants = items.map(item => item.variant?.supplierProductVariant?.variant).filter(Boolean);
        setSelectedVariants(variants);
        setShowModal(true);
    };

    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d;
    });

    const [toDate, setToDate] = useState(new Date());

    const formatDate = (date) => date.toISOString().split("T")[0];

    const fetchReporting = useCallback(async () => {
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
                `/api/admin/dropshipper/${id}/payment-report?from=${formatDate(
                    fromDate
                )}&to=${formatDate(toDate)}`,
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
    }, [router, id, fromDate, toDate]);

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
                        <h2 className="text-2xl font-bold pt-5 text-center">Orders Details</h2>
                        {orders.length > 0 ? (
                            <div className="overflow-x-auto p-4 mt-5 bg-white rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] border border-gray-200">

                                <table className="min-w-full ">
                                    <thead className="uppercase text-gray-700">
                                        <tr className=" border-b border-[#DFEAF2]">
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Order #</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Customer</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Total (INR)</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Tax</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Payment Transaction Id</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Payment Status</th>
                                            <th className="px-4 py-2 text-left text-sm whitespace-nowrap font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y  bg-white">
                                        {orders.map((order) => (
                                            <tr key={order.id} className=" border-b border-[#DFEAF2]">
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800">{order.orderNumber}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-yellow-600 capitalize">{order.status}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800">{order.shippingName}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800">₹{order.totalAmount}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800">₹{order.tax}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800 text-center">{order.payment?.transactionId}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800 text-center">{order.payment?.status}</td>
                                                <td className="px-4 py-2 text-sm whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleViewVariants(order.items)}
                                                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                                                    >
                                                        View Variants
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                           <p className="text-center text-gray-500 p-5">No Orders Found</p>
                        )
                        }
                    </>
                ) : (
                    <p className="text-center text-gray-500">No Orders Found</p>
                )
            )}


        </div>
    );
}

export default Reporting;
