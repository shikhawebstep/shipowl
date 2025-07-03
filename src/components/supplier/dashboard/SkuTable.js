"use client";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
import productimage from "@/app/images/product1.png";
import productimage2 from "@/app/images/product2.png";
import productimage3 from "@/app/images/product3.png";
import productimage4 from "@/app/images/product4.png";
import productimage5 from "@/app/images/product5.png";
import Image from "next/image";
const data = [
    { id: 1, name: "Product Name", sku: "#SKU58208", quantity: 5, product_image: productimage, booked: "24/04/2024" },
    { id: 2, name: "Product Name", sku: "#SKU5858", quantity: 4, product_image: productimage2, booked: "20/03/2024" },
    { id: 3, name: "Product Name", sku: "#SKU78208", quantity: 6, product_image: productimage3, booked: "26/02/2024" },
    { id: 4, name: "Product Name", sku: "#SKU98208", quantity: 8, product_image: productimage4, booked: "20/01/2024" },
    { id: 5, name: "Product Name", sku: "#SKU56208", quantity: 10, product_image: productimage5, booked: "24/01/2024" },
    { id: 6, name: "Product Name", sku: "#SKU44208", quantity: 3, product_image: productimage, booked: "15/01/2024" },
];

export default function SkuTable() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [selected, setSelected] = useState([]);
    const handleCheckboxChange = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 7); // YYYY-MM format
    });

    const totalPages = Math.ceil(data.length / perPage);
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentData = data.slice(indexOfFirst, indexOfLast);

    return (
        <div className="p-5 rounded-3xl bg-white">
            <div className="md:flex justify-between items-center">
                <h2 className="md:text-2xl font-bold text-[#2B3674]">SKU Wise Orders Details</h2>

                <div className="flex space-x-3 items-center">
                    <button className="bg-[#F4F7FE] rela px-4 py-2 text-sm rounded-lg flex items-center text-[#A3AED0]">
                        {/* Month Input */}
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="outline-0" />
                    </button>
                    <button onClick={() => setIsPopupOpen((prev) => !prev)} className="bg-[#F4F7FE] p-2 rounded-lg relative">
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
            <div className="overflow-x-auto py-3">
                <table className="w-full ">
                    <thead>
                        <tr className="text-[#A3AED0]">
                            <th className="p-2 px-5 ps-0 whitespace-nowrap text-left uppercase">
                                NAME 
                            </th>
                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                SKU 
                            </th>
                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                QUANTITY 
                            </th>
                            <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                BOOKED 
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item) => (
                            <tr key={item.id} className="text-[#2B3674] font-semibold">
                                <td className="p-2 px-5 whitespace-nowrap ps-0 me-7 md:me-0">
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer me-2">
                                            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => handleCheckboxChange(item.id)} className="peer hidden" />
                                            <div
                                                className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                  peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white"
                                            >
                                                <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                            </div>
                                        </label>

                                        <Image src={item.product_image} alt={item.name} className="h-8 w-8 me-3" />
                                        {item.name}
                                    </div>
                                </td>
                                <td className="p-2 px-5 whitespace-nowrap">{item.sku}</td>
                                <td className="p-2 px-5 whitespace-nowrap">{item.quantity}</td>
                                <td className="p-2 px-5 whitespace-nowrap">{item.booked}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap lg:justify-end justify-center items-center mt-4 p-4 pt-0">
                <div className="flex gap-1 items-center">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border-[#2B3674] flex gap-1  items-center  text-[#2B3674] rounded mx-1 disabled:opacity-50">
                        <MdKeyboardArrowLeft /> Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                        <button key={index} onClick={() => setCurrentPage(index + 1)} className={`px-3 hidden md:block py-1 border-[#2B3674] text-[#2B3674] rounded mx-1 ${currentPage === index + 1 ? "bg-[#2B3674] text-white" : ""}`}>
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
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border-[#2B3674] bg-[#F8FBFF] text-[#2B3674] rounded px-3 py-2 font-semibold">
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
