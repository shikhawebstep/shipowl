'use client';
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import { format } from 'date-fns'
import { useState } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiFileEditFill } from "react-icons/ri";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";
import { IoIosArrowDropdown } from "react-icons/io";
import { IoMdRefresh } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { FiDownloadCloud } from "react-icons/fi";
import { MoreHorizontal } from "lucide-react";
import { FaCheck } from 'react-icons/fa';
const orders = [
  {
    id: '#ID285800',
    date: '15 Aug 24, 01:43 AM',
    product: 'Product Name',
    sku: '2584026',
    qty: 1,
    cod: '₹580',
    orderValue: '₹580',
    tags: ['Warehouse'],
    shipment: {
      id: '#ODR85178048081',
      status: 'Order Placed',
      provider: 'Shiprocket / Right Traders',
      date: 'Aug 18, 2024 01:54 PM',
    },
    sla: '27h 54m 57s',
    returnDate: '4 dec 2022',
    returnTracking: '#7436GDHD1',
    returnStatus: "Returned"
  },
  {
    id: '#ID285801',
    date: '15 Aug 24, 01:43 AM',
    product: 'Product Name',
    sku: '2584026',
    qty: 1,
    cod: '₹580',
    orderValue: '₹580',
    tags: ['Warehouse', 'RTO'],
    shipment: {
      id: '#ODR85178048081',
      status: 'Order Placed',
      provider: 'Shiprocket / Right Traders',
      date: 'Aug 18, 2024 01:54 PM',
    },
    sla: '27h 54m 57s',
    returnDate: '4 dec 2022',
    returnTracking: '#7436GDHD2',
    returnStatus: "In Progress"
  },
];
export default function RTO() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ])

  const handleSelect = (ranges) => {
    setRange([ranges.selection]);
  };

  const [showPicker, setShowPicker] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [filter, setFilter] = useState("Actual Ratio");
  const totalPages = Math.ceil(orders.length / perPage);
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentData = orders.slice(indexOfFirst, indexOfLast);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM format
  });
  const [selected, setSelected] = useState([]);

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  return (
    <div className='px-2 md:px-0'>
      <div className='bg-white rounded-md p-3 mb-4'>
        <div className="w-full py-2">
          <label className="block  font-bold text-gray-700">
            Select Supplier
          </label>
          <select className="w-full mt-1 px-2 py-2 border-[#DFEAF2] bg-white border rounded-lg ">
            <option></option>
          </select>
        </div>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className="text-[#232323] mb-1 block">From Date:</label>
            <input
              readOnly
              onClick={() => setShowPicker(!showPicker)}
              value={`${format(range[0].startDate, 'MM/dd/yyyy')} - ${format(range[0].endDate, 'MM/dd/yyyy')}`}
              className="bg-white outline-0 text-[#718EBF] border border-[#DFEAF2] px-3 py-2 rounded-xl w-full cursor-pointer"
              placeholder="Select date range"
            />

            {showPicker && (
              <div className="absolute z-50 mt-2">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleSelect}
                  moveRangeOnFirstSelection={false}
                  ranges={range}
                  className="shadow-xl"
                />
              </div>
            )}
          </div>

          <div> <label className='text-[#232323] font-medium block'>Order ID(s):</label>  <input type="text" placeholder="Separated By Comma" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div> <label className='text-[#232323] font-medium block'>Product Name</label>  <input type="text" placeholder="Name" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div> <label className='text-[#232323] font-medium block'>Product SKU</label>  <input type="text" placeholder="SKU" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div> <label className='text-[#232323] font-medium block'>Tag:</label>  <input type="text" placeholder="ALL" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div> <label className='text-[#232323] font-medium block'>Article Id:</label>  <input type="text" placeholder="ID" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div> <label className='text-[#232323] font-medium block'>Search Query:</label>  <input type="text" placeholder="Query" className="bg-white border text-[#718EBF] border-[#DFEAF2] mt-0 w-full p-2 rounded-xl" /></div>
          <div className="flex gap-2 items-end">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md">Apply</button>
            <button className="bg-red-500 text-white px-6 py-2 rounded-md">Reset</button>
          </div>
        </div>

        <div className='lg:flex gap-4 mb-5 items-center justify-between'>


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
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl">
        <div className="flex flex-wrap justify-between items-center mb-4 lg:px-3">
          <h2 className="text-2xl font-bold  font-dm-sans">RTO Order Details</h2>
          <div className="flex gap-3  flex-wrap items-center">
            <span className="font-bold   font-dm-sans">Clear Filters</span>
            <span><IoMdRefresh className="text-red-600 text-xl" /></span>
            <span><IoSettingsOutline className="text-xl" /></span>
            <span><FiDownloadCloud className="text-red-400 text-xl" /></span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#4318FF] font-dm-sans outline-0 text-white md:w-[120px] font-medium  px-2 py-2 rounded-md"
            >
              <option value="Actual Ratio ">Bulk Action</option>
            </select>
            <button className="bg-[#F4F7FE] rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">

              {/* Month Input */}
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
                    
                    
                  </ul>
                </div>
              )}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="">
              <tr className="text-[#A3AED0]  border-b  border-[#E9EDF7]">
                <th className="p-3 px-5 whitespace-nowrap uppercase text-left">
                  <div className='flex gap-2 items-center'>

                    <label className="flex items-center  cursor-pointer me-2">
                      <input
                        type="checkbox"
                        className="peer hidden"
                      />
                      <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                                                              peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                        <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                      </div>
                    </label>
                    <span>Order ID </span>
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Name</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Payment Info</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Model</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Shipment Details</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Return tracking number</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Return status</th>
                <th className="p-3 whitespace-nowrap uppercase text-left">Return Date</th>
                <th className="p-3 whitespace-nowrap uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((order) => (
                <tr key={order.id} className=" border-b align-top text-[#304174] font-semibold  border-[#E9EDF7]">

                  <td className="p-3 whitespace-nowrap px-5"> <div className="flex items-start  gap-2">
                    <label className="flex items-center mt-2 cursor-pointer me-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(order.id)}
                        onChange={() => handleCheckboxChange(order.id)}
                        className="peer hidden"
                      />
                      <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                                                              peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                        <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                      </div>
                    </label>
                    <span className=' '>{order.id} <br />
                      <span className=''>{order.date}</span>

                    </span>

                  </div>


                  </td>

                  <td className="p-3 whitespace-nowrap"><span className=''>{order.product}</span><br /><span className=" text-sm">SKU: {order.sku}<br /> Qty: {order.qty}</span></td>
                  <td className="p-3 whitespace-nowrap"> <span className=''>COD:{order.cod}</span><br /> <span className="">Order Value:{order.orderValue}</span></td>
                  <td className="p-3 space-y-1 whitespace-nowrap">
                    {order.tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`text-sm text-center text-white p-2  rounded-2xl  block ${tag === "Warehouse" ? "bg-[#01B574]" : "bg-[#5CA4F9] mr-1"
                          }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </td>

                  <td className="whitespace-nowrap p-3 "><span className=' '>{order.shipment.id}</span><br />
                    <span className="text-[#05CD99] ">{order.shipment.status}</span>
                    <br /><span className=''>{order.shipment.provider}</span><br /><span className="text-sm ">{order.shipment.date}</span></td>

                  <td className="p-3 whitespace-nowrap">{order.returnTracking}</td>
                  <td className="p-3 whitespace-nowrap"><span className={`rounded-md p-2 px-3 ${order.returnStatus == "Returned" ? "bg-[#00b69b36] text-[#00B69B]" : "bg-[#f98e5c2c] text-[#F98F5C]"}`}>{order.returnStatus}</span></td>
                  <td className="p-3 whitespace-nowrap ">{order.returnDate}</td>
                  <td className="p-2 whitespace-nowrap">
                    <ul className="flex gap-2 justify-between">
                      <li><RiFileEditFill className="text-black text-2xl" /></li>
                      <li><IoCloudDownloadOutline className="text-black text-2xl" /></li>
                      <li><RxCrossCircled className="text-black text-2xl" /></li>
                      <li><IoIosArrowDropdown className="text-black text-2xl" /></li>
                    </ul>
                    <button
                      onClick={() => setIsNoteModalOpen(true)}
                      className="text-[#F98F5C] border rounded-md font-dm-sans p-2 w-full mt-2 text-sm"
                    >
                      View / Add Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap lg:justify-end justify-center items-center mt-4 p-4 pt-0">
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border-[#2B3674] flex gap-1 items-center  rounded mx-1 disabled:opacity-50"
            >
              <MdKeyboardArrowLeft /> Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 hidden md:block py-1 border-[#2B3674]  rounded mx-1 ${currentPage === index + 1 ? "bg-[#2B3674] text-white" : ""}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border-[#2B3674] flex gap-1 items-center  rounded mx-1 disabled:opacity-50"
            >
              Next <MdKeyboardArrowRight />
            </button>
          </div>

          {/* Per Page Selection */}
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border-[#2B3674] bg-[#F8FBFF]  rounded px-3 py-2 font-semibold"
          >
            {[5, 10, 15].map((num) => (
              <option key={num} value={num}>
                {num} /Per Page
              </option>
            ))}
          </select>
        </div>
      </div>

      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-[#00000038] bg-opacity-50 flex items-center justify-center z-50">
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
      )}

    </div>
  );
}
