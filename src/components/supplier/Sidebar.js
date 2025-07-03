"use client";
import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Home,
  Package,
  CreditCard,
  FileText,
  Settings,
  User,
  Warehouse,
  ClipboardList,
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import logo from "@/app/images/Shipowllogo.png";
import { useSupplier } from "./middleware/SupplierMiddleWareContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const { isSupplierStaff, extractedPermissions, checkSupplierRole } = useSupplier();
  useEffect(() => {
    checkSupplierRole();
  }, []);

  const actions = [
    "View Listing", "Update", "Create", "Listing", "View",
    "Soft Delete", "Permanent Delete", "Restore", "Trash Listing",
    "Bank Account Change Request", "Bank Account Change Request Review", "RTO", "Need to Raise", "Warehouse Collected", "report", "Add to List"
  ];

  const hasPermission = (module, actionList) => {
    return extractedPermissions.some(
      (perm) =>
        perm.module === module &&
        actionList.includes(perm.action) &&
        perm.status === true
    );
  };

  const menuItems = useMemo(() => [
    { name: "Dashboard", icon: Home, module: "Category", action: actions, href: "/supplier" },
    { name: "Products", icon: Package, module: "Product", action: actions, href: "/supplier/product/my" },
    { name: "New Product Request", icon: Package, module: "Product", action: actions, href: "/supplier/product/request" },
    { name: "Orders", icon: ClipboardList, module: "Order", action: actions, href: "/supplier/orders" },
    { name: "Warehouse", icon: Warehouse, module: "Warehouse", action: actions, href: "/supplier/warehouse" },
    { name: "Subuser Listing", icon: Package, module: "Sub User", action: actions, href: "/supplier/sub-user/list" },
    { name: "RTO Orders", icon: Package, module: "Order", action: actions, href: "/supplier/rto-orders" },
    { name: "Profile", icon: User, module: "My Profile", action: actions, href: "/supplier/profile" },
    { name: "Settings (In progress)", icon: Settings, module: "Category", action: actions, href: "/supplier/settings" },
    { name: "Billings (In progress)", icon: FileText, module: "Category", action: actions, href: "/supplier/billings" },
    { name: "Payment (In progress)", icon: CreditCard, module: "Category", action: actions, href: "/supplier/payment" },
    { name: "Terms & Condition (In progress)", icon: BadgeDollarSign, module: "Category", action: actions, href: "/supplier/terms" },
  ].filter((item) => {
    if (!isSupplierStaff) return true;
    if (item.children) return true;
    return extractedPermissions.length > 0 ? hasPermission(item.module, item.action) : true;
  }), [isSupplierStaff, extractedPermissions]);



  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 w-full left-0 z-50 p-2 bg-white rounded-lg lg:hidden shadow-md">
        <div className="flex justify-between items-center">
          <Image src={logo} alt="ShipOwl Logo" className="max-w-[100px]" />
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-8 h-8 text-[#2C3454]" />
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0000006b] bg-opacity-30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-72 sidebar rounded-md bg-white z-50 shadow-lg transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0 h-[600px] overflow-auto" : "-translate-x-full"} 
        lg:translate-x-0 lg:relative lg:h-full lg:w-full`}
      >
        <div className="flex items-center justify-between lg:justify-center p-5 border-b border-[#F4F7FE]">
          <Image src={logo} alt="ShipOwl Logo" className="max-w-[150px]" />
          <button className="lg:hidden p-1" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-[#2C3454]" />
          </button>
        </div>

        <nav className="p-3 h-full">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname === item.href;
              const isSubmenuOpen = openSubMenu === item.name;

              return (
                <li key={item.name} className="w-full">
                  {item.subMenu ? (
                    <>
                      <button
                        onClick={() => setOpenSubMenu(isSubmenuOpen ? null : item.name)}
                        className={`font-medium flex gap-2 items-center w-full p-3 rounded-lg border-l-4
                          ${isSubmenuOpen ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] text-[#2C3454] border-[#667085]"}
                          hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {isSubmenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <ul className="ml-6 mt-1 space-y-1">
                        {item.subMenu.map((sub) => {
                          const isSubActive = pathname === sub.href || pathname === sub.href;
                          return (
                            <li key={sub.name}>
                              <Link href={sub.href}>
                                <button
                                  onClick={() => setIsSidebarOpen(false)}
                                  className={`text-left font-normal flex gap-2 items-center w-full p-2 pl-4 rounded-lg border-l-4
                                    ${isSubActive ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] border-[#667085]"}
                                    hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]`}
                                >
                                  • <span>{sub.name}</span>
                                </button>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <Link href={item.href}>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className={`font-medium flex gap-2 items-center w-full p-3 rounded-lg border-l-4
                          ${isActive ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] border-[#667085]"}
                          hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
