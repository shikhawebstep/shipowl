
"use client"
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

const ordersData = [
  { id: 1, name: "Product name", sku: "#SKU58208", quantity: 5, status: "Approved", date: "18 Apr 2024" },
  { id: 2, name: "Product name", sku: "#SKU58008", quantity: 8, status: "Cancel", date: "18 Apr 2024" },
  { id: 3, name: "Product name", sku: "#SKU48208", quantity: 9, status: "Error", date: "20 May 2024" },
  { id: 4, name: "Product name", sku: "#SKU38208", quantity: 6, status: "Approved", date: "12 Jul 2024" },
  { id: 5, name: "Product name", sku: "#SKU68208", quantity: 7, status: "Cancel", date: "05 Jun 2024" },
  { id: 6, name: "Product name", sku: "#SKU78208", quantity: 10, status: "Approved", date: "02 Aug 2024" },
];


const statusColors = {
  Approved: { icon: <FaCheckCircle className="text-green-500" />, color: "text-green-500" },
  Cancel: { icon: <FaTimesCircle className="text-red-500" />, color: "text-red-500" },
  Error: { icon: <FaExclamationTriangle className="text-yellow-500" />, color: "text-yellow-500" },
};

export default function RecentOrders() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM format
  });

  const totalPages = Math.ceil(ordersData.length / perPage);
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentData = ordersData.slice(indexOfFirst, indexOfLast);

  return (
    <div className=" rounded-3xl bg-white">
      <div className="md:flex justify-between items-center p-4">
        <h2 className="text-2xl font-bold text-[#2B3674]">Recent Orders</h2>

        <div className="flex space-x-3 items-center">
          <button className="bg-[#F4F7FE] rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">

            {/* Month Input */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="outline-0"
            />
          </button>
          <button
            onClick={() => setIsPopupOpen((prev) => !prev)}
            className="bg-[#F4F7FE] p-2 rounded-lg relative"
          >
            <MoreHorizontal className="text-[#F98F5C]" />
            {isPopupOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="">
            <tr className="text-[#A3AED0] border-b  border-[#E9EDF7]">
              <th className="p-3 px-4 whitespace-nowrap text-left">NAME </th>
              <th className="p-3 px-4 whitespace-nowrap text-left">SKU</th>
              <th className="p-3 px-4 whitespace-nowrap text-left">QUANTITY</th>
              <th className="p-3 px-4 whitespace-nowrap text-left">STATUS</th>
              <th className="p-3 px-4 whitespace-nowrap text-left">DATE</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id} className="text-[#2B3674] font-semibold ">
                <td className="p-3 px-4 whitespace-nowrap">{item.name}</td>
                <td className="p-3 px-4 whitespace-nowrap">{item.sku}</td>
                <td className="p-3 px-4 whitespace-nowrap">{item.quantity}</td>
                <td className={`p-3 px-4 whitespace-nowrap flex items-center gap-1 ${statusColors[item.status]?.color}`}>
                  {statusColors[item.status]?.icon} {item.status}
                </td>
                <td className="p-3 px-4 whitespace-nowrap">{item.date}</td>
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
            className="px-3 py-1 border-[#2B3674] flex gap-1  items-center  text-[#2B3674] rounded mx-1 disabled:opacity-50"
          >
            <MdKeyboardArrowLeft /> Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 hidden md:block py-1 border-[#2B3674] text-[#2B3674] rounded mx-1 ${currentPage === index + 1 ? "bg-[#2B3674] text-white" : ""
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border-[#2B3674] flex gap-1 items-center text-[#2B3674] rounded mx-1 disabled:opacity-50"
          >
            Next <MdKeyboardArrowRight />
          </button>
        </div>

        {/* Per Page Selection */}
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="border-[#2B3674] bg-[#F8FBFF] text-[#2B3674] rounded px-3 py-2 font-semibold"
        >
          {[5, 10, 15].map((num) => (
            <option key={num} value={num}>
              {num} /Per Page
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}
