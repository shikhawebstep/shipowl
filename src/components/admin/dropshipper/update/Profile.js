"use client";

import { useContext, useEffect } from "react";
import AccountDeatils from './AccountDeatils'
import AddressDetails from './AddressDetails';
import Payment from './Payment';
import { DropshipperProfileContext } from "../DropshipperProfileContext";
import { ProfileContext } from "../../supplier/ProfileContext";
import { HashLoader } from 'react-spinners';

export default function Profile() {

  const {activeTab,loading, setActiveTab,fetchSupplier,validate,validateAddress} = useContext(DropshipperProfileContext);
    const {fetchCountry} = useContext(ProfileContext);

    const handleTabClick = async (tabId) => {
      if (activeTab === 'account_details') {
        const isValid = await validate();
        if (!isValid) return;
      }
  
      if (activeTab === 'address_details') {
        const isValid = await validateAddress();
        if (!isValid) return;
      }
  
      setActiveTab(tabId);
    };
  const tabs = [
    { id: "account_details", label: "Account Details" },
    { id: "address_details", label: "Address Details" },
    { id: "payment_billing", label: "Payment & Billing" },
  ];
  useEffect(()=>{
    fetchSupplier();
    fetchCountry();   
  },[fetchSupplier,fetchCountry]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[80vh]">
            <HashLoader size={60} color="#F97316" loading={true} />
        </div>
    );
}
  return (
    <div className="">
      <div className={`flex border-b bg-white pt-5 xl:gap-8 overflow-auto px-4 rounded-tl-2xl rounded-tr-2xl  border-[#F4F5F7] ${activeTab== "account_details" ? "xl:w-10/12" :"w-full"}`}>
        {tabs.map((tab) => (
          <button
          key={tab.id}
          type="button"
          onClick={() => handleTabClick(tab.id)}
          className={`px-4 py-2 text-lg whitespace-nowrap font-medium ${
            activeTab === tab.id
              ? 'border-b-3 border-orange-500 text-orange-500'
              : 'text-[#718EBF]'
          }`}
        >
          {tab.label}
        </button>
        ))}
      </div>

      <div className="">
        {activeTab === "account_details" && <AccountDeatils />}
        {activeTab === "address_details" && <AddressDetails />}
        {activeTab === "payment_billing" && <Payment />}
      </div>

    </div>
  )
}
