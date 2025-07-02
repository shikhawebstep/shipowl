import React from "react";

const financialData = [
  { label: "GMV Processed", value: "$1,000" },
  { label: "GMV Processed Via COD", value: "$1,000" },
  { label: "GMV Processed Via Prepaid", value: "$1,000" },
  { label: "Payout Amount Due", value: "2935" },
  { label: "Next Payout", value: "$574.34", date: "7/29/24" },
  { label: "Payout Amount Settled", value: "$1,000" }
];

const FinancialSummary = () => {
  return (
    <div className="lg:grid grid-cols-2  flex flex-wrap gap-6 p-12 bg-white rounded-3xl">
      {financialData.map((item, index) => (
        <div key={index} className="flex flex-col">
          <span className="text-[#A3AED0] text-md">{item.label}</span>
          <span className="text-3xl font-bold text-[#2B3674] pt-1">{item.value}</span>
          {item.date && <span className="text-sm text-[#05CD99]">Date: {item.date}</span>}
        </div>
      ))}
    </div>
  );
};

export default FinancialSummary;
