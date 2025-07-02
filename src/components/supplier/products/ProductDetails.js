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
import { LuArrowUpRight } from "react-icons/lu";
import { FaTags } from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import { Package, Boxes, Archive, Star, Tag, Truck, Weight, Banknote, ShieldCheck, RotateCcw, ArrowUpRight, ArrowLeft, Store, ChevronDown } from 'lucide-react';
import { useImageURL } from "@/components/ImageURLContext";
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
const tabs = [
  { key: "notmy", label: "Not Listed Products" },
  { key: "my", label: "Listed Products" },
];
const ProductDetails = () => {
  const { fetchImages } = useImageURL();
  const router = useRouter();
  const { hasPermission } = useSupplier();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const [showPopup, setShowPopup] = useState(false);
  // Dynamic images setup
  const [isSticky, setIsSticky] = useState(false);
  const canCreate = hasPermission("Product", "Add to List");
  const canUpdate = hasPermission("Product", "Update");

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [openSection, setOpenSection] = useState(null);
  const [shipCost, setShipCost] = useState([]);
  const [isEdit, setIsEdit] = useState(false);


  const [activeModal, setActiveModal] = useState('Shipowl');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };
  const [activeTab, setActiveTab] = useState('notmy');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [openCalculator, setOpenCalculator] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [otherSuppliers, setOtherSuppliers] = useState([]);
  const images = selectedVariant?.variant?.image?.split(",") || selectedVariant?.image?.split(",") || [];
  const [shopifyStores, setShopifyStores] = useState([]);

  const [selectedImage, setSelectedImage] = useState("");

  // This will update selectedImage when selectedVariant changes
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
    productId: "",
    variant: [],
    id: '',
    isVarientExists: '',
  });
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

  const fetchProductDetails = useCallback(async () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);
      let url;
      if (type === "notmy") {
        url = `/api/supplier/product/inventory/${id}`;
      } else {
        url = `/api/supplier/product/my-inventory/${id}`;

      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
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
      setShipCost(result?.shippingCost || []);

      if (type === "notmy") {
        const ProductDataSup = result?.product;
        const ProductDataOther = result?.otherSuppliers;

        setProductDetails(ProductDataSup || {});
        setOtherSuppliers(ProductDataOther || []);

        const sortedVariants = (ProductDataSup?.variants || []).slice().sort(
          (a, b) => a.suggested_price - b.suggested_price
        );
        setVariantDetails(sortedVariants);
        setSelectedVariant(sortedVariants[0]);

        if (ProductDataSup) {
          setCategoryId(ProductDataSup?.product?.categoryId);
          fetchRelatedProducts(ProductDataSup?.categoryId, activeTab);
        }

      } else {
        const ProductDataDrop = result?.supplierProduct;

        setProductDetails(ProductDataDrop?.product || {});

        const sortedVariants = (ProductDataDrop?.variants || []).slice().sort(
          (a, b) => a.price - b.price
        );
        setVariantDetails(sortedVariants);
        setSelectedVariant(sortedVariants[0]);

        if (ProductDataDrop) {
          setCategoryId(ProductDataDrop?.product?.categoryId);
          fetchRelatedProducts(ProductDataDrop?.product?.categoryId, activeTab);
        }
      }


    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router, activeTab]);


  const fetchRelatedProducts = useCallback(async (catid, tab) => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product/inventory?category=${catid}&type=${tab}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
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
    setInventoryData((prevData) => ({
      ...prevData,
      variant: prevData.variant.map((v) =>
        v.id === id ? { ...v, [field]: field === 'qty' || field === 'shipowl_price' ? Number(value) : value } : v
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "supplier") {
      localStorage.clear("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
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
        .map(v => ({
          variantId: v.id || v.variantId,
          stock: v.stock,
          price: v.price,
          status: v.status
        }));

      form.append('productId', inventoryData.productId);
      form.append('variants', JSON.stringify(simplifiedVariants));



      const url = isEdit ? `/api/supplier/product/my-inventory/${id}` : "/api/supplier/product/my-inventory";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
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
          title: isEdit ? "Updation Failed" : "Creation Failed",
          text: result.message || result.error || "An error occurred",
        });
        Swal.close();
        return;
      }

      // On success
      Swal.fire({
        icon: "success",
        title: isEdit ? "Product Updated" : "Product Created",
        text: `The Product has been ${isEdit ? "Updated" : "Created"} successfully!`,
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setInventoryData({
            productId: "",
            variant: [],
            id: '',
          });
          setShowPopup(false);
          fetchProductDetails();
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
      Swal.close();
    } finally {
      setLoading(false);
    }
  };


  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };


  const groupedByModal = variantDetails.reduce((acc, curr) => {
    const model = curr?.model || curr?.variant?.model || "Unknown";
    if (!acc[model]) acc[model] = [];
    acc[model].push(curr);
    return acc;
  }, {});

  const modalNames = Object.keys(groupedByModal);
  const totalModals = modalNames.length;

  const getVariantData = (v) => ({
    id: v?.id || v?.variant?.id,
    name: v?.name || v?.variant?.name || "NIL",
    model: v?.model || v?.variant?.model || "Unknown",
    color: v?.color || v?.variant?.color || "NIL",
    image: (v?.image || v?.variant?.image || "").split(",")[0],
    suggested_price: v?.price || v?.suggested_price,
    full: v,
  });
  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }


  return (
    <>
      <section className="productsingal-page pb-[100px]">
        <div className="container">

          <div className="mx-auto  gap-4 justify-between  rounded-lg flex flex-col md:flex-row">
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
                <p className='font-bold text-2xl'>₹ {selectedVariant?.suggested_price || selectedVariant?.price || 'N/A'}</p>


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
                                          <div className="bg-[#F7F5F5] overflow-hidden flex justify-center items-center rounded mb-4 mx-auto">
                                            <Image
                                              src={fetchImages(variant.image)}
                                              alt={variant.name}
                                              width={140}
                                              height={140}
                                              className="object-cover w-full h-full"
                                            />
                                          </div>
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
                                          <div className="bg-[#F7F5F5] overflow-hidden flex justify-center items-center rounded mb-4 mx-auto">
                                            <Image
                                              src={fetchImages(variant.image)}
                                              alt={variant.name}
                                              width={140}
                                              height={140}
                                              className="object-cover w-full h-full"
                                            />
                                          </div>
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
                                ? item?.color
                                : item?.variant?.color;
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
                            ? item?.color
                            : item?.variant?.color;
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
                        return tags.map((tag, index) => (<span key={index} className="text-lg capitalize"># {tag},</span>
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
              >              <div className="flex gap-3 justify-center ">
                  {/* Push to Shopify */}
                  {canCreate && type === "notmy" && (
                    <button onClick={() => {
                      setShowPopup(true);
                      setInventoryData({
                        productId: productDetails.id,
                        id: productDetails.id,
                        variant: variantDetails,
                        isVarientExists: productDetails?.isVarientExists,
                      });
                    }} className="bg-orange-500 text-white px-20 py-3 rounded-md text-xl flex items-center justify-center sm:w-autofont-semibold">
                      <LuArrowUpRight className="mr-2" /> Add To List
                    </button>

                  )}
                  {canUpdate && type !== "notmy" && (
                    <button onClick={() => {
                      setShowPopup(true);
                      setInventoryData({
                        productId: productDetails.id,
                        id: productDetails.id,
                        variant: variantDetails,
                        isVarientExists: productDetails?.isVarientExists,
                      });
                      setIsEdit(true)
                    }} className="bg-black text-white px-20 rounded-md py-3 text-xl flex items-center justify-center sm:w-autofont-semibold">
                      <LuArrowUpRight className="mr-2" />  Edit List
                    </button>
                  )
                  }


                  {/* Info Box */}

                </div>
              </div>

            </div>


          </div>
        </div>
      </section>
      {showPopup && (
        <div className="fixed inset-0 bg-[#00000087] bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg border-orange-500 w-full border max-w-5xl shadow-xl relative">
            <h2 className="text-2xl  flex justify-center gap-3 items-center text-center underline font-semibold mb-6 text-orange-500"><MdInventory /> Add To List</h2>

            {(() => {
              const varinatExists = inventoryData?.isVarientExists ? "yes" : "no";
              const isExists = varinatExists === "yes";

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-1">
                    {inventoryData.variant?.map((variant, idx) => {

                      const imageUrls = variant?.variant?.image
                        ? variant.variant.image.split(",").map((img) => img.trim()).filter(Boolean)
                        : variant?.image
                          ? variant.image.split(",").map((img) => img.trim()).filter(Boolean)
                          : [];

                      return (
                        <div
                          key={variant.id || idx}
                          className="bg-white p-4 rounded-md  border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                        >
                          <div className='flex gap-2 relative'>
                            {/* Image Preview */}
                            <div className="flex items-center gap-2 overflow-x-auto h-[200px] w-full object-cover  border border-[#E0E2E7] rounded-md p-3shadow bg-white">
                              {imageUrls.length > 0 ? (
                                imageUrls.map((url, i) => (
                                  <Image
                                    key={i}
                                    height={100}
                                    width={100}
                                    src={fetchImages(url)}
                                    alt={variant.name || 'NIL'}
                                    className="h-full w-full object-cover"
                                  />
                                ))
                              ) : (
                                <Image
                                  height={40}
                                  width={40}
                                  src="https://placehold.com/600x400"
                                  alt="Placeholder"
                                  className="rounded shrink-0"
                                />
                              )}
                            </div>
                            <div className="absolute top-0 left-0 w-full text-center bg-orange-500 p-2 text-white ">Suggested Price :{variant?.suggested_price || variant?.price}</div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="text-sm text-gray-700 w-full  border-gray-200">
                              <tbody>
                                <tr className='border border-gray-200'>
                                  <th className="text-left border-gray-200 border p-2 font-semibold ">Model:</th>
                                  <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.model || variant?.variant?.model || "NIL"}</td>
                                  <th className="text-left border-gray-200 border p-2 font-semibold ">Name:</th>
                                  <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.name || variant?.variant?.name || "NIL"}</td>


                                </tr>

                                {isExists && (
                                  <>
                                    <tr className='border border-gray-200'>


                                      <th className="text-left border-gray-200 border p-2 font-semibold ">SKU:</th>
                                      <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.sku || variant?.variant?.sku || "NIL"}</td>

                                      <th className="text-left border-gray-200 border p-2 font-semibold ">Color:</th>
                                      <td className='p-2 border border-gray-200 whitespace-nowrap'>{variant.color || variant?.variant?.color || "NIL"}</td>
                                    </tr>
                                  </>
                                )}

                              </tbody>
                            </table>
                          </div>


                          {/* Input Fields */}
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-end gap-2 border-b border-gray-200">
                              <label>Stock</label>
                              <input
                                type="number"
                                name="stock"
                                className="px-3 w-full py-2 text-sm"
                                value={variant.stock || ""}
                                onChange={(e) =>
                                  handleVariantChange(variant.id, "stock", e.target.value)
                                }
                              />
                            </div>
                            <div className="flex items-end gap-2 border-b border-gray-200">
                              <label>Price</label>
                              <input
                                type="number"
                                name="price"
                                className="px-3 w-full py-2 text-sm"
                                value={variant.price || ""}
                                onChange={(e) =>
                                  handleVariantChange(variant.id, "price", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          {/* Status Switch */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Add To List:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={variant.status || false}
                                onChange={(e) =>
                                  handleVariantChange(variant.id, "status", e.target.checked)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-orange-500 transition-all"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transform transition-all"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition"
                    >
                      <span>Cancel</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleSubmit(e)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                    >
                      <span>Submit</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowPopup(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
                  >
                    ×
                  </button>
                </>
              );

            })()}
          </div>
        </div>
      )}

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
          <p className="text-center font-bold text-3xl mt-8">No Related Products Found</p>
        ) : (
          <div className="grid xl:grid-cols-5 lg:grid-cols-4 grid-cols-2 md:gap-3 gap-2 xl:gap-10">
            {relatedProducts.map((item, index) => {
              const product = type == "notmy" ? item : item || {};
              const variants = item.variants || [];

              const getPriceDisplay = (variants) => {
                if (!variants?.length) return <span>N/A</span>;

                const modalMap = {};
                variants.forEach((variant) => {
                  const model = variant?.variant?.model || variant?.model || "Default";
                  if (!modalMap[model]) modalMap[model] = [];
                  modalMap[model].push(variant);
                });

                const modalKeys = Object.keys(modalMap);

                // Case 1: Only 1 model and 1 variant
                if (modalKeys.length === 1 && modalMap[modalKeys[0]].length === 1) {
                  const price = modalMap[modalKeys[0]][0].suggested_price ?? modalMap[modalKeys[0]][0].price ?? 0;
                  return <span>{modalKeys[0]}: ₹{price}</span>;
                }

                // Case 2: 1 model, multiple variants
                if (modalKeys.length === 1 && modalMap[modalKeys[0]].length > 1) {
                  const prices = modalMap[modalKeys[0]].map(v => v?.suggested_price ?? v?.price ?? 0);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return <span>{modalKeys[0]}: ₹{min} - ₹{max}</span>;
                }

                // Case 3 or 4: multiple models
                return (
                  <>
                    {modalKeys.map((model, idx) => {
                      const modelVariants = modalMap[model];
                      const prices = modelVariants.map(v => v?.suggested_price ?? v?.price ?? 0);
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      const priceLabel = (min === max) ? `₹${min}` : `₹${min} - ₹${max}`;
                      return (
                        <span className='block' key={model}>
                          {model}: {priceLabel}
                          {idx < modalKeys.length - 1 && <span className="mx-1"></span>}
                        </span>
                      );
                    })}
                  </>
                );
              };


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
                          src={fetchImages(item?.variants?.[0]?.variant?.image || item?.variants?.[0]?.image || '')}
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
                        {getPriceDisplay(product.variants)}
                      </p>
                    </div>
                    <p className="text-[13px] text-[#7A7A7A] font-lato font-semibold mt-1 hover:text-black transition-colors duration-300">
                      {product.name}
                    </p>

                    <div className="flex items-center gap-2">
                      <Tag size={16} />
                      <span>SKU: {product?.main_sku || "-"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span>Shipping Time: {product?.shipping_time || "-"}</span>
                    </div>
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
                      {canCreate && activeTab === "notmy" && (
                        <button
                          onClick={() => {
                            setShowPopup(true);
                            setInventoryData({
                              productId: product.id,
                              id: product.id,
                              variant: item.variants,
                              isVarientExists: productDetails?.isVarientExists,
                            });
                            setIsEdit(false)


                          }}
                          className="py-2 px-4 text-white rounded-md md:text-sm  text-xs w-full bg-[#2B3674] hover:bg-[#1f285a] transition duration-300 ease-in-out"
                        >
                          Add To List
                        </button>
                      )}

                      {canUpdate && activeTab === "my" && (
                        <button
                          onClick={() => {
                            setShowPopup(true);
                            setInventoryData({
                              productId: product.id,
                              id: product.id,
                              variant: item.variants,
                              isVarientExists: productDetails?.isVarientExists,
                            });
                            setIsEdit(true);
                          }} className="py-2 px-4 mt-2 text-white rounded-md md:text-sm  text-xs  bg-black hover:bg-gray-800 transition duration-300 ease-in-out"
                        >
                          Edit List
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


  );
};

export default ProductDetails;