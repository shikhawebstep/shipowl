
"use client"
import { useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import Link from 'next/link';
import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
export default function List() {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const Couriers = [
        {
            id: 1,
            name: "DTDC",
            code: "DTDC",
            description: "demo4.in",
        },
        {
            id: 2,
            name: "Blue Dart",
            code: "BLUEDART",
            description: "demo.com",
        },
        {
            id: 3,
            name: "Delhivery",
            code: "DELHIVERY",
            description: "demo1.com",
        },
        {
            id: 4,
            name: "Ecom Express",
            code: "ECOMEXP",
            description: "demo3.in",
        },
    ];

    const [selected, setSelected] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const totalPages = Math.ceil(Couriers.length / perPage);
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentData = Couriers.slice(indexOfFirst, indexOfLast);

    return (
        <>

            <div className="bg-white lg:w-8/12 rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674]">API Credentials</h2>
                    <div className="flex gap-3  flex-wrap items-center">
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
                        <div className="flex justify-start gap-5 items-end">
                            <button className='bg-[#4285F4] text-white rounded-md p-3 px-8'><Link href="/admin/api/create">Add New</Link></button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto w-full relative">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">API Key</th>
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Title</th>
                                <th className="p-2 whitespace-nowrap px-5 text-left uppercase">description</th>
                                <th className="p-2 whitespace-nowrap px-5 text-center uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((item) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 whitespace-nowrap px-5">
                                        <div className="flex items-center">
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
                                            {item.name}
                                        </div>

                                    </td>
                                    <td className="p-2 whitespace-nowrap px-5">{item.code}<br /></td>
                                    <td className="p-2 whitespace-nowrap px-5">{item.description}<br /></td>
                                    <td className="p-2 px-5 text-[#8F9BBA] text-center">

                                        <button className='p-2 px-3 rounded-md bg-orange-500 text-white'>
                                            Edit
                                        </button>
                                        <button className='p-2 px-3 ms-2  rounded-md bg-red-500 text-white'>
                                            Delete
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
