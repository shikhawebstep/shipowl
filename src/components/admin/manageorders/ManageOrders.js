"use client";

import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiFileEditFill } from "react-icons/ri";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";
import { IoIosArrowDropdown } from "react-icons/io";
import { MoreHorizontal } from "lucide-react";
import { IoMdRefresh } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { FiDownloadCloud } from "react-icons/fi";
import { FaFilter, FaCheck } from "react-icons/fa";

export default function ManageOrders() {
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [selected, setSelected] = useState([]);
    const handleCheckboxChange = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    const [activeTab, setActiveTab] = useState("pending");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const data = {
        pending: [
            {
                channel: "Shopify",
                order_id: "#ID285800",
                date_and_time: "15 Aug 24, 01:43 AM",
                product_details: {
                    product_name: "Product Name",
                    sku: 2584026,
                    Qty: 1,
                },
                price: 580,
                order_value: 580,
                status: "unpaid",
                Order_Tags: ["Repeat Customer", "Label Generated", "Warehouse Model"],
                seller_tag: null,
                shipment: {
                    id: "#ODR85178048081",
                    status: "Order Placed",
                    provider: "Shiprocket / Right Traders",
                    date: "Aug 18, 2024 01:54 PM",
                },
            },
            {
                channel: "Wix",
                order_id: "#ID285800",
                date_and_time: "15 Aug 24, 01:43 AM",
                product_details: {
                    product_name: "Product Name",
                    sku: 2584026,
                    Qty: 1,
                },
                price: 580,
                order_value: 580,
                status: "unpaid",
                Order_Tags: ["Repeat Customer", "Label Generated", "Warehouse Model"],
                seller_tag: null,
                shipment: {
                    id: "#ODR85178048081",
                    status: "Order Placed",
                    provider: "Shiprocket / Right Traders",
                    date: "Aug 18, 2024 01:54 PM",
                },
            },
        ],
        confirmed: [],
        shipped: [],
        closed: [],
    };
    const tabs = [
        { id: "pending", label: "Pending", count: data.pending.length },
        { id: "confirmed", label: "Confirmed", count: data.confirmed.length },
        { id: "shipped", label: "Shipped", count: data.shipped.length },
        { id: "closed", label: "Closed", count: data.closed.length },
        {
            id: "all-orders",
            label: "All Orders",
            count: Object.values(data).flat().length // Sum of all orders
        },
    ];

    const [filter, setFilter] = useState("Actual Ratio");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 7); // YYYY-MM format
    });


    const orders = activeTab === "all-orders" ? Object.values(data).flat() : data[activeTab] || [];
    const totalPages = Math.ceil(orders.length / perPage);
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentData = orders.slice(indexOfFirst, indexOfLast);

    return (
        <div className=" w-full ">
            <div className="w-full py-3">
                <label className="block  font-bold text-gray-700">
                    Select Dropshipper
                </label>
                <select className="w-full mt-1 px-3 py-3 border-[#DFEAF2] bg-white border rounded-lg ">
                    <option></option>
                </select>
            </div>
            <h2 className=" text-2xl font-lato font-semibold text-[#F98F5C]">Manage Orders</h2>

            <div className=" w-2/12 border-b-3  border-[#F98F5C] mt-1 mb-4"></div>
            <div className=" bg-white rounded-xl p-5">
                {/* Tabs */}
                <div className=" flex lg:gap-14 overflow-auto gap-3 border-b border-[#F4F5F7]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 text-lg whitespace-nowrap  ${activeTab === tab.id ? "border-b-3 font-bold border-orange-500 text-orange-500" : "text-[#718EBF] font-medium"
                                }`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setCurrentPage(1);
                            }}
                        >
                            {tab.label} ({tab.count}) {/* Displaying the count */}
                        </button>
                    ))}
                </div>
            </div>
            <div className=" flex flex-wrap gap-2 my-7 items-end justify-between">
                <div className=" flex flex-wrap gap-2">
                    <button className="font-dm-sans bg-[#F98F5C] text-white font-bold px-4 py-2 rounded-md text-sm">New (0)</button>
                    <button className="font-dm-sans bg-white text-[#2C3454] font-bold px-4 py-2 rounded-md text-sm">Waiting For Acceptance (0)</button>
                    <button className="font-dm-sans bg-white text-[#2C3454] font-bold px-4 py-2 rounded-md text-sm">Failed to Book (0)</button>
                    <button className="font-dm-sans bg-white text-[#2C3454] font-bold px-4 py-2 rounded-md text-sm">More (0)</button>

                </div>
                <div className=" flex flex-wrap lg:justify-end justify-normal gap-2">

                    <button className="font-dm-sans flex items-center gap-2 bg-[#061F4A] text-white font-bold px-4 py-2 rounded-md text-sm"><FaFilter className="ms-2" />Filters</button>
                    <button className="font-dm-sans bg-[#EE5D50] text-white font-bold px-4 py-2 rounded-md text-sm">Bulk Cancel</button>
                    <button className="font-dm-sans bg-[#4C82FF] text-white font-bold px-4 py-2 rounded-md text-sm">Bulk Approve order</button>
                    <button className="font-dm-sans bg-[#F98F5C] text-white font-bold px-4 py-2 rounded-md text-sm">Import</button>
                    <button className="font-dm-sans bg-[#05CD99] text-white font-bold px-4 py-2 rounded-md text-sm">Export</button>
                </div>
            </div>
            <div className=" bg-white p-4 rounded-2xl my-5 font-dm-sans">
                <div className="md:flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2B3674] font-dm-sans">Order</h2>
                    <div className="flex gap-3  flex-wrap items-center">
                        <span className="font-bold text-[#2B3674]  font-dm-sans">Clear Filters</span>
                        <span><IoMdRefresh className="text-red-600 text-xl" /></span>
                        <span><IoSettingsOutline className="text-xl" /></span>
                        <span><FiDownloadCloud className="text-red-400 text-xl" /></span>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-[#4318FF] font-dm-sans text-sm outline-0 text-white md:w-[120px] font-normal  px-2 py-2 rounded-md"
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
                <div className=" overflow-x-auto font-dm-sans">
                    {currentData.length > 0 && (
                        <table className=" w-full border-collapse">
                            <thead>
                                <tr className=" text-[#A3AED0] border-b border-[#E9EDF7]">
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">
                                        <div className="flex items-center">
                                            <label className="flex items-center cursor-pointer me-2">
                                                <input
                                                    type="checkbox"
                                                    className="peer hidden"
                                                />
                                                <div className="w-4 me-2 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                  peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                    <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                                </div>

                                            </label>
                                            <span>Channel</span>
                                        </div>

                                    </th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Order ID</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Items</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Payment Info</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Order Tags</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Seller Tags</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Shipment Details</th>
                                    <th className="font-dm-sans whitespace-nowrap p-3 text-left uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((order, index) => (
                                    <tr key={index} className=" text-[#8F9BBA] align-sub font-semibold border-b border-[#E9EDF7]">
                                        <td className=" p-3 font-dm-sans whitespace-nowrap text-black font-bold">
                                            <label className="flex items-center cursor-pointer me-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(index)}
                                                    onChange={() => handleCheckboxChange(index)}
                                                    className="peer hidden"
                                                />
                                                <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center 
                  peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                                                    <FaCheck className=" peer-checked:block text-white w-3 h-3" />
                                                </div>
                                                <span className="ms-2">{order.channel}</span>
                                            </label></td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap text-black">{order.order_id} <span className=" block text-[#8F9BBA]">{order.date_and_time}</span></td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap text-[#2B3674]">{order.product_details.product_name} <span className=" block text-[#8F9BBA] ">SKU:{order.product_details.sku}</span><span className=" block text-[#8F9BBA] ">Qty:{order.product_details.Qty}</span></td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap text-[#2B3674]">COD:{order.price} <span className=" block text-[#8F9BBA]">Order Value:{order.order_value}</span> <span className={` capitalize ${order.status == "unpaid" ? "text-[#E5252A]" : "text-green-500"}`}>{order.status}</span></td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap">
                                            {order.Order_Tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-xs text-center p-2 rounded-md block mb-1 ${tag === "Repeat Customer"
                                                        ? "bg-[#00b69b3d] text-[#00B69B]"
                                                        : tag === "Label Generated"
                                                            ? "text-[#F98F5C] bg-[#f98e5c48]"
                                                            : "text-[#5CA4F9] bg-[#5ca5f954]"
                                                        }`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap">{order.seller_tag || 'NA'}</td>
                                        <td className=" p-3 font-dm-sans whitespace-nowrap">
                                            <span className="font-dm-sans text-black ">{order.shipment.id}</span><br />
                                            <span className="font-dm-sans  text-[#05CD99]">{order.shipment.status}</span><br />
                                            <span className="font-dm-sans  text-[#718EBF]">{order.shipment.provider}</span><br />
                                            <span className="font-dm-sans text-sm text-[#718EBF]">{order.shipment.date}</span>
                                        </td>
                                        <td className=" p-3 whitespace-nowrap">
                                            <ul className=" flex gap-2 justify-between">
                                                <li><RiFileEditFill className=" text-black text-2xl" /></li>
                                                <li><IoCloudDownloadOutline className=" text-black text-2xl" /></li>
                                                <li><RxCrossCircled className=" text-black text-2xl" /></li>
                                                <li><IoIosArrowDropdown className=" text-black text-2xl" /></li>
                                            </ul>
                                            <button onClick={() => setIsNoteModalOpen(true)} className=" text-[#F98F5C] border rounded-md font-dm-sans  p-1 px-2 w-full  mt-2 text-sm">
                                                View / Add Notes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {currentData.length == 0 && (

                        <p className=" text-center font-bold text-xl font-dm-sans">No Data Found</p>
                    )}
                </div>

                {/* Pagination */}
                <div className=" flex justify-end  items-center mt-4 p-4 pt-">
                    <div className=" flex gap-1 items-center">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className=" px-3 py-1 font-dm-sans text-[#2B3674] rounded mx-1 disabled:opacity-50 flex items-center gap-1"
                        >
                            <MdKeyboardArrowLeft /> Previous
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`font-dm-sans px-3 py-1 text-[#2B3674] rounded mx-1 ${currentPage === index + 1 ? "bg-[#2B3674] text-white" : ""
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className=" px-3 py-1 font-dm-sans text-[#2B3674] rounded mx-1 disabled:opacity-50 flex items-center gap-1"
                        >
                            Next <MdKeyboardArrowRight />
                        </button>
                    </div>

                    {/* Per Page Selection */}
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className=" border-[#2B3674] bg-[#F8FBFF] text-[#2B3674] rounded px-3 py-2 font-semibold"
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
