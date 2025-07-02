"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaSearch, FaBell, FaChevronDown, FaSignOutAlt } from "react-icons/fa";
import Image from "next/image";
import userImage from "@/app/images/userimage.png";
import { useSupplier } from "./middleware/SupplierMiddleWareContext";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { verifySupplierAuth } = useSupplier();

  const pageTitles = {
    "/supplier": "Dashboard",
    "/supplier/product/": "Product",
    "/supplier/product/request/": "New Product Request",
    "/supplier/orders/": "Orders",
    "/supplier/warehouse/": "Warehouse",
    "/supplier/rto-orders/": "RTO Orders",
    "/supplier/profile/": "Profile",
    "/supplier/settings/": "Settings",
    "/supplier/billings/": "Billings",
    "/supplier/payment/": "Payment",
    "/supplier/terms/": "Terms & Conditions",
    "/supplier/add-warehouse/": "Add Warehouse",
    "/supplier/add-product/": "Add Product",
    "/supplier/brand/create/": "Add Brand",
    "/supplier/brand/list/": "Brand List",
    "/supplier/brand/update/": "Brand Update",
    "/supplier/category/create/": "Add Category",
    "/supplier/category/update/": "Update Category",
    "/supplier/category/list/": "Category List",
    "/supplier/product/not-my/": "Other Products",
    "/supplier/product/my/": "My Products",
    "/supplier/product/request/": "My Inventory",
    "/supplier/sub-user/create/": "Sub user Create",
    "/supplier/sub-user/update/": "Sub user Update",
    "/supplier/sub-user/list/": "Sub user List",
  };

  const currentPage = pageTitles[pathname] || "Dashboard";

  const [userName, setUserName] = useState('');
  const [activePanel, setActivePanel] = useState('');

useEffect(() => {
  const data = JSON.parse(localStorage.getItem("shippingData"));
  if (data) {
    setUserName(data?.supplier?.name || 'User');
    setActivePanel(data?.project?.active_panel || 'Panel');
  }
}, []);


  const logout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your supplier account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, log me out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("shippingData");
        verifySupplierAuth();
        Swal.fire({
          icon: "success",
          title: "Logged out",
          text: "You have been logged out successfully.",
          timer: 1500,
          showConfirmButton: true,
        });
      }
    });
  };

  return (
    <header className="md:flex items-center md:mt-16 mt-10 lg:mt-0 justify-between lg:py-7 px-3 p-2 pt-6">
      <div className="md:w-4/12">
        <p className="text-sm text-[#707EAE]">Pages / {currentPage}</p>
        <h1 className="lg:text-4xl text-xl mt-3 font-bold text-[#2B3674]">
          {currentPage}
        </h1>
      </div>

      <div className="flex items-center mt-5 md:mt-0 justify-end space-x-4 md:w-8/12">
        <button className="bg-white hidden md:flex px-10 py-4 gap-8 rounded-full font-semibold text-[#2B3674] items-center space-x-2">
          <span>07/26/2024</span>
          <span>
            <FaChevronDown />
          </span>
        </button>

        <div className="bg-white w-full md:w-auto rounded-full p-2 flex justify-baseline md:gap-4 gap-1">
          <div className="relative w-9/12">
            <FaSearch className="absolute md:left-3 right-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="md:pl-10 w-full pl-4 pr-4 py-2 bg-[#F4F7FE] rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button className="relative p-2">
            <FaBell className="text-gray-500" />
            <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium whitespace-nowrap">{userName}</p>
            <p className="text-xs text-gray-500">{activePanel}</p>
          </div>

          <Image
            src={userImage}
            alt="User Avatar"
            onClick={() => router.push("/supplier/profile")}
            className="w-10 h-10 rounded-full border-2 border-white shadow cursor-pointer"
          />
        </div>

        <button
          onClick={logout}
          className="bg-orange-500 p-1 rounded-full h-10 w-10 flex items-center justify-center"
        >
          <FaSignOutAlt className="text-white" />
        </button>
      </div>
    </header>
  );
}
