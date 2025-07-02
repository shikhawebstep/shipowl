
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import { Navigation } from 'swiper/modules';
import Swal from 'sweetalert2';
import { HashLoader } from 'react-spinners';
import gift from '@/app/assets/gift.png';
import ship from '@/app/assets/delivery.png';
import img1 from '@/app/assets/quality.png';
import img2 from '@/app/assets/free-delivery.png';
import img3 from '@/app/assets/cod.png';
import img4 from '@/app/assets/return.png';
import { X, Send } from "lucide-react"; // Lucide icons
import { FaCalculator } from "react-icons/fa";
import { BsBoxSeam, BsTruck } from "react-icons/bs";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { MdInventory, MdKeyboardArrowDown } from "react-icons/md";
import { GiWeight } from "react-icons/gi";
import { HiShieldCheck } from "react-icons/hi";
import { LuArrowUpRight } from "react-icons/lu";
import { IoIosReturnLeft } from "react-icons/io";
import { TbCube } from "react-icons/tb";
import { GoArrowUpRight } from "react-icons/go";
import { FiArrowDownLeft } from "react-icons/fi";
import { RiResetRightLine } from "react-icons/ri";
import { RxCross1 } from "react-icons/rx";
import { ChevronRight, ChevronDown } from "lucide-react"; // Optional: Lucide icons
import { useImageURL } from "@/components/ImageURLContext";
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';

