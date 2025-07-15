"use client";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, X, Mail, Home, ShoppingCart, Package, Gift, BarChart, CreditCard,
  FileText, Settings, Volume2, MapPin, User, Warehouse, ClipboardList,Ticket,
  BadgeDollarSign, ShieldCheck, LayoutDashboard, UserCheck, Users, Image as LucideImage, Banknote, Tags
} from "lucide-react";
import { GoUnverified } from "react-icons/go";
import logo from "@/app/images/Shipowllogo.png";
import { useAdmin } from "./middleware/AdminMiddleWareContext";

export default function Sidebar() {
  const { openSubMenus, setOpenSubMenus, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdminRole()
  }, [])

  const toggleSubMenu = (name) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const actions = ['View Listing', 'Update', 'Create', 'Listing', 'View', 'Soft Delete', 'Permanent Delete', 'Restore', 'Trash Listing', 'Bank Account Change Request View Listing', 'Bank Account Change Request Review'];

  const hasPermission = (module, actionList) => {
    return extractedPermissions.some(
      (perm) => perm.module === module && actionList.includes(perm.action) && perm.status === true
    );
  };

  const menuSections = useMemo(() => [
    { title: "Category Management", module: "Category", action: actions, icon: Tags, href: "/admin/category/list" },
    { title: "Brand Management", module: "Brand", action: actions, icon: Tags, href: "/admin/brand/list" },
    { title: "Product Management", module: "Product", action: actions, icon: Package, href: "/admin/products/list" },
    { title: "Dropshipper Banners", module: "dropshiperBanners", action: actions, icon: LucideImage, href: "/admin/dropshipper/banner" },

     {
      children: [
        {
          name: "Email Settings",
          icon: Mail,
          subMenu: [
            { icon: Mail, name: "SMTP Configure", module: "Mail", action: actions, href: "/admin/email-settings/smtp-configure" },
            { icon: Mail, name: "Mail Templates", module: "Mail", action: actions, href: "/admin/email-settings/template" },
          ],
        },
      ],
    },
    { title: "Tickets", module: "Tickets", action: actions, icon: Ticket, href: "/admin/ticket" },

    {
      children: [
        {
          name: "Permissions",
          icon: UserCheck,
          subMenu: [
            { icon: UserCheck, name: "Global Permission", module: "Global Permission", action: actions, href: "/admin/permission" },
            { icon: UserCheck, name: "Order Permission", module: "Supplier Order Permission", action: actions, href: "/admin/permission/order" },
          ],
        },
      ],
    },

    {
      children: [
        {
          name: "Supplier Dashboard",
          icon: LayoutDashboard,
          subMenu: [
            { icon: ClipboardList, module: "Supplier", action: actions, name: "Supplier List", href: "/admin/supplier/list" },
            { icon: GoUnverified, module: "Supplier", action: actions, name: "unverified Supplier List", href: "/admin/supplier/Unverified/list" },
            { icon: Banknote, module: "Supplier", action: actions, name: "Bank Details Update Requests ", href: "/admin/supplier/bankaccount-update-requests" },
            { icon: ClipboardList, module: "productRequest", action: actions, name: "New Product Request (In progress)", href: "/admin/products/new" },
            { icon: ShoppingCart, module: "order", action: actions, name: "Orders(In progress)", href: "/admin/supplier/orders" },
            { icon: Warehouse, module: "warehouse", action: actions, name: "Warehouse", href: "/admin/supplier/warehouse/list" },
            { icon: ClipboardList, module: "rto", action: actions, name: "RTO Management (in progress)", href: "/admin/supplier/orders/rto-orders" },
            { icon: BadgeDollarSign, module: "billing", action: actions, name: "Billings(In progress)", href: "/admin/billing" },
            { icon: CreditCard, module: "payment", action: actions, name: "Payment(In progress)", href: "/admin/payments" },
          ],
        },
      ],
    },

    {
      children: [
        {
          name: "Dropshipping Dashboard",
          icon: LayoutDashboard,
          subMenu: [
            { icon: Users, module: "Dropshipper", action: actions, name: "Dropshippers List", href: "/admin/dropshipper/list" },
            { icon: Banknote, module: "Dropshipper", action: actions, name: "Bank Details Update Requests", href: "/admin/dropshipper/bankaccount-update-requests" },
            { icon: ShoppingCart, module: "manange-orders", action: actions, name: "Manage Orders(In progress)", href: "/admin/dropshipper/manage-orders" },
            { icon: Package, module: "manage-products", action: actions, name: "Manage Products(In progress)", href: "/admin/dropshipper/manage-products" },
            { icon: Gift, module: "source", action: actions, name: "Source a Product(In progress)", href: "/admin/dropshipper/product/source" },
            { icon: BarChart, module: "reports", action: actions, name: "Reports(In progress)", href: "/report" },
            { icon: CreditCard, module: "payment", action: actions, name: "Payments(In progress)", href: "#" },
            { icon: FileText, module: "ndr", action: actions, name: "Manage NDR(In progress)", href: "#" },
            { icon: MapPin, module: "high-rto", action: actions, name: "High RTO Pincode(In progress)", href: "#" },
            { icon: Volume2, module: "booster", action: actions, name: "Boosters(In progress)", href: "#" },
            { icon: Settings, module: "integrations", action: actions, name: "Integrations(In progress)", href: "#" },
          ],
        },
      ],
    },

    {
      children: [
        {
          name: "Shipping Dashboard",
          icon: LayoutDashboard,
          subMenu: [
            { icon: ClipboardList, module: "courier", action: actions, name: "Courier Company", href: "/admin/courier/list" },
            { icon: ClipboardList, module: "api", action: actions, name: "Api Credentials (in progress)", href: "/admin/api/list" },
            { icon: ClipboardList, module: "Good Pincode", action: actions, name: "Good Performing Page", href: "/admin/good-pincodes/list" },
            { icon: ClipboardList, module: "Bad Pincode", action: actions, name: "Bad Performing Page", href: "/admin/bad-pincodes/list" },
            { icon: Package, name: "High RTO", module: "High RTO", action: actions, href: "/admin/high-rto/list" },
          ],
        },
      ],
    },

    { title: "Subuser Listing", module: "Sub User", action: actions, icon: User, href: "/admin/sub-user/list" },
    { title: "Country Management", module: "Country", action: actions, icon: Tags, href: "/admin/country/list" },
    { title: "State Management", module: "State", action: actions, icon: ShieldCheck, href: "/admin/state/list" },
    { title: "City Management", module: "City", action: actions, icon: ShieldCheck, href: "/admin/city/list" },
    { title: "Settings(In progress)", module: "setting", action: actions, icon: Settings, href: "/admin/setting" },
    { title: "Profile(In progress)", module: "profile", action: actions, icon: User, href: "/admin/profile" },
    { title: "Terms & Condition(In progress)", module: "term", action: actions, icon: ShieldCheck, href: "/admin/terms" },
  ].filter(section => {
    if (!isAdminStaff || section.children) return true;
    if (extractedPermissions.length > 0) {
      return hasPermission(section.module, section.action);
    }
    return true;
  }), [!isAdminStaff, extractedPermissions]);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 w-full left-0 z-50 p-2 lg:p-0 bg-white rounded-lg lg:hidden shadow-md">
        <div className="flex justify-between items-center">
          <Image src={logo} alt="ShipOwl Logo" className="max-w-[100px]" />
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-8 h-8 text-[#2C3454]" />
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0000007a] bg-opacity-30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-72 lg:w-full sidebar bg-white z-50 shadow-lg xl:h-screen lg:h-full rounded-lg transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? "translate-x-0 h-[500px] w-[300px] overflow-auto" : "-translate-x-full"} 
        lg:translate-x-0 lg:relative lg:h-full`}
      >
        <div className="flex items-center justify-between p-5 lg:justify-center border-b border-[#F4F7FE]">
          <Image src={logo} alt="ShipOwl Logo" className="max-w-[150px]" />
          <button className="lg:hidden p-1" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-[#2C3454]" />
          </button>
        </div>

        <nav className="p-3 h-[80%] overflow-auto">
          <ul className="space-y-2">
            <li>
              <Link href="/admin">
                <button
                  className={`font-medium flex gap-2 border-l-4 items-center hover:border-orange-500 w-full p-2 rounded-lg hover:bg-[#2C3454] hover:text-white
                  ${pathname === "/admin" || pathname === "/admin/" ? "bg-[#131a44de] border-orange-500 text-white" : "bg-[#F0F1F3] border-[#131a44dec9] text-[#2C3454]"}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </button>
              </Link>
            </li>

            {menuSections.map((section, index) => (
              <li key={section.title ?? `section-${index}`} className="mb-2">
                {section.title && (
                  <Link href={section.href}>
                    <div
                      className={`font-medium flex gap-2 border-l-4 items-center w-full p-2 hover:border-orange-500 rounded-lg hover:bg-[#2C3454] hover:text-white
                      ${pathname === section.href ? "bg-[#131a44de] border-orange-500 text-white" : "bg-[#F0F1F3] border-[#131a44dec9] text-[#2C3454]"}`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <section.icon className="w-4 h-4" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                  </Link>
                )}

                {section.children?.map((item) => {
                  const filteredSubMenu = item.subMenu?.filter((sub) => {
                    if (!isAdminStaff) return true;
                    if (extractedPermissions.length > 0) {
                      return hasPermission(sub.module, sub.action ?? actions);
                    }
                    return true;
                  });

                  if (!filteredSubMenu?.length) return null;

                  return (
                    <div key={item.name} className="my-2">
                      <button
                        className={`font-medium flex justify-between hover:border-orange-500 items-center gap-2 border-l-4 w-full p-2 rounded-lg hover:bg-[#2C3454] hover:text-white
                        ${pathname.includes(item.name.toLowerCase()) || openSubMenus[item.name] ? "bg-[#131a44de] border-orange-500 text-white" : "bg-[#F0F1F3] border-[#131a44dec9] text-[#2C3454]"}`}
                        onClick={() => toggleSubMenu(item.name)}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-medium transform transition-transform duration-300">
                          {openSubMenus[item.name] ? "−" : "+"}
                        </span>
                      </button>

                      <ul
                        className={`px-4 mt-1 space-y-2 overflow-hidden transform transition-all duration-500 ease-in-out
                        ${openSubMenus[item.name] ? "max-h-[1000px] translate-x-0" : "max-h-0 translate-x-[-10px] opacity-0"}`}
                      >
                        {filteredSubMenu.map((subItem) => (
                          <li key={subItem.name}>
                            <Link href={subItem.href}>
                              <div
                                className={`font-medium hover:border-orange-500 flex gap-2 border-l-4 items-center w-full p-2 rounded-lg hover:bg-[#2C3454] hover:text-white
                                ${pathname === subItem.href ? "bg-[#131a44de] border-orange-500 text-white" : "bg-[#F0F1F3] border-[#131a44dec9] text-[#2C3454]"}`}
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="font-medium">{subItem.name}</span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
