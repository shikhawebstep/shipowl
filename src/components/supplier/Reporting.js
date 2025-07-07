"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HashLoader from "react-spinners/HashLoader";
function Reporting() {
  const router = useRouter();

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
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/order/report?from=${formatDate(
          fromDate
        )}&to=${formatDate(toDate)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${suppliertoken}`,
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

              <table className="rounded-md  border-[#DFEAF2]  w-full text-sm text-left text-gray-700">
                <thead className="text-xs uppercase  text-gray-700">
                  <tr className="border-b border-[#DFEAF2]">
                    <th className="px-6 py-3">Shipping Method</th>
                    <th className="px-6 py-3">Order Count</th>
                    <th className="px-6 py-3">Total Product Cost</th>
                    <th className="px-6 py-3">Delivered Orders</th>
                    <th className="px-6 py-3">RTO Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Shipowl Row */}
                  <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Shipowl</td>
                    <td className="px-6 py-4">{reporting.shipowl?.orderCount}</td>
                    <td className="px-6 py-4">₹{reporting.shipowl?.totalProductCost}</td>
                    <td className="px-6 py-4">{reporting.shipowl?.deliveredOrder}</td>
                    <td className="px-6 py-4">{reporting.shipowl?.rtoOrder}</td>
                  </tr>

                  {/* Selfship - Prepaid */}
                  <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Selfship - Prepaid</td>
                    <td className="px-6 py-4">{reporting.selfship?.prepaid?.orderCount}</td>
                    <td className="px-6 py-4">₹{reporting.selfship?.prepaid?.totalProductCost}</td>
                    <td className="px-6 py-4">{reporting.selfship?.prepaid?.deliveredOrder}</td>
                    <td className="px-6 py-4">{reporting.selfship?.prepaid?.rtoOrder}</td>
                  </tr>

                  {/* Selfship - Postpaid */}
                  <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Selfship - Postpaid</td>
                    <td className="px-6 py-4">{reporting.selfship?.postpaid?.orderCount}</td>
                    <td className="px-6 py-4">₹{reporting.selfship?.postpaid?.totalProductCost}</td>
                    <td className="px-6 py-4">{reporting.selfship?.postpaid?.deliveredOrder}</td>
                    <td className="px-6 py-4">{reporting.selfship?.postpaid?.rtoOrder}</td>
                  </tr>
                </tbody>
              </table>
            </div>
           
          </>

        ) : (
          <p className="text-center text-gray-500">No Orders Found</p>
        )
      )}

    </div >
  );
}

export default Reporting;
