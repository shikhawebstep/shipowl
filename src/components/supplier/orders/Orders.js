'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { IoMdRefresh } from 'react-icons/io';
import { IoSettingsOutline } from 'react-icons/io5';
import { FiDownloadCloud } from 'react-icons/fi';
import { MoreHorizontal } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useRouter } from 'next/navigation';
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
import { HashLoader } from 'react-spinners';
import Swal from 'sweetalert2'; // ✅ added import
import { FaCheck } from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";

const STATUS_LIST = [
  "Cancelled", "Damaged", "Delivered", "Progress", "In Transit", "Lost", "Not Serviceable",
  "Order Placed", "Out for Delivery", "Picked Up", "Pickup Cancelled",
  "Pickup Pending", "Pickup Scheduled", "RTO Delivered", "RTO Failed", "RTO In Transit"
];

import { RiFileEditFill } from 'react-icons/ri';
import { IoCloudDownloadOutline } from 'react-icons/io5';
import { RxCrossCircled } from 'react-icons/rx';
import { IoIosArrowDropdown } from 'react-icons/io';
import 'datatables.net-dt/css/dataTables.dataTables.css';
// import InvoicePdf from './InvoicePdf';
import barcode from '@/app/assets/barcode.png'
import Image from 'next/image';
import useScannerDetection from '../useScannerDetection';
export default function Orders() {
  const [showShipmentDetailsFilter, setShowShipmentDetailsFilter] = useState(false);
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);
  const [filter, setFilter] = useState("Actual Ratio");
  const [tracking, setTracking] = useState([]);
  const [filters, setFilters] = useState({
    orderId: '',
    productName: '',
    productSKU: '',
    tag: '',
    articleId: '',
    searchQuery: '',
    status: 'All',
    model: 'Warehouse Model',
  });
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

  const [message, setMessage] = useState('📷 Please scan a barcode...');
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [scannedCode, setScannedCode] = useState('');
  const [isBarCodePopupOpen, setIsBarCodePopupOpen] = useState(false);
  const openBarCodeModal = () => {
    setIsBarCodePopupOpen(true);
  }
  const [selected, setSelected] = useState('');

  const handleCheckboxChange = (id) => {
    setSelected((prev) => {
      const ids = prev ? prev.split(',') : [];

      const updated = ids.includes(String(id))
        ? ids.filter((item) => item !== String(id))
        : [...ids, String(id)];

      return updated.join(',');
    });
  }
  const [reporting, setReporting] = useState([]);
  const [permission, setPermission] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [selectedNoteOrder, setSelectedNoteOrder] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false); // Not used in this version
  const [allOrders, setAllOrders] = useState([]); // the full dataset from API
  const [orders, setOrders] = useState([]);       // the filtered one for table

  const [loading, setLoading] = useState(false);


  const { verifySupplierAuth } = useSupplier();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  useScannerDetection({
    onComplete: (code) => {
      const scanned = String(code);
      setScannedCode(scanned);
      barcodeScannerOrder();
    },
    minLength: 3,
  });
  const barcodeScannerOrder = useCallback(async () => {
    try {
      if (isBarCodePopupOpen && scannedCode) {
        const filteredOrders = allOrders.filter((order) => {
          return order.orderNumber === scannedCode;
        });
        setScannedCode('');
        setOrders(filteredOrders);
        setAllOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
      setIsBarCodePopupOpen(false)
    }
  }, [orders, scannedCode]);


  const handleSaveNote = () => {
    if (selectedNoteOrder) {
      // Example: call API to save note here

      setIsNoteModalOpen(false);
      setSelectedNoteOrder(null);
      setNoteInput("");
    }
  };


  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });

  const [toDate, setToDate] = useState(new Date());

  const formatDate = (date) => date.toISOString().split("T")[0];
  // Refactored and Sorted by: Authentication -> API Calls -> Helpers

  // AUTH Helpers
  const getSupplierToken = () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));
    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return null;
    }
    const token = supplierData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return null;
    }
    return token;
  };

  // FETCH Orders
  const fetchOrders = useCallback(async () => {
    const suppliertoken = getSupplierToken();
    if (!suppliertoken) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/supplier/order?from=${formatDate(fromDate)}&to=${formatDate(toDate)}`,
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
      setPermission(result?.permissions[0] || []);
      setOrders(result?.orders || []);
      setAllOrders(result?.orders || []);

      if (result?.staffPermissionApplied === true) {
        setAssignedPermissions(result?.assignedPermissions || []);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [router, fromDate, toDate]);

  // HANDLE Shipping
  const handleShipping = useCallback(async (id) => {
    const suppliertoken = getSupplierToken();
    if (!suppliertoken) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/order/${id}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        if (errorMessage.isHighRto === true) {
          Swal.fire({
            icon: 'warning',
            title: 'High RTO Risk',
            text: 'This order has a high Return-To-Origin (RTO) risk. Do you want to continue?',
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel',
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/order/${id}/shipping/confirm`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${suppliertoken}` },
                });
                if (confirmResponse.ok) {
                  Swal.fire({ icon: 'success', title: 'Confirmed', text: 'Shipping confirmed successfully.' });
                } else {
                  const confirmError = await confirmResponse.json();
                  Swal.fire({ icon: 'error', title: 'Error', text: confirmError.message || 'Confirmation failed.' });
                }
              } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Something went wrong.' });
              }
            }
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Something went wrong!', text: errorMessage.error || errorMessage.message || 'Please try again.' });
        }
        return;
      }

      await response.json();
      fetchOrders();
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // HANDLE Cancel
  const handleCancel = useCallback(async (id) => {
    const suppliertoken = getSupplierToken();
    if (!suppliertoken) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/order/${id}/shipping/cancel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({ icon: 'error', title: 'Something went wrong!', text: errorMessage.error || errorMessage.message || 'Please try again.' });
        return;
      }

      await response.json();
      fetchOrders();
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // HANDLE Tracking
  const handleTracking = useCallback(async (id) => {
    const suppliertoken = getSupplierToken();
    if (!suppliertoken) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/order/${id}/shipping/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({ icon: 'error', title: 'Something went wrong!', text: errorMessage.error || errorMessage.message || 'Please try again.' });
        return;
      }

      const result = await response.json();
      setTracking(result?.data || null);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);


  const closeModal = () => {
    setIsModalOpen(false);
    setTracking(null);
  };




  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);


      await verifySupplierAuth();
      await fetchOrders();
      setLoading(false);

    };
    fetchData();
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


  const pendingCount = allOrders.filter(order => order.status === 'pending').length;
  const deliveredCount = allOrders.filter(order => order.status === 'delivered').length;
  const lostCount = allOrders.filter(order => order.status === 'lost').length;
  const damagedCount = allOrders.filter(order => order.status === 'damage').length;



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
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading />
      </div>
    );
  }

  // ✅ Continue your return(...) block from here — I suggest fixing your filter buttons and looping through `filteredOrders` if needed



  return (
    <div>
      <div className='bg-white p-4 rounded-xl mb-4'>
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

              {/* <div> <label className='text-[#232323] font-medium block'>Order ID(s):</label>  <input type="text" placeholder="Separated By Comma" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div> <label className='text-[#232323] font-medium block'>Product Name</label>  <input type="text" placeholder="Name" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div> <label className='text-[#232323] font-medium block'>Product SKU</label>  <input type="text" placeholder="SKU" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div> <label className='text-[#232323] font-medium block'>Tag:</label>  <input type="text" placeholder="ALL" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div> <label className='text-[#232323] font-medium block'>Article Id:</label>  <input type="text" placeholder="ID" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div> <label className='text-[#232323] font-medium block'>Search Query:</label>  <input type="text" placeholder="Query" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
           <div className="flex gap-2 items-end">
             <button className="bg-blue-600 text-white px-6 py-2 rounded-md">Apply</button>
             <button className="bg-red-500 text-white px-6 py-2 rounded-md">Reset</button>
           </div> */}
            </div>
            <div className='flex justify-end' onClick={() => openBarCodeModal()}>
              <Image src={barcode} height={70} width={70} alt="Barcode Image" />
            </div>

          </div>
          {/* <div className='lg:flex gap-4 mb-5 items-center justify-between'>
 
 
           <div className="grid md:grid-cols-3 gap-3 lg:w-8/12 grid-cols-1 items-end justify-between">
             <div>
               <label className='text-[#232323] font-medium block'>Status:</label>
               <select type="text" className=" bg-white border text-[#718EBF]  border-[#DFEAF2]  mt-2 w-full p-2 rounded-xl">
                 <option value="All">All</option>
               </select>
             </div>
             <div > <label className='text-[#232323] font-medium block'>Select Model</label>
               <select type="text" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl">
                 <option value="Warehouse Model">Warehouse Model</option>
               </select>
             </div>
             <div > <label className='text-[#232323] font-medium block'>Select Dropshipper</label>
               <select type="text" className=" bg-white border text-[#718EBF]  border-[#DFEAF2]  mt-2 w-full p-2 rounded-xl">
                 <option value="John Doe (john@gmail.com)">John Doe (john@gmail.com)</option>
               </select>
             </div>
           </div>
           <div className='lg:w-4/12 mt-3 lg:mt-0 flex justify-end gap-3'>
             <button className="bg-[#4C82FF] text-white font-medium px-6 py-2 rounded-md text-sm">Filter</button>
             <button className="bg-[#F98F5C] text-white font-medium px-6 py-2 rounded-md text-sm">Export</button>
           </div>
         </div> */}

        </div>

        {/* Status and Model Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-end justify-normal">
          <div className="lg:w-[150px]">
            <label className="text-[#232323] font-medium block">Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-2 w-full p-2 rounded-xl"
            >
              <option value="All">All</option>
              {/* Add other status options here */}
            </select>
          </div>

          <div className="lg:w-2/12">
            <label className="text-[#232323] font-medium block">Select Model</label>
            <select
              name="model"
              value={filters.model}
              onChange={handleChange}
              className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-2 w-full p-2 rounded-xl"
            >
              <option value="Warehouse Model">Warehouse Model</option>
              {/* Add other models here */}
            </select>
          </div>
          <button className="bg-[#2B3674] text-white font-medium px-4 py-2 rounded-md text-sm">All Orders ({orders.length})</button>
          <button className="bg-[#EE5D50] text-white font-medium px-4 py-2 rounded-md text-sm">Pending ({pendingCount})</button>
          <button className="bg-[#4C82FF] text-white font-medium px-4 py-2 rounded-md text-sm">Ready to Pickup (10)</button>
          <button className="bg-[#F98F5C] text-white font-medium px-4 py-2 rounded-md text-sm">In Transit (10)</button>
          <button className="bg-[#05CD99] text-white font-medium px-4 py-2 rounded-md text-sm">Delivered ({deliveredCount})</button>
          <button className="bg-[#FF6D60] text-white font-medium px-4 py-2 rounded-md text-sm">Lost ({lostCount})</button>
          <button className="bg-[#B71D21] text-white font-medium px-4 py-2 rounded-md text-sm">Damaged ({damagedCount})</button>
          <button className="bg-[#F98F5C] text-white font-medium px-4 py-2 rounded-md text-sm">Export</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-2xl font-bold  font-dm-sans text-[#2B3674]">Order Details</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <span
              className="font-bold font-dm-sans flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:underline"
              onClick={() => {
                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                  const table = window.$('#orderTable').DataTable();

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

            <span><IoSettingsOutline className="text-xl" /></span>
            <span><FiDownloadCloud className="text-red-400 text-xl" /></span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#4318FF] font-dm-sans outline-0 text-white md:w-[150px] font-bold px-2 py-2 rounded-md"
            >
              <option value="Actual Ratio ">Bulk Action</option>
            </select>
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
            <button className="bg-[#F4F7FE] px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="outline-0 font-dm-sans"
              />
            </button>

          </div>
        </div>


        {
          orders.length > 0 ? (

            <div className="overflow-x-auto relative main-outer-wrapper w-full">
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
                                if (window.$.fn.DataTable.isDataTable('#orderTable')) {
                                  window.$('#orderTable').DataTable().search('').draw();
                                }
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
        className={`flex-1 px-4 py-1 rounded text-white text-sm ${
          orderId ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
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
                    }


                    {hasAnyPermission("trackingNumber ") && (
                      <th className="p-3 px-5 whitespace-nowrap">Return Tracking #</th>
                    )}

                    {hasAnyPermission("rtoDelivered", "delivered") && (
                      <>
                        <th className="p-3 px-5 whitespace-nowrap">delivered Status</th>
                      </>
                    )}
                    {hasAnyPermission("rtoDeliveredDate", "deliveredDate") && (
                      <>
                        <th className="p-3 px-5 whitespace-nowrap">delivered Date</th>
                      </>
                    )}



                    {hasAnyPermission("totalAmount") && (
                      <th className="p-3 px-5 whitespace-nowrap">Total</th>
                    )}
                    <th className="p-2 px-5 text-left whitespace-nowrap">Download Invoice</th>
                    <th className="p-2 px-5 text-center">Action</th>
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
                          <PermissionField permissionKey="orderNumber">{order.orderNumber}</PermissionField>
                          <span className="block">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</span>
                        </td>
                        <td className="p-3 px-5 whitespace-nowrap">
                          {order.status}

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
                        <td className="p-2 px-5 whitespace-nowrap">
                          <button className="bg-[#2B3674] text-white font-medium px-4 py-2 rounded-md text-sm">
                            Generate Invoice
                          </button>
                        </td>

                        {/* Action */}
                        <td className="p-2 px-5 whitespace-nowrap">
                          <div className="flex gap-3 justify-end items-center mt-2">
                            <button
                              onClick={() => {
                                setNoteInput(order.orderNote || "");
                                setSelectedNoteOrder(order.id);
                                setIsNoteModalOpen(true);
                              }}
                              className="text-[#F98F5C] border rounded-md font-dm-sans p-2 text-sm"
                            >
                              View / Add Notes
                            </button>

                            {!order.shippingApiResult?.data?.awb_number ? (
                              <button
                                className="bg-orange-500 text-white font-medium px-4 py-2 rounded-md text-sm"
                                onClick={() => handleShipping(order.id)}
                              >
                                Shipping
                              </button>
                            ) : (
                              <>
                                <button
                                  className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm"
                                  onClick={() => handleTracking(order.id)}
                                >
                                  Tracking
                                </button>
                                <button
                                  className="bg-[#B71D21] text-white font-medium px-4 py-2 rounded-md text-sm"
                                  onClick={() => handleCancel(order.id)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>

                          <ul className="flex gap-6 mt-4 justify-end">
                            <li><RiFileEditFill className="text-black text-xl" /></li>
                            <li><IoCloudDownloadOutline className="text-black text-xl" /></li>
                            <li><RxCrossCircled className="text-black text-xl" /></li>
                            <li><IoIosArrowDropdown className="text-black text-xl" /></li>
                          </ul>
                        </td>
                      </tr>
                    )


                  })}
                </tbody>
              </table>

              {/* Note Model */}
              {isNoteModalOpen && (
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
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
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
                        onClick={handleSaveNote}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center">No Order Available</p>
          )
        }






      </div>

      {(reporting?.shipowl || reporting?.selfship) && (
        <div className="overflow-x-auto mt-6 p-4 bg-white rounded-md ">
          <h2 className="text-2xl font-bold  font-dm-sans text-[#2B3674] p-5">Order Reporting</h2>
          <table className="rounded-md border-[#DFEAF2] w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase text-gray-700">
              <tr className="border-b border-[#DFEAF2]">
                <th className="px-6 py-3">Shipping Method</th>
                <th className="px-6 py-3">Order Count</th>
                <th className="px-6 py-3">Total Product Cost</th>
                <th className="px-6 py-3">Delivered Orders</th>
                <th className="px-6 py-3">RTO Orders</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Shipowl</td>
                <td className="px-6 py-4">{reporting.shipowl?.orderCount}</td>
                <td className="px-6 py-4">₹{reporting.shipowl?.totalProductCost}</td>
                <td className="px-6 py-4">{reporting.shipowl?.deliveredOrder}</td>
                <td className="px-6 py-4">{reporting.shipowl?.rtoOrder}</td>
              </tr>

              <tr className="border-b border-[#DFEAF2] hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Selfship - Prepaid</td>
                <td className="px-6 py-4">{reporting.selfship?.prepaid?.orderCount}</td>
                <td className="px-6 py-4">₹{reporting.selfship?.prepaid?.totalProductCost}</td>
                <td className="px-6 py-4">{reporting.selfship?.prepaid?.deliveredOrder}</td>
                <td className="px-6 py-4">{reporting.selfship?.prepaid?.rtoOrder}</td>
              </tr>

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
      )}

      {isModalOpen && tracking?.trackingData && (
        <div className="fixed px-5 inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg p-6 relative">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tracking Details</h2>

            <div className="mb-4">
              <p><span className="font-medium">AWB Number:</span> {tracking.awb_number}</p>
              <p><span className="font-medium">Current Status:</span> {tracking.trackingData.current_status?.status_title}</p>
              <p><span className="font-medium">Description:</span> {tracking.trackingData.current_status?.status_description}</p>
              <p><span className="font-medium">Updated At:</span> {tracking.trackingData.current_status?.event_date}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tracking History</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border px-4 py-2 text-left">Status</th>
                      <th className="border px-4 py-2 text-left">Description</th>
                      <th className="border px-4 py-2 text-left">Location</th>
                      <th className="border px-4 py-2 text-left">Code</th>
                      <th className="border px-4 py-2 text-left">Event Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracking.trackingData.data?.map((event, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{event.status_title}</td>
                        <td className="px-4 py-2">{event.status_description}</td>
                        <td className="px-4 py-2">{event.status_location || "—"}</td>
                        <td className="px-4 py-2">{event.status_code || "—"}</td>
                        <td className="px-4 py-2">{event.event_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {isBarCodePopupOpen && (
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
      )}

    </div>


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