import { FaWallet } from "react-icons/fa";
import { useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { MoreHorizontal } from "lucide-react";
import { FaCheck } from "react-icons/fa"; // FontAwesome Check icon
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import { format } from 'date-fns'
export default function BillingList() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const warehouseData = [
        {
            id: 1,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 5,
            transction_id: '#ID58208',
            credit: 5,
            debit: 5,
            close_balance: 5,
            model: 'Warehouse',
            description: null,
        },
        {
            id: 2,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 9,
            transction_id: '#ID58208',
            credit: 3,
            debit: 8,
            close_balance: 7,
            model: 'RTO',
            description: null,
        },
        {
            id: 3,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 9,
            transction_id: '#ID58208',
            credit: 3,
            debit: 8,
            close_balance: 7,
            model: 'RTO',
            description: null,
        },
        {
            id: 4,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 9,
            transction_id: '#ID58208',
            credit: 3,
            debit: 8,
            close_balance: 7,
            model: 'RTO',
            description: null,
        },
        {
            id: 5,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 9,
            transction_id: '#ID58208',
            credit: 3,
            debit: 8,
            close_balance: 7,
            model: 'RTO',
            description: null,
        },
        {
            id: 6,
            date: "31/7/24",
            txn_type: "#SKU58208",
            ref_no: 9,
            transction_id: '#ID58208',
            credit: 3,
            debit: 8,
            close_balance: 7,
            model: 'RTO',
            description: null,
        }
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
    const [range, setRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    ])
    const [showPicker, setShowPicker] = useState(false)

    const totalPages = Math.ceil(warehouseData.length / perPage);
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentData = warehouseData.slice(indexOfFirst, indexOfLast);
    return (
        <>
            <div className="filtred-box py-5 xl:flex flex-wrap items-end justify-between">
                <div className="grid md:grid-cols-3 xl:w-7/12  grid-cols-1 gap-3">
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
                        <label htmlFor="" className="text-[#232323] font-medium block">Type:</label>
                        <select name="" id="" className="bg-white text-[#718EBF] border p-2 w-full font-bold border-[#DFEAF2] rounded-xl" >
                            <option value="All">All</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="" className="text-[#232323] font-medium block">Select Model</label>
                        <select name="" id="" className="bg-white text-[#718EBF] border p-2 w-full font-bold border-[#DFEAF2] rounded-xl" >
                            <option value="All">All</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 flex-wrap my-5 xl:my-0 justify-center xl:w-3/12">
                    <button className="rounded-xl py-2 px-4 bg-[#4285F4] text-white text-sm">Apply</button>
                    <button className="rounded-xl py-2 px-4 bg-[#EA4335] text-white text-sm">Reset</button>
                    <button className="rounded-xl py-2 px-4 bg-[#F98F5C] text-white text-sm">Export</button>
                </div>
                <div className=" xl:w-2/12">

                    <div className="bg-[#2D3748] rounded-md p-4">
                        <div className="flex gap-3">
                            <div className="bg-[#F98F5C] h-12 w-12 flex justify-center items-center rounded-md ">
                                <FaWallet className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white border-b text-sm">Wallet Balance</h3>
                                <p className="text-white">+$2000</p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <div className="bg-white rounded-3xl p-5">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674]">Billing Details</h2>
                    <div className="flex gap-3 mt-3 lg:mt-0  flex-wrap items-center">
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
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">
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
                                        </label><span>Date</span>
                                    </div>

                                </th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Txn Type</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase text-red-500">Ref No#</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Transaction ID</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Credit(₹)</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Debit(₹)</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Closing Balance(₹)</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Model</th>
                                <th className="p-3 whitespace-nowrap px-5 text-left uppercase">Description</th>
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
                                        {item.date}
                                    </div></td>
                                    <td className="p-3 whitespace-nowrap px-5">{item.txn_type}</td>
                                    <td className="p-3 whitespace-nowrap px-5 text-red-500">
                                        {item.ref_no}
                                    </td>
                                    <td className="p-3 whitespace-nowrap px-5">{item.transction_id}</td>
                                    <td className="p-3 whitespace-nowrap px-5">{item.credit}</td>
                                    <td className="p-3 whitespace-nowrap px-5">{item.debit}</td>
                                    <td className="p-3 whitespace-nowrap px-5">{item.close_balance}</td>
                                    <td className="p-3 whitespace-nowrap px-5">

                                        <button className={`rounded-2xl px-4 py-2 w-[130px] text-white ${item.model == 'RTO' ? "bg-[#5CA4F9]" : "bg-[#01B574]"}`}>{item.model}</button>
                                    </td>


                                    <td className="p-3 whitespace-nowrap px-5">{item.description || 'NA'}</td>


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
