"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Info } from "lucide-react";

const data = [
  { time: "00", deliveries: 800 },
  { time: "04", deliveries: 600 },
  { time: "08", deliveries: 1400 },
  { time: "12", deliveries: 1000 },
  { time: "14", deliveries: 1200 },
  { time: "16", deliveries: 1600 },
  { time: "18", deliveries: 500 }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md rounded-xl px-4 py-2 text-sm">
        <p className="text-[#2B3674] font-semibold">{payload[0].payload.time}:00</p>
        <p className="text-[#2B3674]">Deliveries: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function DailyDeliveryChart() {
  return (
    <div className="bg-white p-5 my-5 md:my-0 rounded-2xl md:w-3/12">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#A3AED0] text-sm flex items-center">
          Daily Delivery <Info className="ml-1 w-4 h-4 text-[#A3AED0]" />
        </h3>
        <p className="text-green-500 text-sm font-medium">▲ +2.45%</p>
      </div>

      {/* Delivery Count */}
      <h2 className="text-3xl font-bold text-[#2B3674]">
        2579 <span className="text-[#A3AED0] font-normal text-lg">Delivered</span>
      </h2>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={20}>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#A3AED0", fontSize: 12, fontWeight: "bold", dy: 10 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />

          {/* Gradient for bars */}
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8C42" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#FF8C42" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <Bar
            dataKey="deliveries"
            fill="url(#colorGradient)"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
