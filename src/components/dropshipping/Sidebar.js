"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { IoMdAnalytics } from "react-icons/io";
import {
  Home, ShoppingCart, Package, Gift, BarChart, CreditCard,
  FileText, Settings, Link, Volume2, MapPin, ChevronDown, X
} from "lucide-react";
import { HiBars3CenterLeft } from "react-icons/hi2";
import { FaShopify } from "react-icons/fa";
import { FileBarChart2 } from "lucide-react";
import Image from "next/image";
import Logo from "@/app/assets/Shipowl-logo1.png";
import { useDropshipper } from "./middleware/DropshipperMiddleWareContext";

const actions = [
  "View Listing", "Update", "Create", "Listing", "View",
  "Soft Delete", "Permanent Delete", "Restore", "Trash Listing",
  "Bank Account Change Request", "Bank Account Change Request Review",
  "RTO", "Need to Raise", "Warehouse Collected", "report","Push to Shopify"
];

const Sidebar = () => {
  const { checkDropshipperRole, isDropshipperStaff, extractedPermissions } = useDropshipper();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkDropshipperRole();
  }, []);

const hasPermission = (module, actionList) => {
  return extractedPermissions.some(
    (perm) =>
      perm.module === module &&
      actionList.includes(perm.action) &&
      perm.status === true
  );
};

  const menuItems = useMemo(() => [

    { name: "Home", icon: Home, module: "Product", href: "/dropshipping", section: "MENU" },
    { name: "Analytics", icon: IoMdAnalytics, module: "Analytics", href: "/dropshipping/analytics", section: "MENU" },
    {
      name: "Manage Orders", icon: ShoppingCart, href: "#", section: "MENU",
      subMenu: [
        { name: "All Orders (In progress)", module: "All Orders (In progress)", href: "/dropshipping/manage-orders" },
        { name: "Pending Orders (In progress)", module: "Pending Orders (In progress)", href: "/dropshipping/pending-orders" }
      ]
    },
    { name: "Link Shopify Store", icon: FaShopify, module: "Shopify", href: "/dropshipping/store/link", section: "MENU" },
    { name: "Reporting", icon: FileBarChart2, module: "Report", href: "/dropshipping/reporting", section: "MENU" },
    { name: "Manage Products (In progress)", icon: Package, module: "Manage Products (In progress)", href: "/dropshipping/manage-products", section: "MENU" },
    { name: "Subuser Listing", icon: Package, module: "Sub User", href: "/dropshipping/sub-user/list", section: "MENU" },
    { name: "Profile", icon: Package, module: "My Profile", href: "/dropshipping/profile", section: "MENU" },
    { name: "Source a Product", icon: Gift, module: "Source a Product", href: "/dropshipping/product/source", section: "MENU" },
    { name: "Reports (In progress)", icon: BarChart, module: "Reports (In progress)", href: "/dropshipping/report", section: "MENU" },
    { name: "Payments", icon: CreditCard, module: "Payment", href: "/dropshipping/payments", section: "MENU" },
    { name: "Manage NDR (In progress)", icon: FileText, module: "Manage NDR (In progress)", href: "/dropshipping/manage-ndr", section: "MENU" },
    { name: "High RTO Pincode (In progress)", icon: MapPin, module: "High RTO Pincode (In progress)", href: "/dropshipping/high-rto-pincode", section: "OTHERS" },
    { name: "Boosters (In progress)", icon: Volume2, module: "Boosters (In progress)", href: "/dropshipping/boosters", section: "OTHERS" },
    { name: "Integrations (In progress)", icon: Link, module: "Integrations (In progress)", href: "/dropshipping/Integration", section: "OTHERS" },
    { name: "Settings (In progress)", icon: Settings, module: "Settings (In progress)", href: "/dropshipping/settings", section: "OTHERS" },
    { name: "Terms & Conditions (In progress)", icon: FileText, module: "Terms & Conditions (In progress)", href: "/dropshipping/term-and-condition", section: "OTHERS" }
  ].filter((item) => {
    if (!isDropshipperStaff) return true;
    if (item.children) return true;
    return extractedPermissions.length > 0 ? hasPermission(item.module, actions) : true;
  }), [isDropshipperStaff, extractedPermissions]);
  useEffect(() => {
    const initialState = {};
    menuItems.forEach((item) => {
      if (item.subMenu?.some(sub => pathname === sub.href)) {
        initialState[item.name] = true;
      }
    });
    setOpenMenus(initialState);
  }, [pathname, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target?.closest("aside")) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  const toggleSubMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      <button
        className="fixed top-4 left-5 z-50 p-2 lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <HiBars3CenterLeft className="w-6 h-6 text-white" />
      </button>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-[#00000038] bg-opacity-10 z-40 lg:hidden" />
      )}

      <aside className={`fixed top-0 left-0 w-72 h-[500px] lg:h-full overflow-auto bg-white z-50 rounded-xl shadow-lg p-4 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:w-full`}>
        <div className="flex items-center justify-between lg:justify-center py-4 border-b border-[#6670856e]">
          <Image src={Logo} alt="Shipowl Logo" className="md:max-w-[130px] max-w-[100px]" />
          <button className="lg:hidden p-1" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-[#2C3454]" />
          </button>
        </div>

        <nav className="mt-4">
          {["MENU", "OTHERS"].map((section) => (
            <div key={section}>
              <p className="text-[#8A99AF] text-sm mb-2 mt-4">{section}</p>
              <ul className="space-y-2">
                {menuItems.filter(item => item.section === section).map((item) => {
                  const isActive = pathname === item.href || item.subMenu?.some(sub => pathname === sub.href);

                  return (
                    <li key={item.name}>
                      {item.subMenu ? (
                        <>
                          <button
                            onClick={() => toggleSubMenu(item.name)}
                            className={`font-lato font-medium w-full flex items-center justify-between p-3 border-l-4 rounded-md transition-colors
                              ${isActive ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] text-[#2C3454] border-[#667085] hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]"}`}
                          >
                            <span className="flex items-center">
                              <item.icon className="w-5 h-5 mr-2" /> {item.name}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${openMenus[item.name] ? "rotate-180" : ""}`} />
                          </button>

                          {openMenus[item.name] && (
                            <ul className="ml-6 mt-1 space-y-1 text-sm">
                              {item.subMenu.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <li key={subItem.name}>
                                    <a
                                      href={subItem.href}
                                      className={`flex items-center font-lato font-medium p-3 border-l-4 rounded-md transition-colors
                                        ${isSubActive ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] text-[#2C3454] border-[#667085] hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]"}`}
                                      onClick={() => setIsSidebarOpen(false)}
                                    >
                                      {subItem.name}
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <a
                          href={item.href}
                          className={`font-lato font-medium flex items-center p-3 border-l-4 rounded-md transition-colors
                            ${isActive ? "bg-[#2C3454] text-white border-[#F98F5C]" : "bg-[#F0F1F3] text-[#2C3454] border-[#667085] hover:bg-[#2C3454] hover:text-white hover:border-[#F98F5C]"}`}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          <item.icon className="w-5 h-5 mr-2" /> {item.name}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
