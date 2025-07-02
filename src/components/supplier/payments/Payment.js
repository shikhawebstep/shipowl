
"use client";
import { useState } from "react";
import PendingRequests from "./PendingRequests";
import CreatePayment from "./CreatePayment";

export default function Payment() {
  const [activeTab, setActiveTab] = useState("pending");
  const tabs = [
    { id: "pending", label: "Pending Payment" },
    { id: "created", label: "Created Payment" },
  ];
  return (
    <div>
      <div className="bg-white rounded-2xl md:p-7 p-3">
        <div className="flex lg:gap-10 gap-3 overflow-auto border-b border-[#F4F5F7]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-lg whitespace-nowrap  ${activeTab === tab.id
                ? "border-b-3 border-orange-500 font-bold text-orange-500"
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
        {activeTab === "pending" && <PendingRequests />}
        {activeTab === "created" && <CreatePayment />}
      </div>

    </div>
  )
}
