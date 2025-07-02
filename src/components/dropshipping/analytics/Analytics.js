"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { FaCheckCircle } from "react-icons/fa";
import { PiKeyReturnFill } from "react-icons/pi";
import { Package, TrendingUp } from "lucide-react";
import { FaCuttlefish } from "react-icons/fa";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { SiGoogleanalytics } from "react-icons/si";

import { GiProgression } from "react-icons/gi";

export default function Analytics() {
    const router = useRouter();

    const [reportAnalytics, setReportAnalytics] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);

    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split("T")[0]; // format as yyyy-mm-dd
    });

    const [toDate, setToDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });

    const formatDate = (dateStr) => new Date(dateStr).toISOString().split("T")[0];
    const [loading, setLoading] = useState(null);

    const fetchOrders = useCallback(async () => {
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
                `/api/dropshipper/order/report?from=${fromDate}&to=${toDate}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
                    },
                }
            );

            const result = await response.json();

            if (result) {
                setReportAnalytics(result.reportAnalytics || []);
                setFilteredOrders(result.orders || []);
            }

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text:
                        result.message ||
                        result.error ||
                        "Your session has expired. Please log in again.",
                });
                throw new Error(
                    result.message || result.error || "Something Wrong!"
                );
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, router]);

    useEffect(() => {
        fetchOrders();
    }, [fromDate, toDate]);

    useEffect(() => {
        if (
            typeof window !== "undefined" && filteredOrders.length > 0
        ) {
            let table = null;

            Promise.all([
                import("jquery"),
                import("datatables.net"),
                import("datatables.net-dt"),
                import("datatables.net-buttons"),
                import("datatables.net-buttons-dt"),
            ])
                .then(([jQuery]) => {
                    window.jQuery = window.$ = jQuery.default;

                    if ($.fn.DataTable.isDataTable("#orderTable")) {
                        $("#orderTable").DataTable().destroy();
                        $("#orderTable").empty();
                    }

                    const isMobile = window.innerWidth <= 768;
                    const pagingType = isMobile ? "simple" : "simple_numbers";

                    table = $("#orderTable").DataTable({
                        pagingType,
                        language: {
                            paginate: {
                                previous: "<",
                                next: ">",
                            },
                        },
                    });

                    return () => {
                        if (table) {
                            table.destroy();
                            $("#orderTable").empty();
                        }
                    };
                })
                .catch((error) => {
                    console.error("Failed to load DataTables dependencies:", error);
                });
        }
    }, [filteredOrders, loading]);

    const totalEarnings = filteredOrders.reduce((sum, order) => {
        if (order.delivered === true) {
            return sum + (order.subtotal || 0);
        }
        return sum;
    }, 0);


    const totalSupplierCut = filteredOrders.reduce((sum, order, orderIndex) => {
        if (order.delivered === true && Array.isArray(order.items)) {
            const orderSupplierCut = order.items.reduce((itemSum, item, itemIndex) => {
                const price = item.dropshipperVariant?.supplierProductVariant?.price || 0;
                const quantity = item.quantity || 1;
                return itemSum + price * quantity;
            }, 0);

            return sum + orderSupplierCut;

        }

        return sum;
    }, 0);
    const totalItems = filteredOrders.reduce((sum, order) => {
        return sum + (Array.isArray(order.items) ? order.items.length : 0);
    }, 0);
    const progressOrderCount = filteredOrders.reduce((sum, order) => {
        if (order.delivered === false && order.rtoDelivered === false && Array.isArray(order.items)) {
            const inProgressItems = order.items.length;
            return sum + inProgressItems;
        }
        return sum;
    }, 0);
    const deliveredOrderCount = filteredOrders.reduce((sum, order) => {
        if (order.delivered === true && order.rtoDelivered === false && Array.isArray(order.items)) {
            const inProgressItems = order.items.length;
            return sum + inProgressItems;
        }
        return sum;
    }, 0);
    const rtoDeliveredOrderCount = filteredOrders.reduce((sum, order) => {
        if (order.delivered === false && order.rtoDelivered === true && Array.isArray(order.items)) {
            const inProgressItems = order.items.length;
            return sum + inProgressItems;
        }
        return sum;
    }, 0);



    const finalEarnings = totalEarnings - totalSupplierCut;
    // Add profit/loss to each order
    const chartData = filteredOrders.map((order) => {
        const isDelivered = order.delivered === true;

        const supplierCut = isDelivered && Array.isArray(order.items)
            ? order.items.reduce((sum, item) => {
                const price = item.dropshipperVariant?.supplierProductVariant?.price || 0;
                const quantity = item.quantity || 1;
                return sum + price * quantity;
            }, 0)
            : 0;

        const profit = isDelivered
            ? (order.subtotal || 0) - supplierCut
            : 0;

        return {
            ...order,
            profit,
            loss: profit < 0 ? Math.abs(profit) : 0,
            profitAmount: profit > 0 ? profit : 0,
            dateLabel: new Date(order.createdAt).toISOString().split("T")[0],
        };
    });



    return (
        <div className="p-4 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex gap-3 items-center">
                <SiGoogleanalytics className="text-orange-500" /> Dropshipper Analytics
            </h1>

            {/* Date Range */}
            <div className="flex flex-wrap gap-4 mb-8 items-end">
                <div>
                    <label className="text-sm font-medium text-gray-700">From Date</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="block mt-1 px-3 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">To Date</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="block mt-1 px-3 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Earnings */}
            <div className="grid lg:grid-cols-6 md:grid-cols-3 mb-8 gap-3">
                <div className=" bg-white p-4 rounded-2xl shadow-md transition hover:shadow-lg">
                    <h2 className="text-lmd flex gap-3 items-center font-semibold text-gray-700 mb-2">
                        <TrendingUp />  Total Earnings
                    </h2>
                    <p className="text-2xl  text-green-600 font-bold">
                        ₹{totalEarnings.toFixed(2)}
                    </p>
                </div>
                <div className=" bg-white p-4 rounded-2xl shadow-md transition hover:shadow-lg">
                    <h2 className="text-lmd flex gap-3 items-center font-semibold text-gray-700 mb-2">
                        <FaCuttlefish />  Total Supplier Cut
                    </h2>
                    <p className="text-2xl  text-green-600 font-bold">
                        ₹{totalSupplierCut.toFixed(2)}
                    </p>
                </div>
                <div className=" bg-white p-4 rounded-2xl shadow-md transition hover:shadow-lg">
                    <h2 className="text-lmd flex gap-3 items-center font-semibold text-gray-700 mb-2">
                        <TrendingUp />   Final Earnings
                    </h2>
                    <p className={`text-2xl  font-bold ${finalEarnings > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ₹{Math.abs(finalEarnings)}
                    </p>
                </div>

                {/* Progress */}
                <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all">
                    <h2 className="text-lmd font-semibold text-gray-700 mb-1 flex gap-2 items-center"><GiProgression className={` ${progressOrderCount > 0 ? 'text-yellow-500' : 'text-red-500'}`} /> In Progress</h2>
                    <p className="text-sm text-gray-500 mb-2">Orders not yet delivered or RTO delivered</p>
                    <p className={`text-2xl font-bold ${progressOrderCount > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {progressOrderCount}{" "}
                        <span className="text-base text-gray-600 font-medium">
                            ({totalItems > 0 ? ((progressOrderCount / totalItems) * 100).toFixed(2) : 0}%)
                        </span>
                    </p>
                </div>

                {/* Delivered */}
                <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all">
                    <h2 className="text-lmd font-semibold text-gray-700 mb-1 flex gap-2 items-center "><FaCheckCircle className={`${deliveredOrderCount > 0 ? 'text-green-600' : 'text-red-500'}`} /> Delivered</h2>
                    <p className="text-sm text-gray-500 mb-2">Orders successfully delivered</p>
                    <p className={`text-2xl font-bold ${deliveredOrderCount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {deliveredOrderCount}{" "}
                        <span className="text-base text-gray-600 font-medium">
                            ({totalItems > 0 ? ((deliveredOrderCount / totalItems) * 100).toFixed(2) : 0}%)
                        </span>
                    </p>
                </div>

                {/* RTO Delivered */}
                <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all">
                    <h2 className="text-lmd font-semibold text-gray-700 mb-1 flex gap-2 items-center"><PiKeyReturnFill className={`${rtoDeliveredOrderCount > 0 ? 'text-blue-600' : 'text-red-500'}`} /> RTO Delivered</h2>
                    <p className="text-sm text-gray-500 mb-2">Orders returned to origin and delivered</p>
                    <p className={`text-2xl font-bold ${rtoDeliveredOrderCount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {rtoDeliveredOrderCount}{" "}
                        <span className="text-base text-gray-600 font-medium">
                            ({totalItems > 0 ? ((rtoDeliveredOrderCount / totalItems) * 100).toFixed(2) : 0} %)
                        </span>
                    </p>
                </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Table */}
                <div className="bg-white p-4 rounded-2xl shadow-md transition main-outer-wrapper hover:shadow-lg overflow-auto">
                    <h2 className="text-lmd flex gap-3 items-center font-bold text-gray-700 mb-4">
                        <Package className="text-orange-500" />  Order Overview
                    </h2>
                    {
                        filteredOrders.length > 0 ? (
                            <table
                                className="min-w-full text-sm display main-tables"
                                id="orderTable"
                            >
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-[#E9EDF7]">
                                        <th className="p-2 text-left whitespace-nowrap">Order ID</th>
                                        <th className="p-2 text-left whitespace-nowrap">Date</th>
                                        <th className="p-2 text-left whitespace-nowrap">Status</th>
                                        <th className="p-2 text-left whitespace-nowrap">SubTotal</th>
                                        <th className="p-2 text-left whitespace-nowrap">Supplier Cut</th>
                                        <th className="p-2 text-left whitespace-nowrap">Tax</th>
                                        <th className="p-2 text-left whitespace-nowrap">Total Amount</th>
                                        <th className="p-2 text-center whitespace-nowrap">Profit / Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const isDelivered = order.delivered === true;

                                        // Calculate supplier cut for this order
                                        const supplierCut = Array.isArray(order.items)
                                            ? order.items.reduce((sum, item) => {
                                                const price = item.dropshipperVariant?.supplierProductVariant?.price || 0;
                                                const quantity = item.quantity || 1;
                                                return sum + price * quantity;
                                            }, 0)
                                            : 0;

                                        // Earnings = order subtotal - supplier cost
                                        const finalEarnings = isDelivered
                                            ? (order.subtotal || 0) - supplierCut
                                            : 0;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="border-b border-[#E9EDF7] text-gray-700 hover:bg-blue-50 transition"
                                            >
                                                <td className="p-2 whitespace-nowrap font-medium">{order.orderNumber}</td>
                                                <td className="p-2 whitespace-nowrap text-left">{new Date(order.createdAt).toISOString().split("T")[0]}</td>
                                                <td className="p-2 whitespace-nowrap capitalize">{order.status}</td>
                                                <td className="p-2 whitespace-nowrap">₹{order.subtotal}</td>
                                                <td className="p-2 whitespace-nowrap">₹{supplierCut}</td>
                                                <td className="p-2 whitespace-nowrap">₹{order.tax}</td>
                                                <td className="p-2 whitespace-nowrap">₹{order.totalAmount}</td>
                                                <td
                                                    className={`p-2 whitespace-nowrap text-center font-semibold ${finalEarnings >= 0 ? "text-green-600" : "text-red-500"
                                                        }`}
                                                >
                                                    ₹{Math.abs(finalEarnings)}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                </tbody>
                            </table>

                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm border border-dashed rounded-md">
                                No data available
                            </div>
                        )
                    }
                </div>

                {/* Chart */}
                <div className="bg-white p-4 rounded-2xl flex items-center flex-wrap shadow-md transition hover:shadow-lg w-full">
                    <h2 className="text-lmd flex gap-3 items-center mb-6 font-bold text-gray-700">
                        <TrendingUp className="text-orange-500" /> Profit & Loss Trend
                    </h2>

                    <div className="w-full">
                        {chartData?.length > 0 &&
                            chartData.some((d) => d.profitAmount || d.loss) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} barCategoryGap="80%">
                                    <XAxis
                                        dataKey="dateLabel"
                                        stroke="#000"
                                        tick={{ fill: "#000", fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#000"
                                        tick={{ fill: "#000", fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            borderRadius: "8px",
                                            border: "1px solid #e5e7eb",
                                        }}
                                        labelStyle={{ fontWeight: "600", color: "#000000" }}
                                        itemStyle={{ color: "#000000" }}
                                        cursor={{ fill: "transparent" }}
                                    />

                                    <Bar
                                        dataKey="profitAmount"
                                        name="Profit"
                                        stackId="a"
                                        fill="#6AD2FF"
                                        radius={[8, 8, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="loss"
                                        name="Loss"
                                        stackId="a"
                                        fill="#F87171"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm border border-dashed rounded-md">
                                No data available
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
