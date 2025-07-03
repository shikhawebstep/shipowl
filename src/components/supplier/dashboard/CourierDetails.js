"use client";
import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";

const initialData = [
  { id: 1, name: "Delhivery", total: 150, booked: 5, pp: 5, it: 5, dl: 5, exception: 5, rto: 0 },
  { id: 2, name: "Ekart", total: 120, booked: 8, pp: 8, it: 8, dl: 8, exception: 8, rto: 0 },
  { id: 3, name: "Shiprocket", total: 100, booked: 9, pp: 9, it: 9, dl: 9, exception: 9, rto: 0 },
  { id: 4, name: "ShadowFX", total: 20, booked: 6, pp: 6, it: 6, dl: 6, exception: 6, rto: 0 },
];

export default function CourierDetails() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // YYYY-MM format
  });
  const totalPages = Math.ceil(data.length / perPage);
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  return (
    <>

      <div className="rounded-3xl bg-white p-4">
        <div className="flex flex-wrap justify-between items-center py-3 ">
          <h2 className="md:text-2xl font-bold text-[#2B3674]">Courier Wise Details</h2>

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
          <table className="w-full border-collapse">
            <thead className="">
              <tr className="text-[#A3AED0] border-b  ">
                <th className="p-2 ps-0 px-5 whitespace-nowrap text-left uppercase">NAME </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Total </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Booked </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">PP </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">IT </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">DL </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Exception </th>
                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">RTO </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id} className="text-[#2B3674] font-semibold ">
                  <td className="p-2 ps-0 px-5 whitespace-nowrap">{item.name}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.total}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.booked}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.pp}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.it}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.dl}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.exception}</td>
                  <td className="p-2 px-5 whitespace-nowrap">{item.rto}</td>
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
    </>
  );
}
