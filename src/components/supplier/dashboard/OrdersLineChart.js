"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";
import { MdBarChart } from "react-icons/md";

const data = [
  { month: "SEP", orders: 50, returns: 30 },
  { month: "OCT", orders: 75, returns: 50 },
  { month: "NOV", orders: 108, returns: 60 },
  { month: "DEC", orders: 90, returns: 55 },
  { month: "JAN", orders: 95, returns: 65 },
  { month: "FEB", orders: 100, returns: 70 },
];

export default function OrdersLineChart() {
  return (
    <div className="bg-white p-5 rounded-2xl  md:w-4/12">
      {/* Filters */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-2 text-[#A3AED0]">
          <button className="bg-[#F4F7FE] px-3 py-2 text-sm rounded-lg flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-[#A3AED0]" /> This Month
          </button>
          <button className="bg-[#F4F7FE] px-3 py-2 text-sm rounded-lg flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-[#A3AED0]" /> This Week
          </button>
        </div>
        <button className="bg-[#F4F7FE] p-2 rounded-lg">
          <MdBarChart className=" text-[#F98F5C]" />
        </button>
      </div>


      <h2 className="text-3xl font-bold">37.5K</h2>


      <div className="flex justify-start items-center gap-3">
        <p className="text-[#A3AED0] text-sm">Total Orders</p>
        <p className="text-green-500 text-sm font-medium">▲ +2.45%</p>
      </div>
      {/* Status Indicator */}
      <div className="flex items-center mt-2">
        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
        <span className="text-green-500 text-sm">On Track</span>
      </div>

      {/* Graph */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#A3AED0", fontSize: 12, fontWeight: "bold" }}
          />
          <YAxis hide />
          <Tooltip cursor={false} />
          <Line type="monotone" dataKey="orders" stroke="#FF8C42" strokeWidth={3} dot={{ r: 5 }} />
          <Line type="monotone" dataKey="returns" stroke="#6AD2FF" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div >
  );
}
