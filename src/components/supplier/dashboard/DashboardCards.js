"use client";
import { Info } from "lucide-react";
import icon from '@/app/images/Icon.png';
import Image from "next/image";
const cardData = [
  {
    title: "Total No Of Order",
    value: "574",
    change: "+1%",
    changeText: "since last month",
    iconColor: "",
  },
  {
    title: "New Orders",
    value: "154",
    iconColor: "",
    icon: icon
  },
  {
    title: "Processed Shipment",
    value: "154",
    iconColor: "",
    icon: icon
  },
  {
    title: "Penalized Orders",
    value: "1,000",
    textColor: "text-red-500",
    iconColor: "bg-red-500",
  },
  {
    title: "Total no of delivered",
    value: "1,000",
    iconColor: "",
  },
];

export default function DashboardCards() {
  return (
    <div className=" md:w-5/12 lg:grid grid-cols-1 flex overflow-auto md:grid-cols-2 gap-4 ">
      {cardData.map((card, index) => (
        <div
          key={index}
          className="p-4 bg-white rounded-3xl flex items-center gap-4 relative w-full whitespace-nowrap"
        >
          {/* Icon */}
          {card.icon && (
            <div className={`w-[56px] h-[56px] flex items-center justify-center ${card.iconColor} text-white rounded-full`}>
              <Image src={card.icon} alt={card.title} />
            </div>
          )}


          {/* Text Content */}
          <div>
            <h3 className={`${card.textColor || 'text-[#A3AED0]'} text-sm`}>{card.title}</h3>
            <p className={`text-2xl font-bold text-[#2B3674] `}>
              {card.value}
            </p>
            {card.change && (
              <p className="text-sm text-green-500">{card.change} <span className="text-[#A3AED0] ms-4">{card.changeText}</span></p>
            )}
          </div>

          {/* Info Icon */}
          <Info className="absolute top-2 lg:top-5 right-3 w-4 h-4 text-gray-400" />
        </div>
      ))}
    </div>
  );
}
