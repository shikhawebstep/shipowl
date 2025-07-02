
"use client";
import { useState } from "react";
import Invoice from "./Invoice";
import Ledger from "./Ledger";
import Credit from "./Credit";
import BillingList from "./BillingList";

export default function Billing() {
  const [activeTab, setActiveTab] = useState("billing");
  const tabs = [
    { id: "billing", label: "Billing -  Wallet Transactions" },
    { id: "invoice", label: "Invoice" },
    { id: "ledger", label: "Ledger & Invoice" },
    { id: "credit", label: "Credit Ledger & Invoice" },
  ];
  return (
    <div>
     <div className="bg-white rounded-2xl p-3">
     <div className="w-full py-3">
                <label className="block text-lg font-bold text-gray-700">
                    Select Supplier
                </label>
                <select className="w-full mt-1 px-3 py-2 border-[#DFEAF2] bg-white border rounded-lg ">
                    <option></option>
                </select>
            </div>
     <div className="flex border-b overflow-auto md:gap-8 gap-3 border-[#F4F5F7]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 whitespace-nowrap text-lg  ${activeTab === tab.id
                ? "border-b-3 font-bold  border-orange-500 text-orange-500"
                : "text-[#718EBF] font-medium"
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
     </div>

      <div className="">
        {activeTab === "billing" && <BillingList />}
        {activeTab === "invoice" && <Invoice />}
        {activeTab === "ledger" && <Ledger />}
        {activeTab === "credit" && <Credit />}
      </div>

    </div>
  )
}
