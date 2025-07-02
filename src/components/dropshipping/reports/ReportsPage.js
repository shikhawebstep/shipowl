'use client';

import { useState } from 'react';
import { MdArrowDropDown } from "react-icons/md";
import CustomReport from './CustomReport';
import Shipment from './Shipment';
import TopNDR from './TopNDR';
import DailySummary from './DailySummary';
import StateWise from './StateWise';
import ProductWise from './ProductWise';

const ReportsPage = () => {


  const [activeTab, setActiveTab] = useState("custom-reports");

  const tabs = [
    { id: "custom-reports", label: "Custom Reports" },
    { id: "shipment-summary", label: "Shipment Summary" },
    { id: "top-ndr-reasons", label: "Top NDR Reasons" },
    { id: "daily-summary", label: "Daily Summary" },
    { id: "state-wise-summary", label: "State Wise Summary" },
    { id: "product-wise-summary", label: "Product Wise Summary" },
  ];

  return (
    <div className='md:px-5'>
      <h2 className="text-3xl font-semibold text-[#F98F5C]">Reports</h2>
      <div className="xl:w-[293px] border-b-3 mt-4  border-[#F98F5C] mb-4"></div>

      <div className="md:p-6 p-3 pb-0 bg-white shadow rounded-lg">

        <div defaultValue="custom-reports" className="mb-4">
          <div className="flex gap-3 overflow-auto border-b border-gray-400 ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`p-3 rounded-md whitespace-nowrap  ${activeTab === tab.id
                  ? " bg-[#F1F5F9] "
                  : ""
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button className='flex items-center gap-1'>More <MdArrowDropDown /> </button>
          </div>
          <div value="custom-reports">
            <div>
              <div className="py-6">
                <label className="block  font-medium mb-2">Date Range:</label>
                <input type="text" placeholder="09/01/2024 - 10/03/2024" className="mb-4 md:w-5/12 w-full border border-gray-400 p-3 rounded-md" />



                {activeTab === "custom-reports" && <CustomReport />}
                {activeTab === "shipment-summary" && <Shipment />}
                {activeTab === "top-ndr-reasons" && <TopNDR />}
                {activeTab === "daily-summary" && <DailySummary />}
                {activeTab === "state-wise-summary" && <StateWise />}
                {activeTab === "product-wise-summary" && <ProductWise />}
              

                <div className='flex justify-center'><button className="bg-[#05CD99] rounded-md text-white p-3">Generate</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


};

export default ReportsPage;