const tabs = [
  { key: "notmy", label: "Not Pushed to Shopify" },
  { key: "my", label: "Pushed to Shopify" },
];
const ProductDetails = () => {
  const { InputField, ResultItem, ProductInfo } = useDropshipper();
  const { fetchImages } = useImageURL();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const [showPopup, setShowPopup] = useState(false);
  const [activeModal, setActiveModal] = useState('Shipowl');
  const [shipCost, setShipCost] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };
  const [activeTab, setActiveTab] = useState('notmy');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [openCalculator, setOpenCalculator] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [otherSuppliers, setOtherSuppliers] = useState([]);
  const images = selectedVariant?.variant?.image?.split(",") || selectedVariant?.supplierProductVariant?.variant?.image?.split(",") || [];
  const [shopifyStores, setShopifyStores] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  useEffect(() => {
    const images =
      selectedVariant?.variant?.image?.split(",") ||
      selectedVariant?.image?.split(",") ||
      [];

    setSelectedImage(images[0] ?? "");
  }, [selectedVariant]);
  const [categoryId, setCategoryId] = useState('');
  const [variantDetails, setVariantDetails] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    supplierProductId: "",
    id: '',
    variant: [],
    isVarientExists: '',
    shopifyApp: '',
  });


  //fields for calculator

  const [form, setForm] = useState({
    sellingPrice: '',
    totalOrderQty: '',
    confirmOrderPercentage: '90',
    deliveryPercentage: '50',
    adSpends: '',
    miscCharges: '',
  });

  const [errors, setErrors] = useState({});
  const [showResult, setShowResult] = useState(false);

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


  const resetForm = () => {
    setForm({
      sellingPrice: '',
      totalOrderQty: '',
      confirmOrderPercentage: '90',
      deliveryPercentage: '50',
      adSpends: '',
      miscCharges: '',
    });
    setErrors({});
    setShowResult(false);
  };

  // Safely parsed values
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
        url = `/api/dropshipper/product/inventory/${id}`;
      } else {
        url = `/api/dropshipper/product/my-inventory/${id}`;

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

  
  const handleEdit = async (item) => {


  };
  // Fetch related products by category
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



  const handleVariantChange = (id, field, value) => {
    // If field is global (e.g., shopifyApp), update it at root level
    if (id == null) {
      setInventoryData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
      return;
    }

    // Otherwise, update specific variant
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
      const simplifiedVariants = inventoryData.variant
        .filter(v => v.status === true) // Only include variants with status true
        .map((v) => ({
          variantId: v.id || v.variantId,
          stock: v.dropStock,
          price: v.dropPrice,
          status: v.Dropstatus
        }));

      form.append('supplierProductId', inventoryData.supplierProductId);
      form.append('shopifyApp', inventoryData.shopifyApp);
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
            shopifyApp: ''
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


  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };
  useEffect(() => {
    fetchProductDetails();

  }, [fetchProductDetails]);

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
    image: (v?.variant?.image || v?.supplierProductVariant?.variant?.image || "").split(",")[0],
    suggested_price: v?.price || v?.suggested_price,
    full: v,
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }
  const viewProduct = (id) => {
    if (type == "notmy") {
      router.push(`/dropshipping/product/?id=${id}&type=${type}`);
    } else {

      router.push(`/dropshipping/product/?id=${id}`);
    }
  };
  return (
    <>
      {productDetails && Object.keys(productDetails).length > 0 ? (
        <div>
          <div className="container mx-auto  gap-4 justify-between  rounded-lg flex flex-col md:flex-row">
            {/* Image Slider */}
            <div className="w-full md:w-4/12">
              <div className="rounded-lg bg-white border border-[#E0E2E7] p-4">
                <div className="rounded-lg p-4 w-full">
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
              <h2 className="text-3xl font-bold text-[#2C3454] pb-4">
                {productDetails?.name}
              </h2>

              <p className="text-gray-600">
                Sold: <span className="text-black">1,316 </span> | Rating: ⭐
                <span className="text-black"> {selectedVariant?.variant?.stock} </span> | Stock:
                <span className="text-black"> 25 </span> | Message:
                <span className="text-black"> 140</span>
              </p>

              <div className="md:flex justify-between pb-3 pt-2">
                <p className="text-[#858D9D]">
                  C-Code: <span className="text-black">#302012</span>
                </p>
                <p className="text-[#858D9D]">
                  Created: <span className="text-black">{productDetails?.createdAt ? new Date(productDetails.createdAt).toLocaleDateString() : 'Not Available'}</span>
                </p>
              </div>

              <div className="xl:flex gap-3 items-start justify-between">
                <div>
                  <div className="md:flex gap-3 items-end">
                    <div>
                      <h2 className="text-2xl font-bold">₹{selectedVariant?.price}</h2>
                      <p className="text-gray-500 flex items-center text-sm">
                        <a href="#" className="underline text-sm">
                          Including GST & Shipping Charges
                        </a>
                        <AiOutlineInfoCircle className="ml-1" />
                      </p>
                    </div>

                    <div onClick={() => setOpenCalculator(true)} className="flex items-center bg-purple-100 p-2 rounded-md mt-3 cursor-pointer">
                      <FaCalculator className="text-purple-700 mr-2 text-2xl" />
                      <span className="text-black underline font-semibold text-sm">
                        Calculate <br /> Expected Profit
                      </span>
                    </div>
                  </div>


                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-gray-700 text-sm">
                  <div className="flex items-center">
                    <BsBoxSeam className="mr-2 text-green-600" /> Units Sold:
                    <strong className="ml-1"></strong>
                  </div>
                  <div className="flex items-center">
                    <BsTruck className="mr-2 text-blue-600" /> Delivery Rate: --
                  </div>
                  <div className="flex items-center">
                    <MdInventory className="mr-2 text-green-600" /> Inventory:
                    <strong className="ml-1"></strong>
                  </div>
                  <div className="flex items-center">
                    <GiWeight className="mr-2 text-brown-600" /> Weight:
                    <strong className="ml-1">{productDetails?.weight} g</strong>
                  </div>
                  <div className="flex items-center">
                    <HiShieldCheck className="mr-2 text-blue-600" /> Supplier Score:
                    <strong className="ml-1">4/5</strong>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-purple-600">📦</span> Product GST:
                    <strong className="ml-1">18%</strong>
                  </div>
                </div>
              </div>

              {
                totalModals === 1 && groupedByModal[modalNames[0]].length === 1 ? null : (
                  totalModals === 2 && modalNames.every(model => groupedByModal[model].length === 1) ? (
                    <h3 className="mt-4 font-bold text-[18px] pb-2">Modals</h3>
                  ) : (
                    <h3 className="mt-4 font-bold text-[18px] pb-2">Variants</h3>
                  )
                )
              }
              <div className="">
                {(() => {


                  // CASE 1: 1 model, 1 variant
                  if (totalModals === 1 && groupedByModal[modalNames[0]].length === 1) {
                    const variant = getVariantData(groupedByModal[modalNames[0]][0]);
                    return (
                      <>

                      </>
                    );
                  }

                  // CASE 2: 1 model, multiple variants
                  if (totalModals === 1 && groupedByModal[modalNames[0]].length > 1) {
                    return (
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
                                <div className="flex gap-3">
                                  <div className="md:w-4/12 w-40 overflow-hidden rounded-lg mb-4 mx-auto">
                                    <Image
                                      src={fetchImages(variant.image)}
                                      alt={variant.name}
                                      width={140}
                                      height={140}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="text-sm md:w-8/12 text-gray-700 space-y-1 text-left">
                                    <div>
                                      Name: <span className="font-medium">{variant.name}</span>
                                    </div>
                                    <div>
                                      Color: <span className="font-medium">{variant.color}</span>
                                    </div>
                                    <div className="text-green-600 font-semibold">
                                      Price: ₹{variant.suggested_price}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  }


                  if (totalModals === 2 && modalNames.every(model => groupedByModal[model].length === 1)) {
                    return (
                      <div className="space-y-4">
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
                              {isSelected && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  ₹{variant.suggested_price}
                                </span>
                              )}
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
                        <div className="flex gap-3 mb-4 border-b pb-2">
                          {modalNames.map((model, index) => (
                            <button
                              key={index}
                              className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 ${activeModal === model
                                ? "border-orange-600 text-orange-600"
                                : "border-transparent text-gray-600 hover:text-orange-500"
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
                                  className={`px-4 py-3 rounded-lg border transition-shadow duration-300 cursor-pointer ${isSelected
                                    ? "border-dotted border-2 border-orange-600 shadow-md bg-orange-50"
                                    : "border-gray-300 hover:shadow-lg bg-white"
                                    }`}
                                >
                                  <div className="flex gap-3">
                                    <div className="md:w-4/12 w-40 overflow-hidden rounded-lg mb-4 mx-auto">
                                      <Image
                                        src={fetchImages(variant.image)}
                                        alt={variant.name}
                                        width={140}
                                        height={140}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>
                                    <div className="text-sm md:w-8/12 text-gray-700 space-y-1 text-left">
                                      <div>Name: <span className="font-medium">{variant.name}</span></div>
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




              <div className="mt-4 border-t border-[#E0E2E7] pt-0">
                <div className="flex gap-6 flex-wrap">
                  {
                    totalModals === 1 && groupedByModal[modalNames[0]].length === 1 ? null : (
                      <div>
                        <h3 className="text-[18px] pt-5 font-bold">Color Variant</h3>
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
                              className="px-4 py-2 text-white rounded-md mb-2"
                            >
                              <span className="capitalize">{color}</span>
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


                  <div className="">
                    <h3 className=" text-[18px] pt-5 font-bold">Product Tags</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {(() => {
                        try {
                          const tags = JSON.parse(productDetails?.tags || '[]');
                          if (Array.isArray(tags)) {
                            return tags.map((tag, index) => (
                              <button
                                key={index}
                                className="px-4 py-2 text-white bg-green-400 rounded-md mb-2"
                              >
                                <span>{tag}</span>
                              </button>
                            ));
                          }
                        } catch (err) {
                          console.warn('Invalid tags JSON:', productDetails?.tags);
                          return (
                            <span className="text-sm text-gray-500">No valid tags found</span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div>
                    {otherSuppliers.length > 0 && (
                      <>
                        <h3 className=" text-[18px] pt-5 font-bold">Other Suppliers</h3>
                        <div className="grid grid-cols-2 gap-3 items-start">
                          {otherSuppliers.map((sup, index) => {
                            // Find the variant with the lowest price
                            const lowestPriceVariant = sup.variants.reduce((min, v) =>
                              v.price < min.price ? v : min
                            );

                            return (
                              <div onClick={() => viewProduct(sup?.id)} key={index} className="mb-4 p-3 border-dotted  border-2 border-orange-600 shadow-md bg-orange-50  rounded">
                                <div>
                                  <strong>Supplier ID:</strong> {sup?.supplier?.uniqeId || 'NIL'}
                                </div>

                                <div className='flex gap-3'>
                                  <strong> Price:</strong> ₹{lowestPriceVariant.price}
                                </div>

                              </div>
                            );
                          })}

                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <p className="pt-5 text-[18px] font-bold">Desciption</p>


              {productDetails.description ? (
                <div
                  className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                  dangerouslySetInnerHTML={{ __html: productDetails.description }}
                />
              ) : (
                <p className="text-gray-500">NIL</p>
              )}



              <p className="pt-2 text-[18px] font-bold border-t mt-3 border-[#E0E2E7]">Platform Assurance</p>
              <div className="xl:grid lg:grid-cols-4 flex my-5 md:my-0 overflow-auto gap-8">
                <div className="col">
                  <Image src={img1} alt="" className="md:p-3 max-w-[150px] xl:max-w-full lg:w-full" />
                </div>
                <div className="col">
                  <Image src={img2} alt="" className="md:p-3 max-w-[150px] xl:max-w-full lg:w-full" />
                </div>
                <div className="col">
                  <Image src={img3} alt="" className="md:p-3 max-w-[150px] xl:max-w-full lg:w-full" />
                </div>
                <div className="col">
                  <Image src={img4} alt="" className="md:p-3 max-w-[150px] xl:max-w-full lg:w-full" />
                </div>
              </div>

              <div className='border-t mt-3 border-[#E0E2E7] pt-2'>
                <h3 className="text-[18px] font-bold">Weight & Dimension:</h3>
                <p className="text-black font-medium pt-2">
                  {productDetails?.weight}kg / {productDetails?.package_length} CM, {productDetails?.package_width} CM, {productDetails?.package_height} CM <span className="text-gray-500">(H,L,W)</span>
                </p>

                <div className="mt-4 grid md:grid-cols-2 border-t border-[#E0E2E7] pt-4 items-stretch gap-3">
                  {type === "notmy" ? (
                    <button onClick={() => {
                      setShowPopup(true);
                      setInventoryData({
                        supplierProductId: productDetails.id,
                        id: productDetails.id,
                        variant: variantDetails,
                        isVarientExists: productDetails?.isVarientExists,
                        shopifyApp: '',
                      });
                    }} className="bg-orange-500 text-white px-6 py-3 text-xl flex items-center justify-center w-full sm:w-autofont-semibold">
                      <LuArrowUpRight className="mr-2" /> Push To Shopify
                    </button>

                  ) :
                    (
                      <button className="bg-black text-white px-6 py-3 text-xl flex items-center justify-center w-full sm:w-autofont-semibold">
                        <LuArrowUpRight className="mr-2" />  Edit From Shopify
                      </button>
                    )}


                  <div className="bg-gray-100 p-3 rounded-md gap-2 flex items-start w-full sm:w-auto text-sm text-gray-600">
                    <IoIosReturnLeft className="text-5xl text-gray-500" />
                    <p className="text-sm">
                      RTO & RVP charges are applicable and vary depending on the product
                      weight.{" "}
                      <a href="#" className="text-black underline font-semibold">
                        View charges for this product
                      </a>
                    </p>
                    <MdKeyboardArrowDown className="text-5xl text-gray-500" />
                  </div>
                </div>
              </div>
            </div>


          </div>


          <section className="py-5">
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
              <p className="text-center font-bold text-3xl mt-8">No Related Products Found</p>
            ) : (
              <div className="grid xl:grid-cols-5 lg:grid-cols-4 grid-cols-2 md:gap-6 gap-2 xl:gap-10">
                {relatedProducts.map((item, index) => {
                  const product = item.product || {};
                  const variants = item.variants || [];
                  const variantImg = variants[0]?.varinat?.image;
                  const prices = variants.map(v => v.price).filter(p => typeof p === "number");
                  const lowestPrice = prices.length > 0 ? Math.min(...prices) : "-";
                  const productName = product.name || "Unnamed Product";

                  return (
                    <div
                      key={index}
                      tabIndex={0} // Enables focus for mobile tap
                      className="bg-white relative overflow-hidden rounded-xl group cursor-pointer shadow-md transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] outline-none"
                    >
                      <div className="p-3">
                        {/* FLIP CARD */}
                        <div className="relative md:h-[200px] h-[100px] perspective">
                          <div className="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                            {/* FRONT */}
                            <Image
                              src={fetchImages(variantImg)}
                              alt={productName}
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
                          {productName}
                        </p>

                        {/* FOOTER */}
                        <div className="flex items-center border-t pt-3 group-hover:pb-16 mt-5 border-[#EDEDED] justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Image src={gift} className="w-5" alt="Gift" />
                            <span className="font-lato text-[#2C3454] font-bold">MOQ: -</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Image src={ship} className="w-5" alt="Shipping" />
                            <span className="font-lato text-[#2C3454] font-bold">Rating: -</span>
                          </div>
                        </div>

                        {/* SLIDE-IN BUTTON PANEL */}
                        <div
                          className="absolute bottom-0 left-0 w-full p-3 bg-white z-10 border border-gray-100 shadow
                       opacity-0 translate-y-4 pointer-events-none overflow-hidden
                       group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                       group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto
                       transition-all duration-300"
                        >
                          {activeTab === "notmy" && (
                            <button
                              onClick={() => {
                                setShowPopup(true);
                                setInventoryData({
                                  supplierProductId: product.id,
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

                          {activeTab === "my" && (
                            <button
                              onClick={() => handleEdit(product.id)}
                              className="py-2 px-4 mt-2 text-white rounded-md md:text-sm  text-xs w-full bg-black hover:bg-gray-800 transition duration-300 ease-in-out"
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

          {showPopup && (
            <div className="px-6 md:px-0 fixed inset-0 bg-[#000000b0] bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white border border-orange-500 h-[85%] overflow-x-auto p-6 rounded-lg w-full max-w-5xl shadow-xl relative">
                <h2 className="text-xl font-semibold mb-4">Push To Shopify</h2>

                {(() => {
                  const varinatExists = inventoryData?.isVarientExists ? 'yes' : 'no';
                  const isExists = varinatExists === "yes";
                  return (
                    <>
                      <div className="mb-2">
                        <select
                          className="w-full mt-1 border border-[#E0E2E7] shadow p-2 rounded-md"
                          name="shopifyApp"
                          id="shopifyApp"
                          onChange={(e) =>
                            handleVariantChange(null, 'shopifyApp', e.target.value)
                          }
                          value={inventoryData.shopifyApp || ''}
                        >
                          <option value="">Select Store</option>
                          {shopifyStores.map((item, index) => (
                            <option value={item.id} key={index}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {inventoryData.variant?.map((v, idx) => {
                          const variantInfo = {
                            ...(v.variant || {}),
                            ...v,
                          };

                          const imageUrls = variantInfo.image
                            ? variantInfo.image.split(',').map((img) => img.trim()).filter(Boolean)
                            : [];

                          return (
                            <div
                              key={variantInfo.id || idx}
                              className="relative bg-white border border-[#E0E2E7] shadow rounded-lg p-4  hover:shadow-lg transition group"
                            >
                              <div className="flex items-center gap-4 mb-4">
                                <div className="flex gap-2 overflow-x-auto max-w-[120px]">
                                  {imageUrls.length > 0 ? (
                                    imageUrls.map((url, i) => (
                                      <Image
                                        key={i}
                                        height={100}
                                        width={100}
                                        src={fetchImages(url)}
                                        alt={variantInfo.name || 'NIL'}
                                        className="shrink-0 border border-[#E0E2E7] shadow "
                                      />
                                    ))
                                  ) : (
                                    <Image
                                      height={40}
                                      width={40}
                                      src="https://placehold.co/600x400"
                                      alt="Placeholder"
                                      className="rounded shrink-0"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold">Model: {variantInfo.model || 'NIL'}</p>
                                  {isExists && (
                                    <>
                                      <p>Name: {variantInfo.name || 'NIL'}</p>
                                      <p>SKU: {variantInfo.sku || 'NIL'}</p>
                                      <p>Color: {variantInfo.color || 'NIL'}</p>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <input
                                  type="number"
                                  placeholder="Stock"
                                  name="dropStock"
                                  className="w-full border border-[#E0E2E7] shadow rounded p-2"
                                  value={variantInfo.dropStock || ''}
                                  onChange={(e) => handleVariantChange(variantInfo.id, 'dropStock', e.target.value)}
                                />
                                <input
                                  type="number"
                                  placeholder="Price"
                                  name="dropPrice"
                                  className="w-full border border-[#E0E2E7] shadow rounded p-2"
                                  value={variantInfo.dropPrice || ''}
                                  onChange={(e) => handleVariantChange(variantInfo.id, 'dropPrice', e.target.value)}
                                />

                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    name="Dropstatus"
                                    className="sr-only"
                                    checked={!!variantInfo.Dropstatus}
                                    onChange={(e) => handleVariantChange(variantInfo.id, 'Dropstatus', e.target.checked)}
                                  />
                                  <div
                                    className={`relative w-10 h-5 rounded-full transition ${variantInfo.Dropstatus ? 'bg-orange-500' : 'bg-gray-300'}`}
                                  >
                                    <div
                                      className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition ${variantInfo.Dropstatus ? 'translate-x-5' : ''
                                        }`}
                                    ></div>
                                  </div>
                                  <span className="ml-2 text-sm">{variantInfo.Dropstatus ? 'Active' : 'Inactive'}</span>
                                </label>
                              </div>



                            </div>
                          );
                        })}
                      </div>




                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowPopup(false)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                        >
                          <X size={16} />
                          Cancel
                        </button>

                        <button
                          onClick={handleSubmit}
                          className="flex items-center gap-2 px-4 py-2 bg-[#F98F5C] text-white rounded hover:bg-[#e97b45] transition-colors"
                        >
                          <Send size={16} />
                          Submit
                        </button>
                      </div>
                    </>
                  );

                })()}

                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <p className="text-center font-bold text-3xl mt-8"> Product Not Found</p>
      )}

      {openCalculator && (() => {
        // 1. Move your calculations outside JSX block
        const sellingPrice = parseFloat(form.sellingPrice) || 0;
        const totalOrderQty = parseFloat(form.totalOrderQty) || 0;
        const confirmOrderPercentage = parseFloat(form.confirmOrderPercentage) || 0;
        const deliveryPercentage = parseFloat(form.deliveryPercentage) || 0;
        const adSpends = parseFloat(form.adSpends) || 0;
        const miscCharges = parseFloat(form.miscCharges) || 0;
        const confirmedQty = Math.round(totalOrderQty * (confirmOrderPercentage / 100));
        const deliveredQty = Math.round(confirmedQty * (deliveryPercentage / 100));
        const deliveredRTOQty = confirmedQty - deliveredQty;


        const shipOwlPrice = selectedVariant?.price || 0;
        const deliveryCostPerUnit = shipCost || 75;
        let codCollected = 0;
        let prepaidProductCost = 0;
        let shippingCost = 0;
        let totalAddSpend = adSpends * totalOrderQty;
        let totalExpenses = 0;
        let shippingCharges = 0;
        let finalEarnings = 0;
        let finalMargin = 0;
        let profitPerOrder = 0;
        let perOrderMargin = 0;
        const variantsModal = selectedVariant?.variant?.model || selectedVariant?.supplierProductVariant?.variant?.model

        if (variantsModal.toLowerCase() === 'selfship') {
          prepaidProductCost = shipOwlPrice * confirmedQty;
          shippingCost = deliveryCostPerUnit * confirmedQty;
          codCollected = sellingPrice * deliveredQty;
          perOrderMargin = sellingPrice - shipOwlPrice;
          finalEarnings = perOrderMargin * deliveredQty;
          shippingCharges = deliveryCostPerUnit * confirmedQty;
          totalExpenses = prepaidProductCost + totalAddSpend + miscCharges + shippingCharges;
          finalMargin = codCollected - shippingCharges;
          profitPerOrder = totalOrderQty ? finalMargin / totalOrderQty : 0;
        }

        if (variantsModal.toLowerCase() === 'shipowl') {
          codCollected = sellingPrice * deliveredQty;
          prepaidProductCost = shipOwlPrice * deliveredQty;
          shippingCost = deliveryCostPerUnit * confirmedQty;
          perOrderMargin = sellingPrice - shipOwlPrice;
          finalEarnings = perOrderMargin * deliveredQty;
          shippingCharges = deliveryCostPerUnit * confirmedQty;
          totalExpenses = prepaidProductCost + totalAddSpend + shippingCharges - miscCharges;
          finalMargin = codCollected - totalExpenses;

        }
        // 2. Return your JSX
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center border-b pb-3">
                <div className='flex gap-3 items-center'>
                  <div className='bg-gray-200 text-center p-3 flex justify-center items-center rounded-full'>
                    <FaCalculator className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Pricing Calculator</h2>
                    <p className='text-xs'>Please enter all the required fields (<span className='text-red-500'>*</span>) to calculate your expected profit</p>
                  </div>
                </div>
                <div className='flex gap-4 justify-end'>
                  <button className="text-sm underline font-bold items-center gap-2 flex text-black" onClick={resetForm}>
                    <RiResetRightLine /> Reset
                  </button>
                  <button onClick={() => { setOpenCalculator(false); resetForm }} className="text-sm text-black font-bold" >
                    <RxCross1 />
                  </button>
                </div>
              </div>

              {/* Info Bar */}
              <div className="flex gap-6 mt-4 mb-6">
                <Image

                  src={fetchImages(
                    selectedVariant?.variant?.image
                      ? selectedVariant.variant.image.split(",")[0]
                      : "https://placehold.co/600x400"
                  )}

                  alt='Invalid Image'
                  height={50}
                  width={50}
                />

                <ProductInfo label="Shipowl Price" value={selectedVariant?.price} />
                <ProductInfo label="Model" value={variantsModal} />
                <ProductInfo label="RTO Charges" value={shipCost || 75} />
                <ProductInfo label="Product Weight" value={`${productDetails?.weight} GM `} />
              </div>

              {/* Main Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Side */}
                <div className="space-y-4 bg-[#f5f5f5] rounded-md p-4">
                  <InputField
                    label="Selling Price"
                    value={form.sellingPrice}
                    onChange={(val) => handleChange('sellingPrice', val)}
                    error={errors.sellingPrice}
                    required

                  />
                  <InputField
                    label="Expected Orders"
                    value={form.totalOrderQty}
                    onChange={(val) => handleChange('totalOrderQty', val)}
                    error={errors.totalOrderQty}
                    required
                  />
                  <InputField
                    label="Confirmed Orders (%)"
                    value={form.confirmOrderPercentage}
                    onChange={(val) => handleChange('confirmOrderPercentage', Math.min(100, val))}
                    error={errors.confirmOrderPercentage}
                    required
                    suffix="%"
                  />
                  <InputField
                    label="Expected Delivery (%)"
                    value={form.deliveryPercentage}
                    onChange={(val) => handleChange('deliveryPercentage', Math.min(100, val))}
                    error={errors.deliveryPercentage}
                    required
                    suffix="%"
                  />
                  <InputField
                    label="Ad Spends per Order"
                    value={form.adSpends}
                    onChange={(val) => handleChange('adSpends', val)}
                    error={errors.adSpends}
                    required
                    suffix="₹"
                  />
                  <InputField
                    label="Total Misc. Charges"
                    value={form.miscCharges}
                    onChange={(val) => handleChange('miscCharges', val)}
                    suffix="₹"
                  />
                </div>


                {/* Results Side */}
                <div>
                  <div className={`p-4 rounded-md ${showResult ? (finalMargin < 0 ? 'bg-red-50' : 'bg-green-50') : 'bg-gray-100'}`}>
                    <ResultItem label="Net Profit" value={`₹${finalMargin}`} isVisible={showResult} />
                    <p className='text-xs'>Total Earnings - Total Spends</p>
                    <hr className='my-4' />
                    <ResultItem label="Net Profit (Per Order)" value={`₹${finalMargin / totalOrderQty}`} isVisible={showResult} />
                    <p className='text-xs'>Net Profit / Expected Orders</p>
                  </div>


                  <div className="border border-gray-300 p-4 rounded-md space-y-4 mt-3">
                    {/* Orders Section */}
                    <div className="border-b border-gray-200 pb-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection("orders")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <TbCube className="text-purple-700" />
                          </div>
                          <ResultItem
                            label="# Orders"
                            value={totalOrderQty}
                            isVisible={showResult}
                            placeholder="-"
                          />
                        </div>
                        {openSection === "orders" ? (
                          <ChevronDown className="text-gray-500" />
                        ) : (
                          <ChevronRight className="text-gray-500" />
                        )}
                      </div>
                      {openSection === "orders" && (
                        <div className="inner-item mt-2 pl-10 text-sm text-gray-700 space-y-1">
                          <ul>
                            <li>
                              Confirmed Orders: <span>{confirmedQty}</span>
                            </li>
                            <li>
                              Delivered Orders: <span>{deliveredQty}</span>
                            </li>
                            <li>
                              RTO Orders: <span>{deliveredRTOQty}</span>
                            </li>
                            <li>
                              Cancelled Orders: <span>{totalOrderQty - confirmedQty}</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Earnings Section */}
                    <div className="border-b border-gray-200 pb-2">
                      <div className="flex items-center  cursor-pointer"
                        onClick={() => toggleSection("earnings")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="bg-green-100 p-2 rounded-full">
                            <FiArrowDownLeft className="text-green-700" />
                          </div>
                          <ResultItem
                            label="Total Earnings"
                            value={`₹${finalEarnings}`}
                            isVisible={showResult}
                          />
                        </div>
                        {openSection === "earnings" ? (
                          <ChevronDown className="text-gray-500" />
                        ) : (
                          <ChevronRight className="text-gray-500" />
                        )}
                      </div>
                      {openSection === "earnings" && (
                        <div className="inner-item mt-2 pl-10 text-sm text-gray-700 space-y-1">
                          <ul>
                            <li>

                              Margin Per Order: <span>{sellingPrice > 0 ? sellingPrice - shipOwlPrice : '-'}</span>
                            </li>
                            <li>
                              Delivered Orders: <span>{deliveredQty}</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Expenses Section */}
                    <div className="border-b border-gray-200 pb-2">
                      <div
                        className="flex items-center justify-between cursor-pointer w-full"
                        onClick={() => toggleSection("expenses")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="bg-red-100 p-2 rounded-full">
                            <GoArrowUpRight className="text-red-700" />
                          </div>
                          <ResultItem
                            label="Total Spends"
                            value={`₹ ${totalExpenses}`}
                            isVisible={showResult}
                          />
                        </div>
                        {openSection === "expenses" ? (
                          <ChevronDown className="text-gray-500" />
                        ) : (
                          <ChevronRight className="text-gray-500" />
                        )}
                      </div>
                      {openSection === "expenses" && (
                        <div className="inner-item mt-2 pl-10 text-sm text-gray-700 space-y-1">
                          <ul>

                            <li>
                              Product Cost: <span>{prepaidProductCost}</span>
                            </li>


                            <li>
                              Total Ad Spends: <span>{totalAddSpend}</span>
                            </li>
                            <li>
                              Shipping Charges: <span>{shippingCharges}</span>
                            </li>

                            <li>
                              (+)Total Misc. Charges: <span>{miscCharges}</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-xs text-gray-500 mt-6">
                Note: This calculator provides estimated figures. Actual results may vary. Shipowl does not commit to any expected profit based on these calculations.
              </p>
            </div>
          </div>
        );
      })()}
    </>


  );
};

export default ProductDetails;
