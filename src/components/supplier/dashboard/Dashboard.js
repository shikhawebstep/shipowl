"use client"

import { useEffect } from "react";
import { useSupplier } from "../middleware/SupplierMiddleWareContext";
import CourierDetails from "./CourierDetails";
import DailyDeliveryChart from "./DailyDeliveryChart";
import DashboardCards from "./DashboardCards";
import FinancialSummary from "./FinancialSummary";
import OrdersLineChart from "./OrdersLineChart";
import RecentOrders from "./RecentOrders";
import SkuOrders from "./SkuOrders";
import SkuTable from "./SkuTable";

export default function Dashboard() {
  const { verifySupplierAuth } = useSupplier();
  useEffect(() => {
    verifySupplierAuth();
  }, [verifySupplierAuth]);


  return (
    <>
      <div>
        <div className="md:flex gap-4 justify-between items-start">
          <DashboardCards />
          <DailyDeliveryChart />
          <OrdersLineChart />
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 my-10 gap-5">
          <SkuTable />
          <RecentOrders />
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
          <FinancialSummary />
          <CourierDetails />
        </div>
        <div className="mt-10">
          <SkuOrders />
        </div>
      </div>
    </>
  )
}
