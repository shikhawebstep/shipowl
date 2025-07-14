"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HashLoader from "react-spinners/HashLoader";
import { useImageURL } from "@/components/ImageURLContext";

function Reporting() {
  const { fetchImages } = useImageURL();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleViewVariants = (items) => {
    const variants = items.map(item => item.dropshipperVariant?.supplierProductVariant?.variant).filter(Boolean);
    setSelectedVariants(variants);
    setShowModal(true);
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState([]);

  const [permission, setPermission] = useState([]);

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${id}/payment-report?from=${formatDate(
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
            "Network Error.",
        });
        throw new Error(errorMessage.message || errorMessage.error);
      }

      const result = await response.json();
      setReporting(result?.reportAnalytics || []);
      setOrders(result?.orders || []);
      if (result.staffPermissionApplied == true) {
        setPermission(result?.assignedPermissions || []);

      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id, fromDate, toDate]);

  const permissionMap = permission.reduce((acc, item) => {
    const key = `${item.permission.module}.${item.permission.action}`;
    acc[key] = item.permission.status;
    return acc;
  }, {});
  const PermissionField = ({ permissionKey, children }) => {
    const isAllowed = permissionMap[permissionKey];
    return (
      <span
        style={
          isAllowed
            ? {}
            : {
              filter: "blur(3px)",
              opacity: 0.5,
              userSelect: "none",
              pointerEvents: "none",
            }
        }
      >
        {isAllowed ? children : ' '}
      </span>
    );
  };
  const hasPermission = (key) => permissionMap?.[key];
  const hasAnyPermission = (...keys) => keys.some((key) => permissionMap?.[key]); useEffect(() => {
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
                    <td className="px-6 py-4 text-center">{reporting.shipowl?.rtoOrder}</td>
                  </tr>

                  {/* Selfship - Prepaid */}
                  <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Selfship - Prepaid</td>
                    <td className="px-6 py-4">{reporting.selfship?.prepaid?.orderCount}</td>
                    <td className="px-6 py-4">₹{reporting.selfship?.prepaid?.totalProductCost}</td>
                    <td className="px-6 py-4">{reporting.selfship?.prepaid?.deliveredOrder}</td>
                    <td className="px-6 py-4 text-center">{reporting.selfship?.prepaid?.rtoOrder}</td>
                  </tr>

                  {/* Selfship - Postpaid */}
                  <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Selfship - Postpaid</td>
                    <td className="px-6 py-4">{reporting.selfship?.postpaid?.orderCount}</td>
                    <td className="px-6 py-4">₹{reporting.selfship?.postpaid?.totalProductCost}</td>
                    <td className="px-6 py-4">{reporting.selfship?.postpaid?.deliveredOrder}</td>
                    <td className="px-6 py-4 text-center">{reporting.selfship?.postpaid?.rtoOrder}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h2 className="text-xl font-bold pt-5 text-center">Orders Details</h2>
            <div className="overflow-x-auto p-4 mt-5 bg-white rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] border border-gray-200">
              {
                orders.length > 0 ? (

                  <table className="min-w-full">
                    <thead className="uppercase text-gray-700">
                      <tr className="border-b border-[#DFEAF2] text-left">
                        <th className="p-3 px-5 whitespace-nowrap">SR.</th>
                        <th className="p-3 px-5 whitespace-nowrap">Order #</th>

                        {hasAnyPermission(
                          "order-variables.shippingName",
                          "order-variables.shippingPhone",
                          "order-variables.shippingEmail"
                        ) && <th className="p-3 px-5 whitespace-nowrap">Customer Information</th>}

                        {hasAnyPermission(
                          "order-variables.payment_mode",
                          "order-variables.transactionId",
                          "order-variables.amount",
                          "order-variables.status"
                        ) && (
                            <th className="p-3 px-5 whitespace-nowrap">Payment</th>
                          )}
                        {hasAnyPermission(
                          "order-variables.order_number",
                          "order-variables.shippingPhone",
                          "order-variables.shippingAddress",
                          "order-variables.awb_number",
                        ) && <th className="p-3 px-5 whitespace-nowrap">Shipment Details</th>}

                        {hasPermission("order-variables.trackingNumber ") && (
                          <th className="p-3 px-5 whitespace-nowrap">Return Tracking #</th>
                        )}

                        {hasPermission("order-variables.rtoDelivered", "order-variables.delivered") && (
                          <>
                            <th className="p-3 px-5 whitespace-nowrap">Status</th>
                          </>
                        )}
                        {hasPermission("order-variables.rtoDeliveredDate", "order-variables.deliveredDate") && (
                          <>
                            <th className="p-3 px-5 whitespace-nowrap">Date</th>
                          </>
                        )}

                        <th className="p-3 px-5 whitespace-nowrap">Item Count</th>

                        {hasPermission("order-variables.totalAmount") && (
                          <th className="p-3 px-5 whitespace-nowrap">Total</th>
                        )}



                        <th className="px-4 py-2 text-center text-sm whitespace-nowrap font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y bg-white">
                      {orders.map((order, index) => (
                        <tr key={order.id} className="border-b border-[#DFEAF2]">
                          <td className="p-3 px-5 whitespace-nowrap">{index + 1}</td>
                          <td className="p-3 px-5 whitespace-nowrap">
                            <PermissionField permissionKey="order-variables.orderNumber">{order.orderNumber}</PermissionField>
                            <span className="block">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</span>
                          </td>

                          {hasAnyPermission(
                            "order-variables.shippingName",
                            "order-variables.shippingPhone",
                            "order-variables.shippingEmail"
                          ) && (
                              <td className="p-3 px-5 whitespace-nowrap">
                                <PermissionField permissionKey="order-variables.shippingName">{order.shippingName}</PermissionField>
                                <br />
                                <span className="text-sm block">
                                  <PermissionField permissionKey="order-variables.shippingPhone">{order.shippingPhone}</PermissionField>
                                </span>
                                <span className="text-sm text-[#01b574]">
                                  <PermissionField permissionKey="order-variables.shippingEmail">{order.shippingEmail}</PermissionField>
                                </span>
                              </td>
                            )}

                          {hasAnyPermission(
                            "order-variables.payment_mode",
                            "order-variables.transactionId",
                            "order-variables.amount",
                            "order-variables.status"
                          ) && (
                              <td className="p-3 px-5 whitespace-nowrap font-semibold">
                                <PermissionField permissionKey="order-variables.payment_mode"> <p>Method: <span className="font-bold">{order.shippingApiResult?.data?.payment_mode || "-"}</span></p></PermissionField>
                                <PermissionField permissionKey="order-variables.transactionId">  <p>Transaction Id: <span className="font-bold">{order.payment?.transactionId || "-"}</span></p></PermissionField>
                                <PermissionField permissionKey="order-variables.amount"><p>Amount: <span className="font-bold">{order.payment?.amount || "-"}</span></p></PermissionField>
                                <PermissionField permissionKey="order-variables.status"> <p>

                                  <span className={`font-bold ${order.payment?.status === "failed" ? "text-red-500" :
                                    order.payment?.status === "pending" ? "text-yellow-500" : "text-green-500"
                                    }`}>
                                    {order.payment?.status || "-"}
                                  </span>
                                </p>
                                </PermissionField>
                              </td>
                            )}

                          {hasAnyPermission(
                            "order-variables.orderNumber",
                            "order-variables.shippingPhone",
                            "order-variables.shippingAddress",
                            "order-variables.awbNumber"
                          ) && (
                              <td className="p-3 px-5 whitespace-nowrap">
                                <PermissionField permissionKey="order-variables.orderNumber">
                                  {order.shippingApiResult?.data?.order_number || "-"}
                                </PermissionField>
                                <br />
                                <PermissionField permissionKey="order-variables.shippingAddress">
                                  {order.shippingAddress || "-"}
                                </PermissionField>
                                <br />
                                <span className="text-green-500">
                                  <PermissionField permissionKey="order-variables.shippingPhone">
                                    {order.shippingPhone || "-"}
                                  </PermissionField>
                                </span>
                                <br />
                                <PermissionField permissionKey="order-variables.awbNumber">
                                  {order.shippingApiResult?.data?.awb_number || "-"}
                                </PermissionField>
                              </td>
                            )}


                          {hasPermission("order-variables.trackingNumber ") && (
                            <td className="p-3 px-5 whitespace-nowrap">
                              {order.items
                                .map((item) => (
                                  <PermissionField key={item.id} permissionKey="order-variables.trackingNumber">
                                    {item.supplierRTOResponse?.trackingNumber || "-"}
                                  </PermissionField>
                                ))
                                .reduce((prev, curr) => [prev, ", ", curr])}
                            </td>)}

                          {hasPermission("order-variables.rtoDelivered", "order-variables.delivered") && (
                            <>
                              <td className="p-3 px-5 whitespace-nowrap capitalize">
                                <PermissionField permissionKey="order-variables.rtoDelivered">
                                  {order.delivered ? (
                                    <span className="text-green-600">Delivered</span>
                                  ) : order.rtoDelivered ? (
                                    <span className="text-orange-500">RTO Delivered</span>
                                  ) : (
                                    <span className="text-red-500">Pending</span>
                                  )}

                                </PermissionField>
                              </td>

                            </>
                          )}
                          {hasPermission("order-variables.rtoDeliveredDate", "order-variables.deliveredDate") && (
                            <td className="p-3 px-5 whitespace-nowrap">
                              <PermissionField permissionKey="order-variables.rtoDeliveredDate">

                                {order.deliveredDate ? (
                                  <span>{order.deliveredDate ? new Date(order.deliveredDate).toLocaleDateString() : "-"}</span>
                                ) : order.rtoDeliveredDate ? (
                                  <span>{order.rtoDeliveredDate ? new Date(order.rtoDeliveredDate).toLocaleDateString() : "-"}</span>
                                ) : (
                                  <span className="text-red-500">Pending</span>
                                )}

                              </PermissionField>
                            </td>

                          )}

                          {/* Item Count */}
                          <td className="p-3 px-5 whitespace-nowrap">{order.items.length}</td>

                          {/* Total Amount */}
                          {hasPermission("order-variables.totalAmount") && (
                            <td className="p-3 px-5 whitespace-nowrap">
                              <PermissionField permissionKey="order-variables.totalAmount">₹{order.totalAmount}</PermissionField>
                            </td>
                          )}

                          {/* Delivered */}


                          {/* Actions */}
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
                ) : (
                  <p className="text-center p-5 w-full">No data available</p>
                )
              }
            </div>
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
                                src={fetchImages(imgUrl)}
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
          </>
        ) : (
          <p className="text-center text-gray-500">No Orders Found</p>
        )
      )}

    </div>
  );
}

export default Reporting;
