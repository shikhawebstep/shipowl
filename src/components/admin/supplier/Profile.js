'use client';

import { useContext, useState } from 'react';
import ProfileEdit from './ProfileEdit';
import BusinessInfo from './BusinessInfo';
import { ProfileContext } from './ProfileContext';

export default function Profile() {
  const { validate, validateBusiness ,activeSubTab, setActiveSubTab} = useContext(ProfileContext);


  // const mainTabs = [
  //   { id: 'create-supplier', label: 'Create Supplier' },
  //   { id: 'add-bank-details', label: 'Add Bank Details' },
  // ];

  const subTabs = [
    { id: 'profile-edit', label: 'Profile Info' },
    { id: 'business-info', label: 'Business Info' },
  ];



  const handleSubTabClick = async (tabId) => {
    if (activeSubTab === 'profile-edit') {
      const isValid = await validate();
      if (!isValid) return;
    }

    if (activeSubTab === 'business-info') {
      const isValid = await validateBusiness();
      if (!isValid) return;
    }

    setActiveSubTab(tabId);
  };

  return (
    <>
   <div className={`flex border-b bg-white pt-5 xl:gap-8 overflow-auto px-4 rounded-tl-2xl rounded-tr-2xl  border-[#F4F5F7] ${activeSubTab == "profile-edit" ? "xl:w-10/12" : "xl:w-10/12"}`}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSubTabClick(tab.id)}
            className={`px-4 py-2 text-lg whitespace-nowrap font-medium ${activeSubTab === tab.id
                ? 'border-b-3 border-orange-500 text-orange-500'
                : 'text-[#718EBF]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="">
        { activeSubTab === 'profile-edit' && <ProfileEdit />}
        { activeSubTab === 'business-info' && <BusinessInfo />}
      </div>
    </>
  );
}
