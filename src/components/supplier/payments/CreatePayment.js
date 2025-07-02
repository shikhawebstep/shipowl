import { useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import { FaCheck } from "react-icons/fa";
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import { format } from 'date-fns'
export default function CreatePayment() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [range, setRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    ])
    const [showPicker, setShowPicker] = useState(false)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const warehouseData = [
        {
            id: 1,
            company_name: 'ABC Company',
            payment_cycle: "JAN - MAY",
            wallet_balance: '₹361',
            payment_amout: '₹161',
            model: 'RTO',
        },
        {
            id: 2,
            company_name: 'ABC Company',
            payment_cycle: "JAN - MAY",
            wallet_balance: '₹361',
            payment_amout: '₹161',
            model: 'RTO',
        },
        {
            id: 3,
            company_name: 'ABC Company',
            payment_cycle: "JAN - MAY",
            wallet_balance: '₹361',
            payment_amout: '₹161',
            model: 'Warehouse',
        },
        {
            id: 4,
            company_name: 'ABC Company',
            payment_cycle: "JAN - MAY",
            wallet_balance: '₹361',
            payment_amout: '₹161',
            model: 'RTO',
        },
        {
            id: 5,
            company_name: 'ABC Company',
            payment_cycle: "JAN - MAY",
            wallet_balance: '₹361',
            payment_amout: '₹161',
            model: 'Warehouse',
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
            <div className="filtred-box py-5 xl:flex md:px-0 px-4  items-end justify-between">
                <div className="xl:w-9/12 grid md:grid-cols-4 grid-cols-1 gap-3">
                    <div className="relative">
                        <label htmlFor="daterange" className="text-[#232323] font-medium block ">From Date:</label>
                        <input
                            readOnly
                            id="daterange"
                            onClick={() => setShowPicker(!showPicker)}
                            value={`${format(range[0].startDate, 'MM/dd/yyyy')} - ${format(range[0].endDate, 'MM/dd/yyyy')}`}
                            className="bg-white text-[#718EBF] border p-2 w-full font-bold border-[#DFEAF2] rounded-xl cursor-pointer"
                        />
                        {showPicker && (
                            <div className="absolute z-10 shadow-md rounded-md mt-2">
                                <DateRange
                                    editableDateInputs={true}
                                    onChange={item => setRange([item.selection])}
                                    moveRangeOnFirstSelection={false}
                                    ranges={range}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">Payment ID:</label>
                        <input type="text" name="" id="" placeholder="#PAY" className="bg-white text-[#718EBF] w-full border lg:p-3 lg:py-2 p-2 font-bold border-[#DFEAF2] rounded-xl" />
                    </div>
                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">Paid Status</label>
                        <input type="text" name="" id="" placeholder="ALL" className="bg-white text-[#718EBF] w-full border lg:p-3 lg:py-2 p-2  font-bold border-[#DFEAF2] rounded-xl" />
                    </div>

                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">Select Model</label>
                        <select name="" id="" className="bg-white text-[#718EBF] w-full border lg:p-3 lg:py-2 p-2  font-bold border-[#DFEAF2] rounded-xl" >
                            <option value="All">All</option>
                        </select>
                    </div>
                </div>
                <div className="flex xl:w-3/12 gap-3 mt-4 xl:mt-0 md:justify-end justify-normal">
                    <button className="rounded-xl  py-2 px-5 bg-[#4285F4] text-white">Apply</button>
                    <button className="rounded-xl  py-2 px-5 bg-[#EA4335] text-white">Reset</button>
                    <button className="rounded-xl  py-2 px-5 bg-[#F98F5C] text-white">Export</button>
                </div>
                <div>
                </div>

            </div>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674]">Payment</h2>
                    <div className="flex gap-3 md:mt-0 mt-3  flex-wrap items-center">
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

                <div className="overflow-x-auto ">
                    <table className="w-full ">
                        <thead>
                            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">
                                    <div className="flex lg:gap-14 gap-2">
                                        <label className="flex items-center cursor-pointer me-2">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                            />
                                            <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                            </div>
                                        </label><span className=''>Company Name</span>
                                    </div>

                                </th>
                                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Payment Cycle</th>
                                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Payable Amt. (B2B)</th>
                                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Wallet Balance</th>
                                <th className="p-2 px-5 whitespace-nowrap text-left uppercase">Model</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((item) => (
                                <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 px-5 whitespace-nowrap">
                                        <div className="flex items-center  lg:gap-14 gap-2">
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
                                            {item.company_name}
                                        </div></td>
                                    <td className="p-2 px-5 whitespace-nowrap">{item.payment_cycle}</td>
                                    <td className="p-2 px-5 whitespace-nowrap">
                                        {item.payment_amout}</td>
                                    <td className="p-2 px-5 whitespace-nowrap">{item.wallet_balance}</td>
                                    <td className="p-2 px-5 whitespace-nowrap">
                                        <button className={`rounded-2xl px-4 py-2 w-[130px] text-white ${item.model == 'RTO' ? "bg-[#5CA4F9]" : "bg-[#01B574]"}`}>{item.model}</button>

                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end items-center mt-4 p-4 pt-0">
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="md:px-3 px-2 py-1 border-[#2B3674] flex gap-1  items-center  text-[#2B3674] rounded mx-1 disabled:opacity-50"
                        >
                            <MdKeyboardArrowLeft /> Previous
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`md:px-3 px-2 hidden md:block py-1 border-[#2B3674] text-[#2B3674] rounded mx-1 ${currentPage === index + 1 ? "bg-[#2B3674] text-white" : ""
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="md:px-3 px-2 py-1 border-[#2B3674] flex gap-1 items-center text-[#2B3674] rounded mx-1 disabled:opacity-50"
                        >
                            Next <MdKeyboardArrowRight />
                        </button>
                    </div>

                    {/* Per Page Selection */}
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="border-[#2B3674] bg-[#F8FBFF] text-[#2B3674] rounded md:px-3 px-2 py-2 font-semibold"
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
