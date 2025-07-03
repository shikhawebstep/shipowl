'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { IoIosArrowForward } from 'react-icons/io';
import { HashLoader } from 'react-spinners';
import productimg from '@/app/assets/product1.png';
import { X, ClipboardCopy, HelpCircle, Upload, Store, Star } from 'lucide-react';
import CategorySection from './CatogorySection'
import { useImageURL } from "@/components/ImageURLContext";
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
const NewlyLaunched = () => {
  const router = useRouter();
  const { hasPermission } = useDropshipper();
  const [shipCost, setShipCost] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [products, setProducts] = useState([]);
  const [shopifyStores, setShopifyStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notmy');
  const [type, setType] = useState(false);
  const { fetchImages } = useImageURL();
  const [openSection, setOpenSection] = useState(null);
  const [activeModalPushToShopify, setActiveModalPushToShopify] = useState('Shipowl');
  const canPushToShopify = hasPermission("Product", "Push to Shopify");
  const canEditFromShopify = hasPermission("Product", "Update");
  const [form, setForm] = useState({
    dropPrice: '',
    totalOrderQty: '',
    confirmOrderPercentage: '90',
    deliveryPercentage: '50',
    adSpends: '',
    miscCharges: '',
  });
  const [errors, setErrors] = useState({});
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };
  const handleChange = (key, value) => {
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);

    const validationPassed = validate(updatedForm);
    setShowResult(validationPassed);
  };
  const validate = (formToValidate = form) => {
    const newErrors = {};

    Object.keys(formToValidate).forEach((key) => {
      if (key === 'miscCharges') return; // Skip missCharge

      if (!formToValidate[key] || isNaN(formToValidate[key])) {
        newErrors[key] = 'This Field is Required';
      }
    });

    if (
      formToValidate.sellingPrice &&
      !isNaN(formToValidate.sellingPrice) &&
      parseFloat(formToValidate.sellingPrice) < selectedVariant?.price
    ) {
      newErrors.sellingPrice = 'Selling price should be Greater than on equal to Shipowl price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [showPopup, setShowPopup] = useState(false);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [inventoryData, setInventoryData] = useState({
    supplierProductId: "",
    id: '',
    model: 'Selfship',
    variant: [],
    isVarientExists: '',
    shopifyStore: '',
  });
  const handleVariantChange = (id, field, value) => {
    // If field is global (e.g., shopifyStore), update it at root level
    if (id == null) {
      setInventoryData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
      return;
    }


    // Special handling for radio button field (e.g., 'selected')
    if (field === 'selected') {
      setInventoryData((prevData) => ({
        ...prevData,
        variant: prevData.variant.map((v) => ({
          ...v,
          selected: v.id === id, // true for selected one, false for all others
        })),
      }));
      return;
    }

    // Standard field update
    setInventoryData((prevData) => ({
      ...prevData,
      variant: prevData.variant.map((v) =>
        v.id === id
          ? {
            ...v,
            [field]: ['qty', 'shipowl_price', 'dropStock', 'dropPrice'].includes(field)
              ? Number(value)
              : value,
          }
          : v
      ),
    }));
  };
  const variantsForPush = inventoryData?.variant || [];

  const groupedByModalForPushToShopify = variantsForPush.reduce((acc, curr) => {
    const model = curr?.model || curr?.variant?.model || curr?.supplierProductVariant?.variant?.model || "Unknown";
    if (!acc[model]) acc[model] = [];
    acc[model].push(curr);
    return acc;
  }, {});

  const modalNamesForPushToShopify = Object.keys(groupedByModalForPushToShopify);
  const totalModalsForPushToShopify = modalNamesForPushToShopify.length;

  const getVariantDataForPushToShopify = (v) => ({
    id: v?.id || v?.variant?.id,
    name: v?.variant?.name || v?.supplierProductVariant?.variant?.name || "NIL",
    model: v?.variant?.model || v?.supplierProductVariant?.variant?.model || "Unknown",
    color: v?.variant?.color || v?.supplierProductVariant?.variant?.color || "NIL",
    image: (v?.variant?.image || v?.supplierProductVariant?.variant?.image || "").split(",")[0],
    suggested_price: v?.price || v?.suggested_price,
    full: v,
    selected: v?.selected || false
  });




  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.clear("shippingData");
      router.push("/dropshipper/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/dropshipper/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Creating Product...',
        text: 'Please wait while we save your Product.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const form = new FormData();
      let simplifiedVariants = [];



      if (
        totalModalsForPushToShopify === 2 &&
        modalNamesForPushToShopify.every((model) => groupedByModalForPushToShopify[model]?.length === 1)
      ) {

        const selectedVariant = inventoryData.variant.find((v) => v.selected);

        if (selectedVariant) {
          simplifiedVariants = [{
            variantId: selectedVariant.id || selectedVariant.variantId,
            price: selectedVariant.dropPrice,
          }];
        }

      } else if (
        totalModalsForPushToShopify === 1 &&
        groupedByModalForPushToShopify[modalNamesForPushToShopify[0]]?.length > 1
      ) {

        const model = modalNamesForPushToShopify[0];
        const variants = groupedByModalForPushToShopify[model];

        simplifiedVariants = variants.map((v) => ({
          variantId: v.id || v.variantId,
          price: v.dropPrice,
        }));


      } else if (
        totalModalsForPushToShopify > 1 &&
        modalNamesForPushToShopify.some((model) => groupedByModalForPushToShopify[model]?.length > 1)
      ) {

        if (selectedVariant) {
          const selectedModal =
            activeModalPushToShopify || "Unknown";

          const modalVariants = groupedByModalForPushToShopify[selectedModal] || [];

          simplifiedVariants = modalVariants.map((v) => ({
            variantId: v.id || v.variantId,
            price: v.dropPrice,
          }));

        }

      } else {

        simplifiedVariants = inventoryData.variant.map((v) => ({
          variantId: v.id || v.id, price: v.dropPrice,
        }));
      }


      form.append('supplierProductId', inventoryData.supplierProductId);
      form.append('shopifyStore', inventoryData.shopifyStore);
      form.append('variants', JSON.stringify(simplifiedVariants));



      const url = "/api/dropshipper/product/my-inventory";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const result = await response.json();

      Swal.close();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: result.message || result.error || "An error occurred",
        });
        return;
      }

      // On success
      Swal.fire({
        icon: "success",
        title: "Product Created",
        text: result.message || "The Product has been created successfully!",
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setInventoryData({
            productId: "",
            variant: [],
            id: '',
            model: 'Selfship',
            shopifyStore: ''
          });
          setShowPopup(false);
          fetchProduct('my');
          setActiveTab('my');
        }
      });


    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  const tabs = [
    { key: "notmy", label: "Not Pushed to Shopify" },
    { key: "my", label: "Pushed to Shopify" },
  ];

  const fetchProduct = useCallback(async (type) => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/dropshipper/product/inventory?type=${type}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Something went wrong");

      setShipCost(data?.shippingCost || []);
      setProducts(data?.products || []);
      setShopifyStores(data?.shopifyStores || []);
      setType(data?.type || "");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProduct(activeTab);
  }, [fetchProduct, activeTab]);

  const viewProduct = (id) => {
    if (type === "notmy") {
      router.push(`/dropshipping/product/?id=${id}&type=${type}`);
    } else {
      router.push(`/dropshipping/product/?id=${id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading />
      </div>
    );
  }

  return (
    <>
      <CategorySection />
      <section className="xl:p-6 pt-6">
        <div className="container">
          {/* Tabs */}
          <div className="flex gap-4 bg-white rounded-md p-4 mb-8 font-lato text-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`md:px-6 py-2 font-medium px-2 md:text-xl border-b-2 transition-all duration-200
                  ${activeTab === tab.key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-orange-600"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section Heading */}
          <div className="flex justify-between items-center mb-4 mt-6">
            <h2 className="md:text-[24px] text-lg text-[#F98F5C] font-lato font-bold">
              {activeTab === "notmy" ? "Newly Launched" : "Pushed Products"}
            </h2>
            <Link
              href="/dropshipping/product-list"
              className="text-[16px] text-[#222222] hover:text-orange-500 flex items-center gap-2 font-lato"
            >
              View All <IoIosArrowForward className="text-[#F98F5C]" />
            </Link>
          </div>
          <div className="md:w-[293px] border-b-3 w-4/12 border-[#F98F5C] mt-1 mb-4"></div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <p className="text-center">No Data Found</p>
          ) : (
            <div className="products-grid pb-5 md:pb-0 grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-3 gap-4 xl:gap-6 lg:gap-4 mt-4">
              {/* Special Feature Box */}
              <div className="grid bg-[#212B36] rounded-xl shadow-xl overflow-hidden cursor-default">
                <Image
                  src={productimg}
                  alt="Best Product"
                  className={`w-full object-cover ${activeTab === "notmy"
                    ? "md:max-h-[250px] h-[200px]"
                    : "md:max-h-[230px] h-[200px]"
                    }`}
                />
                <div className="bg-[#212B36] bg-opacity-50 p-4 px-2 text-center text-white">
                  <p className="text-[16px] font-semibold font-lato">Best of {activeTab === "notmy" ? "Newly Launched" : "Pushed Products"}</p>
                  <p className="text-[15px] text-[#F98F5C] font-lato">{products.length} Products</p>
                </div>
              </div>

              {products.map((product, index) => {

                const productName = product?.product?.name || "NIL";
                const variants = product?.variants || [];

                const firstVariantImageString =
                  variants[0]?.supplierProductVariant?.variant?.image || // case 1
                  variants[0]?.variant?.image ||                         // case 2
                  "";

                const imageUrl = firstVariantImageString.split(",")[0]?.trim() || "/default-image.jpg";

                return (
                  <div
                    key={index}
                    tabIndex={0} // Allows focus via tap on mobile
                    className="bg-white focus-within:z-10 rounded-xl group overflow-hidden cursor-pointer shadow-sm relative transition-transform duration-300 hover:shadow-lg hover:scale-[1.02] outline-none"
                  >
                    {/* FLIP CARD */}
                    <div onClick={() => viewProduct(product.id)} className={`relative h-[200px]  perspective ${showVariantPopup === true ? 'z-20' : 'z-40'}`}>
                      <div className="relative overflow-hidden w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                        {/* FRONT */}
                        <Image
                          src={fetchImages(imageUrl)}
                          alt={productName}
                          height={200}
                          width={100}
                          className="w-full h-full object-cover backface-hidden"

                        />
                        {/* BACK */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center rotate-y-180 backface-hidden">
                          <span className="text-sm">Back View</span>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="p-3 group-hover:pb-24 mb-4 relative z-0 bg-white">
                      <div className="flex justify-between items-center">
                        <p className="text-black font-bold nunito">
                          ₹
                          {product.variants.length === 1
                            ? product.variants[0]?.price ||
                            product.variants[0]?.supplierProductVariant?.price ||
                            0
                            : Math.min(
                              ...product.variants.map(
                                (v) =>
                                  v?.price ??
                                  v?.supplierProductVariant?.price ??
                                  Infinity
                              )
                            )}
                        </p>
                      </div>
                      <p className="text-[12px] text-[#ADADAD] capitalize font-lato font-semibold">
                        {productName}
                      </p>

                      {/* INFO FOOTER */}
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <span>{variants?.rating || 4.3}</span>
                        <div className="flex gap-[1px] text-orange-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 fill-current ${i < Math.round(variants?.rating || 4.3)
                                ? 'fill-orange-500'
                                : 'fill-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-gray-500">4,800</span>
                      </div>
                    </div>

                    {/* INVISIBLE FOCUS HELPER (for mobile) */}
                    <button className="absolute top-0 left-0 w-full h-full opacity-0 z-0" tabIndex={-1} />

                    {/* SLIDE-IN ACTION PANEL */}
                    <div
                      className="absolute bottom-0 left-0 w-full p-3 bg-white z-10 border border-gray-100 shadow
                           opacity-0 translate-y-4 pointer-events-none
                           group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                           focus-within:opacity-100 focus-within:translate-y-0 focus-within:pointer-events-auto
                           group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto
                           transition-all duration-300"
                    >
                      {canPushToShopify && activeTab === "notmy" && (
                        <button
                          onClick={() => {
                            setShowPopup(true);
                            setInventoryData({
                              supplierProductId: product.id,
                              id: product.id,
                              variant: product.variants,
                              isVarientExists: product?.product?.isVarientExists,
                              shopifyStore: "",
                              model: "Selfship",
                            });
                          }}
                          className="w-full py-2 px-4 md:text-sm text-xs text-white rounded-md bg-[#2B3674] hover:bg-[#1f285a] transition-colors duration-200"
                        >
                          Push To Shopify
                        </button>
                      )}



                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowVariantPopup(true);
                        }}
                        className="w-full mt-2 py-2 px-4 text-white rounded-md md:text-sm  text-xs bg-[#3965FF] hover:bg-[#2b50d6] transition-colors duration-200"
                      >
                        View Variants
                      </button>

                      {canEditFromShopify && activeTab === "my" && (
                        <button
                          onClick={() => window.open(`https://${product.shopifyStore.shop}/admin/products/${product.shopifyProductId?.split('/').pop()}`, '_blank')}
                          className="w-full py-2 px-4 mt-2 text-white rounded-md md:text-sm  text-xs  bg-black hover:bg-gray-800 transition-colors duration-200"
                        >
                          Edit From Shopify
                        </button>
                      )}
                    </div>
                  </div>


                );
              })}
            </div>
          )}
        </div>

        {showPopup && (() => {


          return (
            <div className="fixed inset-0 bg-black/70 flex justify-end z-50">
              <div className="w-full max-w-md h-full bg-white shadow-xl z-50 relative overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl font-light"
                >
                  ×
                </button>

                {/* Header */}
                <div className="p-5 border-b">
                  <h2 className="text-xl font-semibold">Push To Shopify</h2>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="p-5 space-y-6">
                    {/* Store Selector */}
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Store />
                        <label className="block text-sm font-semibold mb-1">Store</label>
                      </div>

                      <select
                        className="border border-[#E0E2E7] p-2 rounded-md"
                        name="shopifyStore"
                        id="shopifyStore"
                        onChange={(e) => handleVariantChange(null, 'shopifyStore', e.target.value)}
                        value={inventoryData.shopifyStore || ''}
                      >
                        <option value="">Select Store</option>
                        {shopifyStores.map((item, index) => (
                          <option value={item.id} key={index}>{item.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Cases */}
                    {(() => {
                      if (totalModalsForPushToShopify === 1 && groupedByModalForPushToShopify[modalNamesForPushToShopify[0]].length === 1) {
                        const variant = getVariantDataForPushToShopify(groupedByModalForPushToShopify[modalNamesForPushToShopify[0]][0]);
                        return (
                          <VariantCard
                            variant={variant}
                            handleVariantChange={handleVariantChange}
                            fetchImages={fetchImages}
                          />
                        );
                      }

                      if (totalModalsForPushToShopify === 1) {
                        return (
                          <>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Model: {modalNamesForPushToShopify[0]}</h3>
                            <div className="grid grid-cols-1 gap-4">
                              {groupedByModalForPushToShopify[modalNamesForPushToShopify[0]]
                                .map(getVariantDataForPushToShopify)
                                .sort((a, b) => a.suggested_price - b.suggested_price)
                                .map((variant, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleVariantChange(variant.id, 'selected', true)}
                                    className={`px-4 py-3 rounded-lg border transition-shadow duration-300 cursor-pointer ${variant.selected
                                      ? 'border-dotted border-2 border-orange-600 shadow-md bg-orange-50'
                                      : 'border-gray-300 hover:shadow-lg bg-white'
                                      }`}
                                  >
                                    <VariantCard
                                      variant={variant}
                                      handleVariantChange={handleVariantChange}
                                      fetchImages={fetchImages}
                                    />
                                  </div>
                                ))}
                            </div>
                          </>
                        );
                      }

                      if (totalModalsForPushToShopify === 2 && modalNamesForPushToShopify.every(model => groupedByModalForPushToShopify[model].length === 1)) {
                        return (
                          <div className="mb-4 flex flex-col gap-4">
                            {modalNamesForPushToShopify.map((model, index) => {
                              const variant = getVariantDataForPushToShopify(groupedByModalForPushToShopify[model][0]);
                              return (
                                <label key={index} className="flex flex-col gap-2 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="model"
                                      value={model}
                                      checked={variant.selected}
                                      onChange={() => handleVariantChange(variant.id, 'selected', true)}
                                    />
                                    <span className="text-gray-800 font-medium">{model}</span>
                                  </div>
                                  {variant.selected && (
                                    <VariantCard
                                      variant={variant}
                                      handleVariantChange={handleVariantChange}
                                      fetchImages={fetchImages}
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        );
                      }

                      if (totalModalsForPushToShopify > 1 &&
                        modalNamesForPushToShopify.some((model) => groupedByModalForPushToShopify[model].length > 1)) {
                        return (
                          <>
                            <div className="flex gap-3 mb-4 border-b">
                              {modalNamesForPushToShopify.map((model, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className={`px-8 uppercase py-2 rounded-t-lg text-sm text-black font-medium ${activeModalPushToShopify === model
                                    ? 'bg-orange-500 text-white border-b-2 border-orange-500'
                                    : 'border-transparent hover:text-white hover:bg-orange-500'
                                    }`}
                                  onClick={() => setActiveModalPushToShopify(model)}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              {(groupedByModalForPushToShopify[activeModalPushToShopify] || [])
                                .map(getVariantDataForPushToShopify)
                                .sort((a, b) => a.suggested_price - b.suggested_price)
                                .map((variant, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleVariantChange(variant.id, 'selected', true)}
                                    className={`px-4 py-3 rounded-lg border transition-shadow duration-300 cursor-pointer ${variant.selected
                                      ? 'border-dotted border-2 border-orange-600 shadow-md bg-orange-50'
                                      : 'border-gray-300 hover:shadow-lg bg-white'
                                      }`}
                                  >
                                    <VariantCard
                                      variant={variant}
                                      handleVariantChange={handleVariantChange}
                                      fetchImages={fetchImages}
                                    />
                                  </div>
                                ))}
                            </div>
                          </>
                        );
                      }

                      return <div>No variant available.</div>;
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="bottom-0 left-0 right-0 p-4 border-t bg-white flex items-center justify-between">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-900"
                    >
                      <Upload className="w-4 h-4" />
                      Push To Shopify
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}



        {showVariantPopup && selectedProduct && (
          <div className="fixed  px-6 md:px-0  inset-0 bg-[#000000b0] bg-opacity-40 flex z-50 items-center justify-center ">
            <div className="bg-white border border-orange-500 p-6 rounded-lg w-full z-50 max-w-4xl shadow-xl relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold  text-center text-orange-500">Variant Details</h2>
                <button
                  onClick={() => setShowVariantPopup(false)}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-1">
                {selectedProduct.variants?.map((v, idx) => {
                  let variant = {};
                  if (activeTab === "notmy") {
                    variant = { ...(v.variant || {}), ...v };
                  }
                  if (activeTab === "my") {
                    const supplierProductVariant = v?.supplierProductVariant || {};
                    variant = {
                      ...(supplierProductVariant.variant || {}),
                      ...v
                    };
                  }
                  const rawImageString = variant?.variant?.image || variant?.image || "";
                  const imageUrls = rawImageString
                    .split(",")
                    .map((img) => img.trim())
                    .filter(Boolean);

                  const isExists = selectedProduct?.product?.isVarientExists;

                  return (
                    <div
                      key={variant.id || idx}
                      className="bg-white p-4 rounded-md  border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                    >
                      <div className='flex gap-2 relative'>
                        {/* Image Preview */}
                        <div className="flex items-center gap-2 overflow-x-auto h-[200px] w-full object-cover  border border-[#E0E2E7] rounded-md p-3shadow bg-white">
                          {Array.isArray(imageUrls) && imageUrls.length > 0 ? (
                            imageUrls.map((url, i) => (
                              <Image
                                key={i}
                                height={100}
                                width={100}
                                src={fetchImages(url)}
                                alt={variant?.name || 'NIL'}
                                className="h-full w-full object-cover"
                              />
                            ))
                          ) : (
                            <Image
                              height={40}
                              width={40}
                              src="https://placehold.co/400"
                              alt="Placeholder"
                              className="h-full w-full object-cover"
                            />
                          )}


                        </div>
                        <div className="absolute top-0 left-0 w-full text-center bg-orange-500 p-2 text-white ">Suggested Price : {v.price || v?.supplierProductVariant?.price || "—"}</div>


                      </div>

                      <div className="overflow-x-auto">
                        <table className="text-sm text-gray-700 w-full  border-gray-200">
                          <tbody>
                            <tr className='border border-gray-200'>
                              <th className="text-left border-gray-200 border p-2 font-semibold ">Model:</th>
                              <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.model || "NIL"}</td>

                              <th className="text-left border-gray-200 border p-2 font-semibold ">Name:</th>
                              <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.name || "NIL"}</td>
                            </tr>
                            {isExists && (
                              <>
                                <tr className='border border-gray-200'>
                                  <th className="text-left border-gray-200 border p-2 font-semibold ">SKU:</th>
                                  <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.sku || "NIL"}</td>

                                  <th className="text-left border-gray-200 border p-2 font-semibold ">Color:</th>
                                  <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.color || "NIL"}</td>
                                </tr>
                              </>
                            )}

                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </section>
    </>
  );
};

export default NewlyLaunched;

const VariantCard = ({ variant, handleVariantChange, fetchImages }) => {
  if (!variant) return null;

  return (
    <div key={variant.id} className="space-y-5 border p-4 rounded-lg shadow-sm">
      <div className="flex bg-gray-100 rounded-md p-3 items-start gap-3">
        <Image
          src={fetchImages(variant.image)}
          alt="Product"
          width={64}
          height={64}
          className="rounded border object-cover"
        />
        <div>
          <p className="text-sm font-medium leading-5 line-clamp-2">
            {variant.name || 'Stainless Steel Cable Lock Ties'}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            Model:
            <span className="font-semibold text-[#4C4C4C]">{variant.model || 'C2445129'}</span>
            <ClipboardCopy
              className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer"
              onClick={() => navigator.clipboard.writeText(variant.model || '')}
            />
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="border-t pt-4 space-y-3">
        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">Pricing</div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-600 md:w-7/12 flex items-center gap-1">
            Set Your Selling Price (₹)
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>
          <input
            type="number"
            value={variant.full?.dropPrice || ''}
            onChange={(e) => handleVariantChange(variant.id, 'dropPrice', e.target.value)}
            className="md:w-5/12 border border-[#E0E2E7] rounded-md p-2"
          />
        </div>

        <p className="text-sm font-semibold">
          Shipowl Price
          <span className="float-right">₹{variant.suggested_price || 0}</span>
        </p>
        <p className="text-xs text-gray-400 -mt-2 flex items-center gap-1">
          Including GST & Shipping Charges
          <HelpCircle className="w-3.5 h-3.5" />
        </p>

        <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm font-semibold">
          Your Margin
          <span className="float-right">
            {variant.full?.dropPrice != null && variant.suggested_price != null && (
              <>₹{(variant.full.dropPrice || 0) - (variant.suggested_price || 0)}</>
            )}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-600 border-t pt-3">
        RTO & RVP charges are applicable and vary depending on the product weight.{" "}
        <span className="font-semibold underline cursor-pointer">View charges for this product</span>
      </div>
    </div>
  );
};