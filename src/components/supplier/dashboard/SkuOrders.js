"use client";
import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import productimage from '@/app/images/product1.png'
import productimage2 from '@/app/images/product2.png'
import productimage3 from '@/app/images/product3.png'
import productimage4 from '@/app/images/product4.png'
import productimage5 from '@/app/images/product5.png'
import Image from "next/image";
const initialData = [
  { id: 1, name: "Product Name", productImage: productimage, sku: "#SKU58208", manifested: 5, cancelled: 5, pickupPending: 5, inTransit: 5, outForDelivery: 5, ndr: 5, delivered: 5, rtoInTransit: 5, rtoInDelivered: 5, lostDamaged: 5, deliveredPercent: 5, rtoPercent: 5 },
  { id: 2, name: "Product Name", productImage: productimage2, sku: "#SKU5858", manifested: 4, cancelled: 4, pickupPending: 4, inTransit: 4, outForDelivery: 4, ndr: 4, delivered: 4, rtoInTransit: 4, rtoInDelivered: 4, lostDamaged: 4, deliveredPercent: 4, rtoPercent: 4 },
  { id: 3, name: "Product Name", productImage: productimage3, sku: "#SKU78208", manifested: 6, cancelled: 6, pickupPending: 6, inTransit: 6, outForDelivery: 6, ndr: 6, delivered: 6, rtoInTransit: 6, rtoInDelivered: 6, lostDamaged: 6, deliveredPercent: 6, rtoPercent: 6 },
  { id: 4, name: "Product Name", productImage: productimage4, sku: "#SKU98208", manifested: 8, cancelled: 8, pickupPending: 8, inTransit: 8, outForDelivery: 8, ndr: 8, delivered: 8, rtoInTransit: 8, rtoInDelivered: 8, lostDamaged: 8, deliveredPercent: 8, rtoPercent: 8 },
  { id: 5, name: "Product Name", productImage: productimage5, sku: "#SKU56208", manifested: 10, cancelled: 10, pickupPending: 10, inTransit: 10, outForDelivery: 10, ndr: 10, delivered: 10, rtoInTransit: 10, rtoInDelivered: 10, lostDamaged: 10, deliveredPercent: 10, rtoPercent: 10 },
];

export default function SkuOrders() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [filter, setFilter] = useState("Actual Ratio");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM format
  });
  const totalPages = Math.ceil(data.length / perPage);
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  return (
    <div className="md:p-8 p-3 rounded-3xl bg-white">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="md:text-2xl font-bold text-[#2B3674]">SKU Wise Orders Details</h2>
        <div className="flex gap-3  flex-wrap items-center">
          <span className="font-semibold text-[#2B3674]">Total: {data.length} Products</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#F4F7FE] outline-0 text-[#2B3674] font-bold  px-3 py-2 rounded-md"
          >
            <option value="Actual Ratio">Actual Ratio</option>
            <option value="Percentage Ratio">Percentage Ratio</option>
          </select>
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-[#A3AED0] border-b border-[#E9EDF7]">
              <th className="px-5 ps-0 py-3 whitespace-nowrap text-left uppercase">NAME</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">Manifested</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase text-red-500">Cancelled</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase text-yellow-500">Pickup Pending</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">In Transit</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">Out For Delivery</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">NDR</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">Delivered</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">RTO In Transit</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">RTO In Delivered</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">Lost/Damaged</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">Delivered (%)</th>
              <th className="px-5 py-3 whitespace-nowrap text-left uppercase">RTO (%)</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                <td className="px-5 ps-0 py-3 whitespace-nowrap">
                  <div className="flex items-center w-full gap-3">
                    <Image
                      src={item.productImage}
                      alt={item.name}
                      className="h-8 w-8 flex-shrink-0 rounded-md"
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                </td>

                <td className="px-5 py-3 whitespace-nowrap">{item.sku}</td>
                <td className="px-5 py-3 whitespace-nowrap text-red-500">{item.cancelled}</td>
                <td className="px-5 py-3 whitespace-nowrap text-yellow-500">{item.pickupPending}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.inTransit}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.outForDelivery}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.ndr}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.delivered}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.rtoInTransit}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.rtoInDelivered}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.lostDamaged}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.deliveredPercent}</td>
                <td className="px-5 py-3 whitespace-nowrap">{item.rtoPercent}</td>
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
