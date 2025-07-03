'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from 'sweetalert2';
import { FaCheck } from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
const STATUS_LIST = [
  "Cancelled", "Damaged", "Delivered", "Progress", "In Transit", "Lost", "Not Serviceable",
  "Order Placed", "Out for Delivery", "Picked Up", "Pickup Cancelled",
  "Pickup Pending", "Pickup Scheduled", "RTO Delivered", "RTO Failed", "RTO In Transit"
];

const tabs = [
  { key: "warehouse-collected", label: "Collected at Warehouse" },
  { key: "rto", label: "RTO Count" },
  { key: "need-to-raise", label: "Need to Raise" },
  { key: "dispute", label: "Dispute" },
];
import { useImageURL } from "@/components/ImageURLContext";
import useScannerDetection from '../useScannerDetection';
import 'datatables.net-dt/css/dataTables.dataTables.css';

import { IoMdRefresh } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { FiDownloadCloud } from "react-icons/fi";
import { MoreHorizontal } from "lucide-react";
import barcode from '@/app/assets/barcode.png'
import Image from 'next/image';
import { HashLoader } from 'react-spinners';
export default function RTO() {
  const [activeTab, setActiveTab] = useState('warehouse-collected');
  const { fetchImages } = useImageURL();
  const [selected, setSelected] = useState('');
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([]);
  const togglePaymentStatus = (status) => {
    setSelectedPaymentStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };


  const handleCheckboxChange = (id) => {
    setSelected((prev) => {
      const ids = prev ? prev.split(',') : [];

      const updated = ids.includes(String(id))
        ? ids.filter((item) => item !== String(id))
        : [...ids, String(id)];

      return updated.join(',');
    });
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

  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [disputeCase2, setDisputeCase2] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [viewDispute, setViewDispute] = useState(false);

  const [showShipmentDetailsFilter, setShowShipmentDetailsFilter] = useState(false);
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);

  const handleViewVariant = (item, variant) => {
    setSelectedVariant(item);
    setShowModal(true);
  };

  const [selectedDisputeItem, setSelectedDisputeItem] = useState({
    status: '',
    packingGallery: '',
    unboxingGallery: '',
  });
  const [scannedCode, setScannedCode] = useState('');
  const [message, setMessage] = useState('📷 Please scan a barcode...');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isBarCodePopupOpen, setIsBarCodePopupOpen] = useState(false);
  const openBarCodeModal = () => {
    setIsBarCodePopupOpen(true);
  }

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [permission, setPermission] = useState([]);
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const modalRef = useRef();
  const [files, setFiles] = useState([]);

  useScannerDetection({
    onComplete: (code) => {
      const scanned = String(code);
      setScannedCode(scanned);
      barcodeScannerOrder();
    },
    minLength: 3,
  });

  const handleFileChange = (e) => {
    const inputName = e.target.name; // get the input's name attribute
    const selectedFiles = Array.from(e.target.files); // array of File objects

    setFiles((prevFiles) => ({
      ...prevFiles,
      [inputName]: selectedFiles,
    }));
  };



  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());

  const formatDate = (date) => date.toISOString().split("T")[0];

  const sendBarCodeOrder = async () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (!supplierData || supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }
    const form = new FormData();
    form.append('orderNumber', scannedCode);

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/supplier/order/warehouse-collected`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: form,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          customClass: {
            container: 'custom-swal-zindex',
          },
          text:
            result.error ||
            result.message ||
            "Your session has expired. Please log in again.",
        });
        throw new Error(result.message || result.error);
      }

      if (result) {
        // Refresh the page
        window.location.reload();
      }

    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchRto = useCallback(async () => {
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
        `/api/supplier/order/${activeTab}?from=${formatDate(
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
          customClass: {
            container: 'custom-swal-zindex'
          },
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Your session has expired. Please log in again.",
        },

        );
        throw new Error(errorMessage.message || errorMessage.error);
      }

      const result = await response.json();
      setOrders(result?.orders || []);
      setPermission(result?.permissions[0] || []);
      if (result?.staffPermissionApplied == true) {
        setAssignedPermissions(result?.assignedPermissions || []);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [router, fromDate, toDate, activeTab]);


  const initiateLevel1 = useCallback(async (id) => {
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
        `/api/supplier/order/need-to-raise/${id}/dispute-1`,
        {
          method: "POST",
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
          customClass: {
            container: 'custom-swal-zindex'
          },
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Your session has expired. Please log in again.",
        },

        );
        throw new Error(errorMessage.message || errorMessage.error);
      }

      const result = await response.json();
      if (result) {
        fetchRto();
      }

    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
        if ($.fn.DataTable.isDataTable('#rtoOrderTable')) {
          $('#rtoOrderTable').DataTable().destroy();
          $('#rtoOrderTable').empty();
        }

        // Reinitialize DataTable with new data
        const isMobile = window.innerWidth <= 768;
        const pagingType = isMobile ? 'simple' : 'simple_numbers';

        table = $('#rtoOrderTable').DataTable({
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
  const barcodeScannerOrder = useCallback(async () => {
    try {
      if (isBarCodePopupOpen && scannedCode) {
        const filteredOrders = orders.filter((order) => {
          return order.orderNumber === scannedCode;
        });
        setScannedCode('');
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
      setIsBarCodePopupOpen(false)
    }
  }, [orders, scannedCode]);


  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM
  });


  const disputeAll = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    // Redirect if not supplier
    if (dropshipperData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      // Show loading dialog
      Swal.fire({
        title: 'Creating...',
        text: 'Please wait while we save your data.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },

      });

      const formdata = new FormData();
      formdata.append('orders', Array.isArray(selected) ? selected.join(',') : selected);

      const url = `/api/supplier/order/need-to-raise/dispute-1`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formdata,
      });

      const result = await response.json();
      Swal.close();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: result.message || result.error || "An error occurred.",

        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Dispute Created",
          text: "Your dispute has been raised successfully!",
          showConfirmButton: true,

        }).then((res) => {
          if (res.isConfirmed) {

            fetchRto();
            setSelected([]);
          }
        });
      }

    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    // Redirect if not supplier
    if (dropshipperData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      // Show loading dialog
      Swal.fire({
        title: 'Creating ...',
        text: 'Please wait while we save your data.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: 'custom-swal-zindex'
        }
      });

      const formdata = new FormData();
      Object.entries(files).forEach(([key, fileArray]) => {
        fileArray.forEach((file) => {
          formdata.append(key, file, file.name);
        });
      });
      formdata.append("status", status);


      const url = `/api/supplier/order/need-to-raise/${disputeCase2}/dispute-2`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formdata,
      });

      const result = await response.json();
      Swal.close();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: result.message || result.error || "An error occurred.",
          customClass: {
            container: 'custom-swal-zindex'
          },
        });


      } else {
        Swal.fire({
          icon: "success",
          title: "Created",
          showConfirmButton: true,
          customClass: {
            popup: 'custom-swal-zindex'
          }
        }).then((res) => {
          if (res.isConfirmed) {
            setFiles({});
            setDisputeCase2('');
            setDisputeOpen(false);
            fetchRto();
          }
        });
      }

    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
        customClass: {
          popup: 'custom-swal-zindex'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRto()
  }, [fetchRto]);

  let finalAllowedKeys = [];

  if (assignedPermissions && assignedPermissions.length > 0) {
    finalAllowedKeys = assignedPermissions
      .map(p => p.permission?.action)
      .filter(action => permission[action] === true);
  } else {
    finalAllowedKeys = Object.keys(permission).filter(key => permission[key] === true);
  }

  const hasAnyPermission = (...keys) => keys.some((key) => finalAllowedKeys.includes(key));

  const PermissionField = ({ permissionKey, children }) => {
    const isAllowed = finalAllowedKeys.includes(permissionKey);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <HashLoader color="orange" />
      </div>
    )
  }

  return (
    <div className='px-2 md:px-0'>
      <div className="flex gap-4 bg-white overflow-auto rounded-md p-4 mb-8 font-lato text-sm ">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key), setSelected('') }}
            className={`md:px-6 py-2 font-medium px-2 whitespace-nowrap  md:text-xl border-b-2 transition-all duration-200
                ${activeTab === tab.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-600"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <>
        <div className='bg-white rounded-md p-3 mb-4'>
          <div className="grid justify-between grid-cols-2 items-center">
            <div className="">
              <div className="flex  items-end gap-4 mb-6">
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

              </div>


            </div>
            {activeTab === "warehouse-collected" && (
              <div className='flex justify-end' onClick={() => openBarCodeModal()}>
                <Image src={barcode} height={70} width={70} alt="Barcode Image" />
              </div>

            )}

          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl">
          <div className="flex flex-wrap justify-between items-center mb-4 lg:px-3">
            <h2 className="text-2xl font-bold  font-dm-sans">RTO Order Details</h2>
            <div className="flex gap-3  flex-wrap items-center">
              <span
                className="font-bold font-dm-sans flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:underline"
                onClick={() => {
                  if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                    const table = window.$('#rtoOrderTable').DataTable();

                    // Clear global search
                    table.search('');

                    // Clear column searches
                    table.columns().search('');

                    // Redraw the table
                    table.draw();
                  }

                  // Reset filter states
                  setOrderId('');
                  setSelectedStatuses([]);
                  setSelectedPaymentStatuses([]);
                  setSearch('');
                }}

              >
                Clear Filters <IoMdRefresh className="text-xl" />
              </span>
              {selected && (
                <button className="bg-red-500 text-white p-2 px-4 rounded-md" onClick={disputeAll}>Dispute Selected</button>
              )}
              <span><IoSettingsOutline className="text-xl" /></span>
              <span><FiDownloadCloud className="text-red-400 text-xl" /></span>

              <button className="bg-[#F4F7FE] rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">


                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="outline-0 font-dm-sans"
                />
              </button>
              <button
                onClick={() => setIsPopupOpen((prev) => !prev)}
                className="bg-[#F4F7FE] p-2 rounded-lg relative"
              >
                <MoreHorizontal className="text-[#F98F5C]" />
                {isPopupOpen && (
                  <div className="absolute md:left-0 mt-2 w-40 right-0 bg-white rounded-md shadow-lg z-10">
                    <ul className="py-2 text-sm text-[#2B3674]">
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Export CSV</li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Bulk Delete</li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                    </ul>
                  </div>
                )}
              </button>
            </div>
          </div>
          {orders.length > 0 ? (
            <div className="overflow-auto overflow-x-visible relative main-outer-wrapper w-full">


              <table className="min-w-full display main-tables" id="rtoOrderTable">
                <thead className=" text-gray-700">
                  <tr className="border-b border-[#DFEAF2] text-left uppercase">
                    <th className="p-3 px-5 whitespace-nowrap">SR.</th>
                    <th className="p-3 px-5 whitespace-nowrap">Item Count</th>

                    <th className="p-3 px-5 whitespace-nowrap relative uppercase">
                      <button onClick={() => {
                        setShowStatus(!showStatus);
                        setShowFilter(false);
                        setShowCustomerFilter(false);
                        setShowPaymentFilter(false);
                        setShowShipmentDetailsFilter(false)
                      }} className='flex gap-2 uppercase items-center'> Shipment Status <IoFilterSharp className="w-4 h-4" /></button>

                      {
                        showStatus && (
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

                            <div className="mt-4 flex justify-between items-center">
                              <button
                                onClick={() => {
                                  setSearch("");
                                  setSelectedStatuses([]);

                                  // Clear DataTable column filter
                                  if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                    window.$('#rtoOrderTable').DataTable().column(2).search('').draw();
                                  }
                                }}
                                className="text-green-600 text-sm hover:underline"
                              >
                                Reset All
                              </button>

                              <button
                                className={`px-4 py-1 rounded text-white text-sm ${selectedStatuses.length
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-300 cursor-not-allowed"
                                  }`}
                                onClick={() => {
                                  if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                    const regex = selectedStatuses.join('|'); // OR regex for filtering
                                    window.$('#rtoOrderTable').DataTable().column(2).search(regex, true, false).draw(); // exact match with regex
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
                        )
                      }

                    </th>
                    <th className="p-3 px-5 whitespace-nowrap overflow-visible relative" >
                      <button onClick={() => {
                        setShowFilter(!showFilter);
                        setShowStatus(false);
                        setShowCustomerFilter(false);
                        setShowPaymentFilter(false);
                        setShowShipmentDetailsFilter(false)
                      }} className='flex gap-2 uppercase items-center'> Order Details <IoFilterSharp className="w-4 h-4" /></button>
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
                                if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                  window.$('#rtoOrderTable').DataTable().column(2).search('').draw();
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
                                if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                  window.$('#rtoOrderTable').DataTable().column(2).search('').draw();
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
                                if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                  const regex = selectedStatuses.join('|');
                                  window.$('#rtoOrderTable').DataTable().column(2).search(regex, true, false).draw();
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

                    {hasAnyPermission(
                      "shippingName",
                      "shippingPhone",
                      "shippingEmail"
                    ) && <th className="p-3 px-5 whitespace-nowrap relative">
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
                                  if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                    window.$('#rtoOrderTable').DataTable().search(orderId).draw();
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
                                  if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                    window.$('#rtoOrderTable').DataTable().search('').draw();
                                  }
                                }}
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        )}


                      </th>
                    }

                    {hasAnyPermission(
                      "payment_mode",
                      "transactionId",
                      "amount",
                      "status"
                    ) && (
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
                                    if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                      window.$('#rtoOrderTable').DataTable().search(orderId).draw();
                                      const regex = selectedPaymentStatuses.join('|');
                                      window.$('#rtoOrderTable').DataTable().column(5).search(regex, true, false).draw();
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
                                    if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                      window.$('#rtoOrderTable').DataTable().search('').draw();
                                      window.$('#rtoOrderTable').DataTable().column(5).search('').draw();
                                    }
                                  }}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          )}
                        </th>

                      )}
                    {hasAnyPermission(
                      "order_number",
                      "shippingPhone",
                      "shippingAddress",
                      "awb_number",
                    ) && <th className="p-3 px-5 whitespace-nowrap relative">
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
                                if (window.$.fn.DataTable.isDataTable('#rtoOrderTable')) {
                                  window.$('#rtoOrderTable').DataTable().search(orderId).draw();
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
                    }

                    {hasAnyPermission("trackingNumber ") && (
                      <th className="p-3 px-5 whitespace-nowrap">Return Tracking #</th>
                    )}

                    {hasAnyPermission("rtoDelivered", "delivered") && (
                      <>
                        <th className="p-3 px-5 whitespace-nowrap">Delivered Status</th>
                      </>
                    )}
                    {hasAnyPermission("rtoDeliveredDate", "deliveredDate") && (
                      <>
                        <th className="p-3 px-5 whitespace-nowrap">Delivered Date</th>
                      </>
                    )}



                    {hasAnyPermission("totalAmount") && (
                      <th className="p-3 px-5 whitespace-nowrap">Total</th>
                    )}



                    <th className="px-4 py-2 text-center text-sm whitespace-nowrap font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y bg-white">
                  {orders.map((order, index) => {
                    const variant = order.items?.[0]?.dropshipperVariant?.supplierProductVariant?.variant;
                    const variantImages =
                      (variant?.image || '')
                        .split(',')
                        .filter((img) => img.trim() !== '');

                    return (
                      <tr key={order.id} className="border-b border-[#DFEAF2] capitalize">
                        <td className="p-3 px-5 whitespace-nowrap">
                          <div className="flex items-center">{activeTab == "need-to-raise" && (

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
                          )}
                            {index + 1}</div></td>
                        <td className="p-3 px-5 whitespace-nowrap">
                          <div className='flex items-center gap-3'>
                            <div className="flex gap-2 flex-wrap">

                              <img
                                src={fetchImages(variantImages[0])}
                                alt={`Variant`}
                                className="h-12 w-12 object-cover rounded-full border border-[#DFEAF2]"
                              />

                            </div>
                            <div onClick={() => handleViewVariant(order, order.items)} className="mt-2 cursor-pointer text-sm text-gray-600">
                              {order.items.length > 1 &&
                                (<span>  +{order.items.length} more products</span>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 px-5 whitespace-nowrap">
                          {order.status}
                        </td>
                        <td className="p-3 px-5 whitespace-nowrap">
                          <PermissionField permissionKey="orderNumber">{order.orderNumber}</PermissionField>
                          <span className="block">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</span>
                        </td>

                        {hasAnyPermission("shippingName", "shippingPhone", "shippingEmail") && (
                          <td className="p-3 px-5 whitespace-nowrap">
                            <PermissionField permissionKey="shippingName">{order.shippingName}</PermissionField>
                            <br />
                            <span className="text-sm block">
                              <PermissionField permissionKey="shippingPhone">{order.shippingPhone}</PermissionField>
                            </span>
                            <span className="text-sm text-[#01b574]">
                              <PermissionField permissionKey="shippingEmail">{order.shippingEmail}</PermissionField>
                            </span>
                          </td>
                        )}

                        {hasAnyPermission("payment_mode", "transactionId", "amount", "status") && (
                          <td className="p-3 px-5 whitespace-nowrap font-semibold">
                            <PermissionField permissionKey="payment_mode">
                              <p>Method: <span className="font-bold">{order.shippingApiResult?.data?.payment_mode || "-"}</span></p>
                            </PermissionField>
                            <PermissionField permissionKey="transactionId">
                              <p>Transaction Id: <span className="font-bold">{order.payment?.transactionId || "-"}</span></p>
                            </PermissionField>
                            <PermissionField permissionKey="amount">
                              <p>Amount: <span className="font-bold">{order.payment?.amount || "-"}</span></p>
                            </PermissionField>
                            <PermissionField permissionKey="status">
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
                            </PermissionField>
                          </td>
                        )}

                        {hasAnyPermission("orderNumber", "shippingPhone", "shippingAddress", "awbNumber") && (
                          <td className="p-3 px-5 whitespace-nowrap">
                            <PermissionField permissionKey="orderNumber">
                              {order.shippingApiResult?.data?.order_number || "-"}
                            </PermissionField>
                            <br />
                            <PermissionField permissionKey="shippingAddress">
                              {order.shippingAddress || "-"}
                            </PermissionField>
                            <br />
                            <span className="text-green-500">
                              <PermissionField permissionKey="shippingPhone">
                                {order.shippingPhone || "-"}
                              </PermissionField>
                            </span>
                            <br />
                            <PermissionField permissionKey="awbNumber">
                              {order.shippingApiResult?.data?.awb_number || "-"}
                            </PermissionField>
                          </td>
                        )}

                        {hasAnyPermission("trackingNumber") && (
                          <td className="p-3 px-5 whitespace-nowrap">
                            {order.items
                              .map((item) => (
                                <PermissionField key={item.id} permissionKey="trackingNumber">
                                  {item.supplierRTOResponse?.trackingNumber || "-"}
                                </PermissionField>
                              ))
                              .reduce((prev, curr) => [prev, ", ", curr])}
                          </td>
                        )}

                        {hasAnyPermission("rtoDelivered", "delivered") && (
                          <td className="p-3 px-5 whitespace-nowrap capitalize">
                            <PermissionField permissionKey="rtoDelivered">
                              {order.delivered ? (
                                <span className="text-green-600">Delivered</span>
                              ) : order.rtoDelivered ? (
                                <span className="text-orange-500">RTO Delivered</span>
                              ) : (
                                <span className="text-red-500">Pending</span>
                              )}
                            </PermissionField>
                          </td>
                        )}

                        {hasAnyPermission("rtoDeliveredDate", "deliveredDate") && (
                          <td className="p-3 px-5 whitespace-nowrap">
                            <PermissionField permissionKey="rtoDeliveredDate">
                              {order.deliveredDate ? (
                                <span>{new Date(order.deliveredDate).toLocaleDateString()}</span>
                              ) : order.rtoDeliveredDate ? (
                                <span>{new Date(order.rtoDeliveredDate).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-red-500">Pending</span>
                              )}
                            </PermissionField>
                          </td>
                        )}



                        {/* Total Amount */}
                        {hasAnyPermission("totalAmount") && (
                          <td className="p-3 px-5 whitespace-nowrap">
                            <PermissionField permissionKey="totalAmount">₹{order.totalAmount}</PermissionField>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="px-4 py-2 text-sm whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewVariant(order, order.items)}
                              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                              View Variants
                            </button>
                            {activeTab === "warehouse-collected" && (
                              !order.disputeCase ? (
                                <button
                                  onClick={() => {
                                    setDisputeCase2(order.id),
                                      setDisputeOpen(true)
                                  }}
                                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                                  Initiate Dispute
                                </button>
                              ) : (<button onClick={() => {
                                setSelectedDisputeItem({
                                  status: order.supplierRTOResponse || '',
                                  packingGallery: order.packingGallery || '',
                                  unboxingGallery: order.unboxingGallery || '',
                                }); // Save clicked dispute item to state
                                setViewDispute(true)
                              }} className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                                View Dispute
                              </button>
                              )
                            )}

                            {activeTab === "need-to-raise" && (
                              <>
                                {!order.disputeCase ? (
                                  <button onClick={() => initiateLevel1(order.id)} className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                                    Initiate Dispute
                                  </button>
                                ) : (
                                  <p>Dispute Initiated</p>
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
            <p className='text-center'>No RTO Orders Available</p>
          )}


        </div>
      </>

      {disputeOpen && (
        <div className="fixed px-5 inset-0 bg-[#00000087] bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg border-orange-500 w-full border max-w-3xl shadow-xl relative">


            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Raise a Dispute</h2>
              <button onClick={() => { setDisputeOpen(false), setDisputeCase2('') }} className="text-gray-500 hover:text-black">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="wrong item received">Wrong Item Received</option>

                </select>
              </div>

              {status === 'wrong item received' && (
                <>
                  <div>
                    <label className="block font-medium mb-1">Packing Gallery (images/videos)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      name='packingGallery'
                      onChange={handleFileChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Unboxing Gallery (images/videos)</label>
                    <input
                      type="file"
                      multiple
                      name='unboxingGallery'
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setDisputeOpen(false), setDisputeCase2('') }} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={(e) => handleSubmit(e)} className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>

      )}

      {showModal && selectedVariant && (

        <div className="fixed inset-0 px-5 flex items-center justify-center bg-[#000000ba] bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-5xl border-2 border-orange-500 p-6 rounded-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-center text-orange-500">Product Variants</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedVariant?.items?.map((item, idx) => {
                const variant = item.dropshipperVariant?.supplierProductVariant?.variant;
                if (!variant) return null;
                const imageUrls = variant.image
                  ? variant.image.split(",").map((img) => img.trim()).filter(Boolean)
                  : [];
                return (
                  <div
                    key={variant.id || idx}
                    className="bg-white p-4 rounded-md  border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                  >
                    <div className='flex gap-2 relative'>
                      {/* Image Preview */}
                      <div className="flex items-center gap-2 overflow-x-auto h-[200px] w-full object-cover  border border-[#E0E2E7] rounded-md p-3shadow bg-white">
                        {imageUrls.length > 0 ? (
                          imageUrls.map((url, i) => (
                            <Image
                              key={i}
                              height={100}
                              width={100}
                              src={fetchImages(url)}
                              alt={variant.name || 'NIL'}
                              className="h-full w-full object-cover"
                            />
                          ))
                        ) : (
                          <Image
                            height={40}
                            width={40}
                            src="https://placehold.com/600x400"
                            alt="Placeholder"
                            className="rounded shrink-0"
                          />
                        )}
                      </div>


                    </div>

                    <div className="overflow-x-auto">
                      <table className="text-sm text-gray-700 w-full  border-gray-200">
                        <tbody>
                          <tr className='border border-gray-200'>
                            <th className="text-left border-gray-200 border p-2 font-semibold ">Model:</th>
                            <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.model || "NIL"}</td>
                            <th className="text-left border-gray-200 border p-2 font-semibold ">Name:</th>
                            <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.name || "NIL"}</td>


                          </tr>


                          <tr className='border border-gray-200'>


                            <th className="text-left border-gray-200 border p-2 font-semibold ">SKU:</th>
                            <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.sku || "NIL"}</td>

                            <th className="text-left border-gray-200 border p-2 font-semibold ">Color:</th>
                            <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.color || "NIL"}</td>
                          </tr>


                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        </div>

      )
      }


      {
        viewDispute && (

          <div className="fixed px-5 inset-0 bg-[#00000087] bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white p-6 max-h[500px] overflow-auto  rounded-lg border-orange-500 w-full border max-w-3xl shadow-xl relative">

              {selectedDisputeItem && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-red-600">
                      Dispute: {selectedDisputeItem?.status}
                    </h2>
                    <button onClick={() => setViewDispute(false)} className="text-gray-500 hover:text-black">✕</button>
                  </div>

                  {/* Packing Gallery */}
                  {selectedDisputeItem.packingGallery && (
                    <div className="mb-6">
                      <p className="text-lg font-semibold mb-2">Packing Gallery</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDisputeItem.packingGallery.replace(/"/g, '').split(',').map((img, index) => (
                          <img
                            key={index}
                            src={fetchImages(img)}
                            alt={`Packing ${index}`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unboxing Gallery */}
                  {selectedDisputeItem.unboxingGallery && (
                    <div>
                      <p className="text-lg font-semibold mb-2">Unboxing Gallery</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDisputeItem.unboxingGallery.replace(/"/g, '').split(',').map((img, index) => (
                          <img
                            key={index}
                            src={fetchImages(img)}
                            alt={`Unboxing ${index}`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        )
      }


      {
        isBarCodePopupOpen && (
          <div className="fixed px-5 inset-0 bg-[#00000038] bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg relative">
              <button
                onClick={() => setIsBarCodePopupOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <h2 className="text-lg font-bold mb-4">Scan Barcode</h2>
              <div>
                <p style={scannedCode ? styles.msgSuccess : styles.msgDefault}>{message}</p>
                <section style={styles.box}>
                  <label style={styles.label}>Scanned Code:</label>
                  <div style={styles.code}>{scannedCode || '___'}</div>
                </section>

              </div>

            </div>
          </div>
        )
      }

      {
        isNoteModalOpen && (
          <div className="fixed px-5 inset-0 bg-[#00000038] bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg relative">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <h2 className="text-lg font-bold mb-4">Order Notes</h2>
              <textarea
                className="w-full border p-2 rounded-xl mb-4"
                rows={4}
                placeholder="Add your note here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="bg-gray-200 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Submit logic here
                    setIsNoteModalOpen(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
const styles = {
  container: {
    maxWidth: 480,
    margin: '4rem auto',
    padding: '2rem',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#0070f3',
  },
  msgDefault: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#555',
  },
  msgSuccess: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#28a745',
  },
  box: {
    border: '2px dashed #0070f3',
    padding: '1.5rem',
    borderRadius: '10px',
    background: '#f0f8ff',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#0070f3',
  },
  code: {
    marginTop: '10px',
    fontSize: '1.5rem',
    color: '#003a8c',
  },
};