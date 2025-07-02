"use client";

import { useContext } from "react";
import { ProductContext } from "./ProductContext"; // import context
import ProductDetails from "./ProductDetails";
import VariantsDetails from "./VariantsDetails";
import ShippingDetails from "./ShippingDetails";
import OtherDetails from "./OtherDetails";

const AddProduct = () => {
  const { activeTab, setActiveTab,validateForm2,validateFields } = useContext(ProductContext); // use context instead of local state
  const handleTabClick = async (tabId) => {
    if (activeTab === 'product-details') {
      const isValid = await validateFields();
      if (!isValid) return;
    }

    if (activeTab === 'shipping-details') {
      const isValid = await validateForm2();
      if (!isValid) return;
    }

    setActiveTab(tabId);
  };
  const tabs = [
    { id: "product-details", label: "Product Details" },
    { id: "variants-details", label: "Variants Details" },
    { id: "shipping-details", label: "Shipping Details" },
    { id: "other-details", label: "Other Details" },
  ];
  

  return (
    <div className="w-full xl:p-6">
      <div className="bg-white rounded-3xl p-5">
        <div className="flex border-b overflow-auto border-[#F4F5F7]">
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
      </div>

      <div className="">
        {activeTab === "product-details" && <ProductDetails />}
        {activeTab === "variants-details" && <VariantsDetails />}
        {activeTab === "shipping-details" && <ShippingDetails />}
        {activeTab === "other-details" && <OtherDetails />}
      </div>
    </div>
  );
};

export default AddProduct;
