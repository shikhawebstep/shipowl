import { useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import { FaFilePdf } from "react-icons/fa6";

import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
export default function Ledger() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const warehouseData = [
        {
            id: 1,
            invoice_no: '3198/2023/S-00241',
            date: "27-06-2023",
            invoice_period: "JAN",
            invoice_amount: '₹161',
            pdf_link: '3198/2023/S-00241',
        },
        {
            id: 2,
            invoice_no: '3198/2023/S-00241',
            date: "27-06-2023",
            invoice_period: "JAN",
            invoice_amount: '₹161',
            pdf_link: '3198/2023/S-00241',
        },
        {
            id: 3,
            invoice_no: '3198/2023/S-00241',
            date: "27-06-2023",
            invoice_period: "JAN",
            invoice_amount: '₹161',
            pdf_link: '3198/2023/S-00241',
        },
        {
            id: 4,
            invoice_no: '3198/2023/S-00241',
            date: "27-06-2023",
            invoice_period: "JAN",
            invoice_amount: '₹161',
            pdf_link: '3198/2023/S-00241',
        },
        {
            id: 5,
            invoice_no: '3198/2023/S-00241',
            date: "27-06-2023",
            invoice_period: "JAN",
            invoice_amount: '₹161',
            pdf_link: '3198/2023/S-00241',
        },

    ];
    const [selected, setSelected] = useState([]);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 7); // YYYY-MM format
    });
    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };


    const totalPages = Math.ceil(warehouseData.length / perPage);
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentData = warehouseData.slice(indexOfFirst, indexOfLast);
    return (
        <>
            <div className="filtred-box py-5 lg:flex items-end gap-3">
                <div className="grid md:grid-cols-2 lg:w-7/12 grid-cols-1 gap-3">
                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">AWB Number</label>
                        <input type="text" name="" id="" placeholder="AWB58202140" className="bg-white text-[#718EBF] border p-3 w-full font-bold border-[#DFEAF2] rounded-xl" />
                    </div>
                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">Select Month:</label>
                        <select name="" id="" className="bg-white text-[#718EBF] border p-3 w-full font-bold border-[#DFEAF2] rounded-xl" >
                            <option value="All">All</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-3 lg:mt-0 lg:w-5/12">
                    <button className="rounded-xl py-3 px-6 bg-[#4285F4] text-white">Apply</button>
                    <button className="rounded-xl py-3 px-6 bg-[#EA4335] text-white">Reset</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674]">Ledger & Invoice</h2>
                    <div className="flex gap-3  mt-3 lg:mt-0  flex-wrap items-center">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="outline-0 text-[#A3AED0] bg-[#F4F7FE] p-2 rounded-md"
                        />
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

                <div className="overflow-x-auto ">
                    <table className="w-full ">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-3 px-5 whitespace-nowrap text-left uppercase">

                                    <div className="flex lg:gap-7 gap-2">
                                        <label className="flex items-center cursor-pointer me-2">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                            />
                                            <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                                            peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                            </div>
                                        </label><span>Invoice No. #</span>
                                    </div>
                                </th>
                                <th className="p-3 px-5 whitespace-nowrap text-left uppercase">Invoice Date</th>
                                <th className="p-3 px-5 whitespace-nowrap text-left uppercase text-red-500">Invoice Period</th>
                                <th className="p-3 px-5 whitespace-nowrap text-left uppercase">Invoice Amount</th>
                                <th className="p-3 px-5 whitespace-nowrap text-left uppercase">Pdf File Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((item) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-3 whitespace-nowrap px-5"> <div className="flex items-center  lg:gap-7 gap-2">
                                        <label className="flex items-center cursor-pointer me-2">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(item.id)}
                                                onChange={() => handleCheckboxChange(item.id)}
                                                className="peer hidden"
                                            />
                                            <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                                                                            peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                            </div>
                                        </label>
                                        {item.invoice_no}
                                    </div></td>
                                    <td className="p-3 px-5 whitespace-nowrap">{item.date}</td>
                                    <td className="p-3 px-5 whitespace-nowrap text-red-500">
                                        {item.invoice_period}
                                    </td>
                                    <td className="p-3 px-5 whitespace-nowrap">{item.invoice_amount}</td>
                                    <td className="p-3 px-5 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <FaFilePdf className="text-red-500 text-2xl " />
                                            {item.pdf_link}
                                        </div>
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
    )
}
