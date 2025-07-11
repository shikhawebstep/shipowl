"use client"
import { React, useState, useCallback, useEffect } from 'react'
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { Package, Truck, Boxes, Archive, Star, ClipboardCopy, HelpCircle, Weight, Banknote, Upload, ShieldCheck, RotateCcw, ArrowUpRight, ArrowLeft, Store, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import { Navigation } from 'swiper/modules';
import { useImageURL } from "@/components/ImageURLContext";
import { FaTags } from "react-icons/fa";
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
const tabs = [
  { key: "notmy", label: "Not Pushed to Shopify" },
  { key: "my", label: "Pushed to Shopify" },
];
export default function ProductDetails() {
  const [isSticky, setIsSticky] = useState(false);
  const { hasPermission } = useDropshipper();
  const canPushToShopify = hasPermission("Product", "Push to Shopify");
  const canEditFromShopify = hasPermission("Product", "Update");
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const router = useRouter();
  const { fetchImages } = useImageURL();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const [shopifyStores, setShopifyStores] = useState([]);
  const [variantDetails, setVariantDetails] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [dropshipperProduct, setDropshipperProduct] = useState({});
  const [loading, setLoading] = useState(false);
  const [shipCost, setShipCost] = useState([]);
  const [otherSuppliers, setOtherSuppliers] = useState([]);
  const [activeTab, setActiveTab] = useState('notmy');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeModal, setActiveModal] = useState('Shipowl');
  const [activeModalPushToShopify, setActiveModalPushToShopify] = useState('Shipowl');
  const images = productDetails?.gallery?.split(",") || productDetails?.gallery?.split(",") || [];
  const [selectedImage, setSelectedImage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    supplierProductId: "",
    id: '',
    model: 'Selfship',
    variant: [],
    isVarientExists: '',
    shopifyStore: '',
  });

  const [tooltipIndex, setTooltipIndex] = useState(null);

  const handleTooltipToggle = (index) => {
    setTooltipIndex(prev => (prev === index ? null : index));
  };
  console.log('selectedVariant', selectedVariant)
  useEffect(() => {
    const images =
      productDetails?.gallery?.split(",") ||
      productDetails?.gallery?.split(",") ||
      [];

    setSelectedImage(images[0] ?? "");
  }, [selectedVariant]);

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

  const stats = [{ label: "Units Sold", value: "200", icon: <Package className="w-7 h-7 text-orange-500" />, },
  { label: "Delivery Rate", value: "180", icon: <Truck className="w-7 h-7 text-orange-500" />, },
  { label: "Product GST", value: "18%", icon: <Boxes className="w-7 h-7 text-orange-500" />, },
  { label: "Inventory", value: "400", icon: <Archive className="w-7 h-7 text-orange-500" />, },
  { label: "Weight", value: `${productDetails?.weight} GM`, icon: <Weight className="w-7 h-7 text-orange-500" />, },
  { label: "Supplier Score", value: "4/5", icon: <ShieldCheck className="w-7 h-7 text-orange-500" />, },
  ];
  const features = [
    { icon: <Truck className="w-10 h-10 text-gray-600" />, text: 'Free Shipping' },
    { icon: <Banknote className="w-10 h-10 text-gray-600" />, text: 'Quality Assured Products' },
    { icon: <ShieldCheck className="w-10 h-10 text-gray-600" />, text: 'Cash On Delivery' },
    { icon: <RotateCcw className="w-10 h-10 text-gray-600" />, text: '5 Days Easy Return' },
  ];


  const groupedByModal = variantDetails.reduce((acc, curr) => {
    const model = curr?.model || curr?.variant?.model || curr?.supplierProductVariant?.variant?.model || "Unknown";
    if (!acc[model]) acc[model] = [];
    acc[model].push(curr);
    return acc;
  }, {});

  const modalNames = Object.keys(groupedByModal);
  const totalModals = modalNames.length;

  const getVariantData = (v) => ({
    id: v?.id || v?.variant?.id,
    name: v?.variant?.name || v?.supplierProductVariant?.variant?.name || "NIL",
    model: v?.variant?.model || v?.supplierProductVariant?.variant?.model || "Unknown",
    color: v?.variant?.color || v?.supplierProductVariant?.variant?.color || "NIL",
    suggested_price: v?.price || v?.suggested_price,
    full: v,
  });

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };

  //calc acc to shipowl 
  const [ordersGiven, setOrdersGiven] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [successRatio, setSuccessRatio] = useState(0);
  const [adSpend, setAdSpend] = useState(0); // Now used in both models

  const productPrice = Number(selectedVariant?.price || 0);
  const shippingCost = Number(shipCost || 75);
  const isSelfShip = selectedVariant?.variant?.model.toLowerCase() === "selfship" || selectedVariant?.supplierProductVariant?.variant?.model.toLowerCase() === "selfship";

  const deliveredOrders = Math.round(ordersGiven * (successRatio / 100));
  const codCollected = sellingPrice * deliveredOrders;
  const productCost = isSelfShip ? productPrice * ordersGiven : productPrice * deliveredOrders;
  const totalShipping = shippingCost * ordersGiven;
  const totalAdSpend = adSpend * ordersGiven;

  // ✅ Now adSpend is included in both models
  const totalDeduction = (isSelfShip ? 0 : productCost) + totalShipping + totalAdSpend;
  const remitted = codCollected - totalDeduction;



  const viewProduct = (id) => {
    if (type == "notmy") {
      router.push(`/dropshipping/product/?id=${id}&type=${type}`);
    } else {

      router.push(`/dropshipping/product/?id=${id}`);
    }
  };

  useEffect(() => {
    // CASE: 2 modals, 1 variant each
    if (totalModals === 2 && modalNames.every((m) => groupedByModal[m].length === 1)) {
      const variants = modalNames.map((model) => getVariantData(groupedByModal[model][0]));
      const cheapest = variants.reduce((a, b) => (a.suggested_price < b.suggested_price ? a : b));
      setSelectedVariant(cheapest.full);
    }

    // CASE: multiple modals with multiple variants
    if (totalModals > 1 && modalNames.some((m) => groupedByModal[m].length > 1)) {
      let cheapestModal = modalNames[0];
      let cheapestVariant = null;

      modalNames.forEach((model) => {
        const variants = groupedByModal[model].map(getVariantData);
        const cheapestInModal = variants.reduce((a, b) =>
          a.suggested_price < b.suggested_price ? a : b
        );
        if (
          !cheapestVariant ||
          cheapestInModal.suggested_price < cheapestVariant.suggested_price
        ) {
          cheapestVariant = cheapestInModal;
          cheapestModal = model;
        }
      });

      setActiveModal(cheapestModal);
      setActiveModalPushToShopify(cheapestModal);
      setSelectedVariant(cheapestVariant.full);
    }
  }, [showPopup]); // Only runs when popup is shown

  const fetchRelatedProducts = useCallback(async (catid, tab) => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/inventory?category=${catid}&type=${tab}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: result.error || result.message || "Your session has expired. Please log in again.",
        });
        throw new Error(result.message || result.error || "Something went wrong!");
      }

      setRelatedProducts(result?.products || []);
      setShopifyStores(result?.shopifyStores || []);

    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchProductDetails = useCallback(async () => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      let url;
      if (type === "notmy") {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/inventory/${id}`;
      } else {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/my-inventory/${id}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: result.error || result.message || "Your session has expired. Please log in again.",
        });
        throw new Error(result.message || result.error || "Something went wrong!");
      }
      setShipCost(result?.shippingCost || 75);

      if (type === "notmy") {
        const ProductDataSup = result?.supplierProduct;
        const ProductDataOther = result?.otherSuppliers;
        setProductDetails(ProductDataSup?.product || {});
        setOtherSuppliers(ProductDataOther || []);
        const sortedVariants = (ProductDataSup?.variants || []).slice().sort(
          (a, b) => a.price - b.price
        );
        setVariantDetails(sortedVariants);
        setSelectedVariant(sortedVariants[0]);
        if (ProductDataSup) {
          fetchRelatedProducts(ProductDataSup?.product?.categoryId, activeTab)

        }
      }
      else {
        const ProductDataDrop = result?.dropshipperProduct;
        setDropshipperProduct(ProductDataDrop || {});
        setProductDetails(ProductDataDrop?.product || {});
        const sortedVariants = (ProductDataDrop?.variants || []).slice().sort(
          (a, b) => a.price - b.price
        );
        setVariantDetails(sortedVariants);
        setSelectedVariant(sortedVariants[0]);
        if (ProductDataDrop) {
          fetchRelatedProducts(ProductDataDrop?.product?.categoryId, activeTab)
        }
      }

    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router, activeTab]);


  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

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
          variantId: v.id || v.id,
          price: v.dropPrice,
        }));
      }

      form.append('supplierProductId', inventoryData.supplierProductId);
      form.append('shopifyStore', inventoryData.shopifyStore);
      form.append('variants', JSON.stringify(simplifiedVariants));



      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/my-inventory`;

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
  return (
    <>
      <section className="relative productsingal-page pb-[100px]">
        <div className="container">

          <div className="mx-auto relative gap-4 justify-between  rounded-lg flex flex-col md:flex-row">
            <div className="w-full md:w-4/12">
              <div className="rounded-lg bg-white border border-[#E0E2E7] p-4">
                <div className="rounded-lg w-full">
                  <Image

                    src={fetchImages(selectedImage)}
                    alt="Product Image"
                    width={320}
                    height={320}
                    className="w-full h-100 object-cover rounded-lg"
                  />
                </div>

                <Swiper
                  spaceBetween={10}
                  slidesPerView={4}
                  navigation
                  modules={[Navigation]}
                  className="mt-4"
                >
                  {images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <Image
                        src={fetchImages(image)}
                        alt={`Thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className={`w-20 h-20 object-cover cursor-pointer rounded-lg border-2 ${selectedImage === image ? "border-blue-500" : "border-gray-300"
                          }`}
                        onClick={() => setSelectedImage(image)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
            <div className="w-full md:w-8/12 bg-white rounded-lg border border-[#E0E2E7] p-6">
              <div className="product-details">
                <h2 className='capitalize text-3xl font-medium'>{productDetails?.name || 'N/A'}</h2>
                <p className="text-gray-600 mt-4">
                  Sold: <span className="text-black">1,316 </span> | Rating: ⭐
                  <span className="text-black"> 123 </span> | Stock:
                  <span className="text-black"> {selectedVariant?.stock || 'N/A'} </span>
                </p>
                <div className="md:flex justify-between pb-3 pt-2">
                  <p className="text-black">
                    SKU Code: <span className="text-black">#{productDetails?.main_sku || 'N/A'}</span>
                  </p>
                  <p className="text-black">
                    Created: <span className="text-black">12-04-2024</span>
                  </p>
                </div>
                <p className='font-bold text-2xl'>₹ {selectedVariant?.price || 'N/A'}</p>


              </div>
              <div className="grid grid-cols-1 mt-4 sm:grid-cols-2 md:grid-cols-3 border border-[#D9D9D9]  rounded-lg  bg-white">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 border-[#D9D9D9] 
    ${[0, 1, 2].includes(idx) ? 'md:pl-4 md:border-b' : ''} 
    ${[0, 1, 3, 4].includes(idx) ? 'border-r' : ''} 
  
    ${idx === 5 ? 'border-r-0' : ''}
  `}
                  >


                    <span className='text-xl'>{stat.icon}</span>
                    <div>
                      <p className="text-gray-500 ">{stat.label}:</p>
                      <p className="text-indigo-900 font-semibold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="variants-box mt-5">

                <div className=" p-4 border-gray-200 bg-[#F1F5F9] rounded-md">
                  <div>
                    {
                      totalModals === 1 && groupedByModal[modalNames[0]].length === 1 || totalModals === 1 && groupedByModal[modalNames[0]].length > 1 ? null : (
                        totalModals === 2 && modalNames.every(model => groupedByModal[model].length === 1) ? (
                          <h3 className="mt-4 font-bold text-[18px] pb-2">Modals</h3>
                        ) : (
                          <h3 className="mt-4 font-bold text-[18px] pb-2">Variants</h3>
                        )
                      )
                    }
                    <div className="">
                      {(() => {
                        if (totalModals === 1 && groupedByModal[modalNames[0]].length === 1) {
                          const variant = getVariantData(groupedByModal[modalNames[0]][0]);
                          return (
                            <>
                              <p>This product is available in the <strong>{modalNames[0]}</strong> model.</p>
                            </>
                          );
                        }



                        // CASE 2: 1 model, multiple variants
                        if (totalModals === 1 && groupedByModal[modalNames[0]].length > 1) {
                          return (
                            <>
                              <h3 className="text-xl font-semibold text-gray-800 mb-4"> Model: {modalNames[0]}</h3>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {groupedByModal[modalNames[0]]
                                  .map(getVariantData)
                                  .sort((a, b) => a.suggested_price - b.suggested_price)
                                  .map((variant, index) => {
                                    const isSelected = selectedVariant?.id === variant.id;

                                    return (
                                      <div
                                        key={index}
                                        onClick={() => handleVariantClick(variant.full)}
                                        className={`px-4 py-3 rounded-lg border transition-shadow duration-300 cursor-pointer ${isSelected
                                          ? "border-dotted border-2 border-orange-600 shadow-md bg-orange-50"
                                          : "border-gray-300 hover:shadow-lg bg-white"
                                          }`}
                                      >

                                        <div className="">
                                        
                                          <div className=" text-gray-700 space-y-1 text-left">
                                            <div>Name: <span className="font-medium">{variant.name}</span></div>
                                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                              <span>{variant?.rating || 4.3}</span>
                                              <div className="flex gap-[1px] text-orange-500">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    className={`w-4 h-4 fill-current ${i < Math.round(variant?.rating || 4.3)
                                                      ? 'fill-orange-500'
                                                      : 'fill-gray-300'
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="ml-1 text-gray-500">4,800</span>
                                            </div>
                                            <div>Color: <span className="font-medium">{variant.color}</span></div>
                                            <div className="text-green-600 font-semibold">Price: ₹{variant.suggested_price}</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </>
                          );
                        }


                        if (totalModals === 2 && modalNames.every(model => groupedByModal[model].length === 1)) {
                          return (
                            <div className="mb-4 flex items-center gap-4">
                              {modalNames.map((model, index) => {
                                const variant = getVariantData(groupedByModal[model][0]);
                                const isSelected = selectedVariant?.id === variant.id;
                                return (
                                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="model"
                                      value={model}
                                      checked={isSelected}
                                      onChange={() => handleVariantClick(variant.full)}
                                    />
                                    <span className="text-gray-800 font-medium">{model}</span>

                                  </label>
                                );
                              })}
                            </div>
                          );
                        }

                        // CASE 3: Multiple modals with multiple variants → TABS
                        if (totalModals > 1 && modalNames.some(model => groupedByModal[model].length > 1)) {
                          return (
                            <>
                              {/* Tabs */}
                              <div className="flex gap-3 mb-4 border-b ">
                                {modalNames.map((model, index) => (
                                  <button
                                    key={index}
                                    className={`px-8 uppercase py-2 rounded-t-lg text-sm text-black font-medium border-b-2 border-orange-500 ${activeModal === model
                                      ? "border-orange-500 bg-orange-500 text-white"
                                      : "border-transparent hover:text-white hover:bg-orange-500"
                                      }`}
                                    onClick={() => {
                                      const sorted = groupedByModal[model]
                                        .map(getVariantData)
                                        .sort((a, b) => a.price - b.price);
                                      setActiveModal(model);
                                      setSelectedVariant(sorted[0].full);
                                    }}
                                  >
                                    {model}
                                  </button>
                                ))}
                              </div>

                              {/* Variant Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(groupedByModal[activeModal] || [])
                                  .map(getVariantData)
                                  .sort((a, b) => a.suggested_price - b.suggested_price)
                                  .map((variant, index) => {
                                    const isSelected = selectedVariant?.id === variant.id;
                                    return (
                                      <div
                                        key={index}
                                        onClick={() => handleVariantClick(variant.full)}
                                        className={`px-4 py-3 rounded-lg border border-[#D1D5DC] transition-shadow-md duration-300 cursor-pointer ${isSelected
                                          ? "border-dotted border-2 border-orange-600 shadow-md bg-orange-50"
                                          : "border-gray-300 hover:shadow-lg bg-white"
                                          }`}
                                      >
                                        <div className="">
                                        
                                          <div className=" text-gray-700 space-y-1 text-left">
                                            <div>Name: <span className="font-medium">{variant.name}</span></div>
                                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                              <span>{variant?.rating || 4.3}</span>
                                              <div className="flex gap-[1px] text-orange-500">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    className={`w-4 h-4 fill-current ${i < Math.round(variant?.rating || 4.3)
                                                      ? 'fill-orange-500'
                                                      : 'fill-gray-300'
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="ml-1 text-gray-500">4,800</span>
                                            </div>
                                            <div>Color: <span className="font-medium">{variant.color}</span></div>
                                            <div className="text-green-600 font-semibold">Price: ₹{variant.suggested_price}</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </>
                          );
                        }

                        return <div>No variant available.</div>;
                      })()}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <p className='flex items-center gap-2'>Including GST & Shipping Charges <AiOutlineExclamationCircle className='text-green-500' /></p>
                  </div>
                  <div className="grid grid-cols-1 mt-4 md:grid-cols-3 gap-0 rounded-lg overflow-hidden border border-gray-200 bg-white">
                    {/* Left Section: Inputs + Scenario */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 border-r border-gray-200">
                      <div className="p-4 border-b md:border-r border-gray-200">
                        <p className="text-gray-500 mb-1">Product Listed Price:</p>
                        <p className="font-semibold text-black">₹{productPrice}</p>
                      </div>

                      <div className="p-4 border-b border-gray-200">
                        <p className="text-gray-500 mb-1">Shipping Cost:</p>
                        <p className="font-semibold text-black">₹{shippingCost}</p>
                      </div>

                      <div className="p-4 border-b md:border-r border-gray-200">
                        <label className="text-gray-500 block mb-1">Orders Given:</label>
                        <input
                          type="number"
                          value={ordersGiven}
                          onChange={(e) => setOrdersGiven(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>

                      <div className="p-4 border-b border-gray-200">
                        <label className="text-gray-500 block mb-1">Selling Price ({isSelfShip ? "COD" : "Dropshipper"}):</label>
                        <input
                          type="number"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>

                      <div className="p-4 border-b md:border-r border-gray-200">
                        <label className="text-gray-500 block mb-1">Delivery Ratio (%):</label>
                        <input
                          type="number"
                          value={successRatio}
                          onChange={(e) => setSuccessRatio(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>

                      <div className="p-4 border-b border-gray-200">
                        <p className="text-gray-500 mb-1">Delivered Orders:</p>
                        <p className="font-semibold text-black">{ordersGiven} × {successRatio}% = {deliveredOrders} orders</p>
                      </div>


                      <div className="p-4 border-b md:border-r border-gray-200">
                        <label className="text-gray-500 block mb-1">Ad Spend per Order:</label>
                        <input
                          type="number"
                          value={adSpend}
                          onChange={(e) => setAdSpend(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>


                      {isSelfShip && (
                        <>
                          <div className="p-4 border-b md:border-r border-gray-200">
                            <p className="text-gray-500 mb-1">Prepaid Product Cost:</p>
                            <p className="font-semibold text-black">

                              ₹{productPrice} * {ordersGiven} = ₹{productCost.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 border-b border-gray-200">
                            <p className="text-gray-500 mb-1">Shipping Deduction:</p>
                            <p className="font-semibold text-black">
                              ₹{shippingCost} * {ordersGiven} = ₹{totalShipping.toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Section: Summary */}
                    <div className="p-4">
                      <p className="text-gray-800 font-semibold mb-2">{isSelfShip ? "📦 Self-ship" : "🚚 Shipowl"} Calculation:</p>
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="flex justify-between">
                          <span>COD Collected:</span>
                          <span className="font-medium text-black">₹{codCollected.toLocaleString()}</span>
                        </div>

                        {!isSelfShip && (
                          <>
                            <div className="flex justify-between">
                              <span>Product Cost:</span>
                              <span className="font-medium text-black">₹{productCost.toLocaleString()}</span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between">
                          <span>Shipping Cost:</span>
                          <span className="font-medium text-black">₹{totalShipping.toLocaleString()}</span>
                        </div>

                        {!isSelfShip && (
                          <div className="flex justify-between">
                            <span>Ad Spend:</span>
                            <span className="font-medium text-black">₹{totalAdSpend.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-gray-200 pt-2">
                          <span className="font-semibold">Total Deduction</span>
                          <span className="font-semibold text-black">₹{totalDeduction.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between border-t border-gray-300 pt-2 text-green-700">
                          <span className="font-semibold">Remitted to Dropshipper</span>
                          <span className="font-bold">₹{remitted.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>



                </div>
              </div>
              {
                totalModals === 1 && groupedByModal[modalNames[0]].length === 1 ? null : (
                  <div>
                    <h3 className="text-[20px] pt-5 font-bold">Color: {selectedVariant?.variant?.color || selectedVariant?.color || 'N/A'}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {[
                        ...new Set(
                          variantDetails.map((item) => {
                            const color =
                              type === "notmy"
                                ? item?.variant?.color
                                : item?.supplierProductVariant?.variant?.color;
                            return color?.trim().toLowerCase();
                          }).filter(Boolean)
                        ),
                      ].map((color, index) => (
                        <button
                          key={index}
                          style={{ backgroundColor: color }}
                          className="px-4 py-2 text-white h-10 w-10  mb-2"
                        >

                        </button>
                      ))}

                      {variantDetails.every((item) => {
                        const color =
                          type === "notmy"
                            ? item?.variant?.color
                            : item?.supplierProductVariant?.variant?.color;
                        return !color;
                      }) && (
                          <div className="px-4 py-2 bg-gray-300 text-black rounded-md mb-2">
                            <span>No Color Found</span>
                          </div>
                        )}
                    </div>
                  </div>
                )
              }

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <h3 className=" text-[20px] flex gap-2 items-center font-bold"><FaTags /> Tags</h3>
                  {(() => {
                    try {
                      const tags = JSON.parse(productDetails?.tags || '[]');
                      if (Array.isArray(tags)) {
                        return tags.map((tag, index) => (<span key={index} className="text-lg"># {tag}</span>
                        ));
                      }
                    } catch (err) {
                      return (
                        <span className="text-sm text-gray-500">No valid tags found</span>
                      );
                    }
                  })()}
                </div>
              </div>
              {otherSuppliers.length > 0 && (
                <>
                  <h3 className=" text-[18px] pt-5 pb-4 font-bold">Other Suppliers</h3>
                  <div className="grid grid-cols-2 gap-3 items-start">
                    {otherSuppliers.map((sup, index) => {
                      const lowestPriceVariant = sup.variants.reduce((min, v) =>
                        v.price < min.price ? v : min
                      );
                      const variant = lowestPriceVariant.variant;

                      return (
                        <div key={index} className="relative">
                          <div


                            className="relative overflow-hidden border-2 border-orange-500  rounded-md p-3 flex gap-3 bg-white max-w-xl w-full shadow cursor-pointer"
                          >
                            {/* Ribbon */}
                            <div className="absolute -right-10 top-13 -rotate-54 z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTooltipToggle(index);
                                }}
                                className="bg-orange-500 text-white text-xs px-8 py-1 font-semibold"
                              >
                                Recommended
                              </button>

                              {/* Tooltip */}
                            </div>


                            {/* Image */}
                            <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={fetchImages(sup?.gallery || '')}
                                alt={variant?.name || 'Variant Image'}
                                width={100}
                                onClick={() => viewProduct(sup?.id)}
                                height={100}
                                className="object-cover w-full h-full"
                              />
                            </div>

                            {/* Details */}
                            <div onClick={() => viewProduct(sup?.id)} className="flex flex-col justify-center text-sm text-gray-800 w-full space-y-1">
                              {/* Title */}
                              <div className="font-medium text-base">
                                {variant?.name || 'N/A'}
                              </div>

                              {/* Rating */}
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <span>{variant?.rating || 4.3}</span>
                                <div className="flex gap-[1px] text-orange-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 fill-current ${i < Math.round(variant?.rating || 4.3)
                                        ? 'fill-orange-500'
                                        : 'fill-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-1 text-gray-500">4,800</span>
                              </div>

                              <div>
                                <strong>Supplier ID:</strong>{" "}
                                <span className="text-orange-500 font-medium">
                                  {sup?.supplier?.uniqeId || "ADMIN-XXXX"}
                                </span>
                              </div>

                              {/* Price */}
                              <div>
                                <strong>Price:</strong> ₹{lowestPriceVariant.price}
                              </div>
                            </div>
                          </div>
                          {tooltipIndex === index && (
                            <div className=" absolute -bottom-20 right-0 mt-2 bg-white text-black shadow-lg border rounded px-3 py-2 text-sm w-48 z-20">
                              This supplier is recommended based on quality and pricing.
                            </div>
                          )}
                        </div>
                      );
                    })}




                  </div>
                </>
              )}
              <div className="description-box my-5">
                <p className="text-xl font-bold text-black mb-3">Description</p>
                {productDetails.description ? (
                  <div
                    className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                    dangerouslySetInnerHTML={{ __html: productDetails.description }}
                  />
                ) : (
                  <p className="text-gray-500">N/A</p>
                )}
              </div>
              <div className="shipping-platform">
                <div className="border border-[#F5F5F5] rounded-xl p-6 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 text-center">
                    {features.map((item, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <span className="text-4xl">  {item.icon}</span>
                        <p className="text-sm text-gray-800 font-medium pt-3">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weight & Dimension:</h3>
                  <p className="text-sm text-gray-800 mt-1">
                    {productDetails?.weight}kg / {productDetails?.package_length} CM, {productDetails?.package_width} CM, {productDetails?.package_height} CM <span className="text-gray-500">(H,L,W)</span>

                  </p>
                </div>

                <hr className="border-gray-200" />

              </div>
              <div
                className={`flex flex-col rounded-md shadow-md border border-gray-300 md:flex-row justify-center items-stretch right-0 gap-4 z-50 bg-white p-3 left-0 bottom-4 m-auto md:w-6/12 animate-[slideUp_0.4s_ease-out] ${isSticky ? "fixed" : ""
                  }`}
                style={{
                  animationFillMode: 'both',
                }}
              >
                <div className="flex gap-3 justify-center">
                  {/* Push to Shopify */}
                  {canPushToShopify && type === 'notmy' && (
                    <button
                      onClick={() => {
                        setShowPopup(true);
                        setInventoryData({
                          supplierProductId: id,
                          id: productDetails.id,
                          variant: variantDetails,
                          isVarientExists: productDetails?.isVarientExists,
                          model: '',
                          shopfyApp: '',
                        });
                      }}
                      className="p-20 py-5 rounded-md flex gap-2 items-center text-white w-full md:text-sm text-xl bg-[#2B3674] hover:bg-[#1f285a] transition duration-300 ease-in-out hover:scale-[1.02]"
                    >
                      <ArrowUpRight /> Push To Shopify
                    </button>
                  )}
                  {canEditFromShopify && type !== 'notmy' && (
                    <button
                      onClick={() => window.open(`https://${dropshipperProduct.shopifyStore.shop}/admin/products/${dropshipperProduct.shopifyProductId?.split('/').pop()}`, '_blank')}
                      className="p-20 py-5 rounded-md mt-2 text-white md:text-sm text-xs bg-black hover:bg-gray-800 transition duration-300 ease-in-out hover:scale-[1.02]"
                    >
                      Edit From Shopify
                    </button>
                  )
                  }
                </div>

                {/* Inline keyframes */}
                <style jsx>{`
                @keyframes slideUp {
                  from {
                    transform: translateY(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateY(0);
                    opacity: 1;
                  }
                }
              `}
                </style>
              </div>

            </div>




          </div>
        </div>
      </section>
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


      <section className="py-5 pb-20">
        <div className="flex gap-4 bg-white rounded-md p-4 mb-8 font-lato text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`md:px-6 px-2 py-2 font-medium md:text-xl border-b-2 transition-all duration-300 ease-in-out
             ${activeTab === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-orange-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <h4 className="text-2xl text-black mb-3 font-semibold">From different sellers</h4>

        {relatedProducts.length === 0 ? (
          <p className="text-center font-bold md:text-3xl mt-8">No Related Products Found</p>
        ) : (
          <div className="grid xl:grid-cols-5 lg:grid-cols-4 grid-cols-2 md:gap-3 gap-2 xl:gap-3">
            {relatedProducts.map((item, index) => {
              const product = item.product || {};
              const variants = item.variants || [];

              const firstVariantImageString =
               product?.gallery || // case 1
                product?.gallery||                         // case 2
                "";

              const imageUrl = firstVariantImageString.split(",")[0]?.trim() || "/default-image.jpg";

              const prices = variants.map(v => v.price).filter(p => typeof p === "number");
              const lowestPrice = prices.length > 0 ? Math.min(...prices) : "-";

              return (
                <div
                  key={index}
                  tabIndex={0} // Enables focus for mobile tap
                  className="bg-white relative overflow-hidden rounded-xl group cursor-pointer shadow-md transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] outline-none"
                >
                  <div className="p-3">
                    {/* FLIP CARD */}
                    <div className="relative h-[200px]  perspective">
                      <div className="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                        {/* FRONT */}
                        <Image
                          src={fetchImages(imageUrl || '')}
                          alt={product.name}
                          height={200}
                          width={100}
                          className="w-full h-full  object-cover backface-hidden"
                        />
                        {/* BACK */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center rotate-y-180 backface-hidden">
                          <span className="text-sm">Back View</span>
                        </div>
                      </div>
                    </div>

                    {/* PRICE & NAME */}
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-lg font-extrabold font-lato text-[#2C3454]">
                        ₹{lowestPrice !== "-" ? lowestPrice : "-"}
                      </p>
                    </div>
                    <p className="text-[13px] text-[#7A7A7A] font-lato font-semibold mt-1 hover:text-black transition-colors duration-300">
                      {product.name}
                    </p>

                    {/* FOOTER */}
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

                    {/* SLIDE-IN BUTTON PANEL */}
                    <div
                      className="absolute bottom-0 left-0 w-full p-3 bg-white z-10 border border-gray-100 shadow
                          opacity-0 translate-y-4 pointer-events-none overflow-hidden
                          group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                          group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto
                          transition-all duration-300"
                    >
                      {canPushToShopify && activeTab === "notmy" && (
                        <button
                          onClick={() => {
                            setShowPopup(true);
                            setInventoryData({
                              supplierProductId: item.id,
                              id: product.id,
                              variant: item.variants,
                              isVarientExists: product?.isVarientExists,
                            });
                          }}
                          className="py-2 px-4 text-white rounded-md md:text-sm  text-xs w-full bg-[#2B3674] hover:bg-[#1f285a] transition duration-300 ease-in-out"
                        >
                          Push To Shopify
                        </button>
                      )}

                      {canEditFromShopify && activeTab === "my" && (
                        <button
                          onClick={() => window.open(`https://${item.shopifyStore.shop}/admin/products/${item.shopifyProductId?.split('/').pop()}`, '_blank')}
                          className="py-2 px-4 mt-2 text-white rounded-md md:text-sm  text-xs  bg-black hover:bg-gray-800 transition duration-300 ease-in-out"
                        >
                          Edit From Shopify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </section>

    </>
  )
}
const VariantCard = ({ variant, handleVariantChange }) => {
  if (!variant) return null;

  return (
    <div key={variant.id} className="space-y-5 border p-4 rounded-lg shadow-sm">
      <div className="flex bg-gray-100 rounded-md p-3 items-start gap-3">
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
