"use client";

import { useEffect, useState, useContext, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import ProductDetails from './ProductDetails';
import VariantsDetails from './VariantsDetails';
import ShippingDetails from './ShippingDetails';
import OtherDetails from './OtherDetails';
import Swal from 'sweetalert2';
import { HashLoader } from "react-spinners";
import { ProductContextEdit } from "./ProductContextEdit";
const AddProduct = () => {

  const [loading, setLoading] = useState(false);
  const { activeTab, setActiveTab, setFormData, formData, validateFields, validateForm2 } = useContext(ProductContextEdit);
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
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
  const fetchProducts = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));

    if (adminData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const admintoken = adminData?.security?.token;

    if (!admintoken) {
      router.push("/admin/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/product/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admintoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: errorMessage.message || "Network Error.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const products = result?.product || {};
      setFormData({
        category: products.categoryId || '',
        name: products.name || '',
        main_sku: products.main_sku || '',
        description: products.description || '',
        tags: (() => {
          try {
            const parsed = JSON.parse(products.tags);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        })(),
        brand: products.brandId || '',
        origin_country: products.originCountryId || '',
        shipping_country: products.shippingCountryId || '',
        gallery: products.gallery || '',
        video_url: products.video_url || '',
        list_as: products.list_as || '',
        variants: (() => {
          if (Array.isArray(products.variants) && products.variants.length > 0) {
            return products.variants.map((variant) => ({
              id: variant.id || '',
              color: variant.color || '',
              model: variant.model || '',
              sku: variant.sku || '',
              name: variant.name || '',
              suggested_price: variant.suggested_price || 0,
              product_link: variant.product_link || '',
            }));
          } else {
            // If no variants present, create fallback
            const baseVariant = {
              id: '',
              color: '',
              model: '',
              sku: '',
              name: '',
              suggested_price: 0,
              product_link: '',
            };

            if (products.list_as === 'both') {
              return [
                { ...baseVariant, model: 'Shipowl' },
                { ...baseVariant, model: 'Selfship' },
              ];
            } else {
              return [{ ...baseVariant, model: products.list_as || '' }];
            }
          }
        })(),
        shipping_time: products.shipping_time || '',
        weight: products.weight || '',
        status: products.status || '',
        package_length: products.package_length || '',
        package_width: products.package_width || '',
        package_height: products.package_height || '',
        chargable_weight: products.chargeable_weight || '',
        package_weight_image: products.package_weight_image || '',
        package_length_image: products.package_length_image || '',
        package_width_image: products.package_width_image || '',
        package_height_image: products.package_height_image || '',
        product_detail_video: products.product_detail_video || '',
        hsn_code: products.hsnCode || '',
        tax_rate: products.taxRate || '',
        isVisibleToAll: products.isVisibleToAll,
        isVarientExists: products.isVarientExists ? 'yes' : 'no',
        supplierIds:
          Array.isArray(products.supplierVisibility) && products.supplierVisibility.length > 0
            ? products.supplierVisibility.map((item) => item.supplierId).join(',')
            : '',
        imageSortingIndex: (() => {
          try {
            return JSON.parse(products.imageSortingIndex || '{}');
          } catch (err) {
            console.error("Invalid imageSortingIndex JSON:", err);
            return {};
          }
        })(),
      });



    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id, setFormData]);


  const tabs = [
    { id: "product-details", label: "Product Details" },
    { id: "variants-details", label: "Variants Details" },
    { id: "shipping-details", label: "Shipping Details" },
    { id: "other-details", label: "Other Details" },
  ];


  useEffect(() => {
    if (id) fetchProducts();
  }, [fetchProducts, id]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }
  return (
    <div className="w-full xl:p-6">
      <div className="bg-white rounded-3xl p-5">

        <div className="flex border-b overflow-auto border-[#F4F5F7]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2 text-lg whitespace-nowrap font-medium ${activeTab === tab.id
                ? 'border-b-3 border-orange-500 text-orange-500'
                : 'text-[#718EBF]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "product-details" && <ProductDetails />}
        {activeTab === "variants-details" && <VariantsDetails />}
        {activeTab === "shipping-details" && <ShippingDetails />}
        {activeTab === "other-details" && <OtherDetails />}
      </div>
    </div>
  );
};

export default AddProduct;
