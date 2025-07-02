'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { IoIosArrowForward } from 'react-icons/io';
import { HashLoader } from 'react-spinners';
import productimg from '@/app/assets/product1.png';
import gift from '@/app/assets/gift.png';
import ship from '@/app/assets/delivery.png';
import { X, ClipboardCopy, HelpCircle, Upload, Store } from 'lucide-react';
import CategorySection from './CatogorySection'
import { FaCalculator } from "react-icons/fa";
import { RiResetRightLine } from "react-icons/ri";
import { RxCross1 } from "react-icons/rx";
import { ChevronRight, ChevronDown } from "lucide-react"; // Optional: Lucide icons

import { TbCube } from "react-icons/tb";
import { GoArrowUpRight } from "react-icons/go";
import { FiArrowDownLeft } from "react-icons/fi";
import { useImageURL } from "@/components/ImageURLContext";

const NewlyLaunched = () => {
    const [shipCost, setShipCost] = useState([]);

    const tabs = [
        { key: "notmy", label: "Not Pushed to Shopify" },
        { key: "my", label: "Pushed to Shopify" },
    ];


    const [showResult, setShowResult] = useState(false);
    const [openCalculator, setOpenCalculator] = useState(null);
    const [calculateData, setcalculateData] = useState('');
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [shopifyStores, setShopifyStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('notmy');
    const [type, setType] = useState(false);

    const fetchProduct = useCallback(async (type) => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/inventory?type=${type}`, {
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
                    title: "Something Wrong!",
                    text: result.error || result.message || "Your session has expired. Please log in again.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }
            setShipCost(result?.shippingCost || []);
            setProducts(result?.products || []);
            setShopifyStores(result?.shopifyStores || []);
            setType(result?.type || '');
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProduct(activeTab);
    }, [fetchProduct, activeTab]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    return (
        <>
            <CategorySection />
            <section className="xl:p-6 pt-6">
                <div className="container">
                    {/* Tabs shared for both sections */}
                    <div className="flex gap-4 bg-white rounded-md p-4 mb-8 font-lato text-sm ">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`md:px-6 py-2 font-medium px-2  md:text-xl border-b-2 transition-all duration-200
                ${activeTab === tab.key
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-500 hover:text-orange-600"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>


                    {/* Show No Data Found once if no products */}
                    {!loading && products.length === 0 ? (
                        <p className="text-center">No Data Found</p>
                    ) : (
                        <>
                            {/* Newly Launched Section */}
                            <Section
                                title="Newly Launched"
                                products={products}
                                activeTab={activeTab}
                                type={type}
                                setShipCost={setShipCost}
                                showResult={showResult}
                                setShowResult={setShowResult}
                                setOpenCalculator={setOpenCalculator}
                                openCalculator={openCalculator}
                                setcalculateData={setcalculateData}
                                calculateData={calculateData}
                                shipCost={shipCost}
                                shopifyStores={shopifyStores}
                                fetchProduct={fetchProduct}
                                setActiveTab={setActiveTab}
                            />

                            {/* Potential Heros Section */}
                            <Section
                                title="Potential Heros"
                                products={products}
                                activeTab={activeTab}
                                setShipCost={setShipCost}
                                type={type}
                                showResult={showResult}
                                setShowResult={setShowResult}
                                setOpenCalculator={setOpenCalculator}
                                openCalculator={openCalculator}
                                setcalculateData={setcalculateData}
                                calculateData={calculateData}
                                shipCost={shipCost}
                                shopifyStores={shopifyStores}
                                fetchProduct={fetchProduct}
                                setActiveTab={setActiveTab}

                            />
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

const Section = ({ title, showResult, type, setShowResult, products, shopifyStores, calculateData, openCalculator, setOpenCalculator, setcalculateData, shipCost, setShipCost, setActiveTab, fetchProduct, activeTab }) => {
    const { fetchImages } = useImageURL();
    const [activeModal, setActiveModal] = useState("");
    const [openSection, setOpenSection] = useState(null);
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
    const [loading, setLoading] = useState(false);
    const [showVariantPopup, setShowVariantPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const viewProduct = (id) => {
        if (type == "notmy") {
            router.push(`/dropshipping/product/?id=${id}&type=${type}`);
        } else {

            router.push(`/dropshipping/product/?id=${id}`);
        }
    };
    const router = useRouter();
    const [inventoryData, setInventoryData] = useState({
        supplierProductId: "",
        id: '',
        model: 'Selfship',
        variant: [],
        isVarientExists: '',
        shopifyApp: '',
    });
    const handleVariantChange = (id, field, value) => {
        // If field is global (e.g., shopifyApp), update it at root level
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
    const groupedByModal = inventoryData.variant.reduce((acc, curr) => {
        const model = curr.variant.model || "Unknown";
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
    const [activeVariantId, setActiveVariantId] = useState(() => {
        if (
            modalNames.length === 0 ||
            !groupedByModal ||
            !groupedByModal[modalNames[0]] ||
            groupedByModal[modalNames[0]].length === 0
        ) {
            return null;
        }

        const variants = groupedByModal[modalNames[0]];
        const minPriceItem = variants.reduce((min, curr) => {
            const currentVariant = getVariantData(curr);
            const minVariant = getVariantData(min);
            return currentVariant.suggested_price < minVariant.suggested_price ? curr : min;
        }, variants[0]);

        return getVariantData(minPriceItem).id;
    });

    useEffect(() => {
        if (
            totalModals === 1 &&
            groupedByModal?.[modalNames[0]]?.length > 1 &&
            !activeVariantId // only set it if not already set
        ) {
            const variants = groupedByModal[modalNames[0]].map(getVariantData);
            const minVariant = variants.reduce((min, curr) =>
                curr.suggested_price < min.suggested_price ? curr : min,
                variants[0]
            );
            setActiveVariantId(minVariant?.id || null);
        }
    }, [groupedByModal, modalNames, totalModals, activeVariantId]);

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
            let simplifiedVariants;
            if (
                totalModals === 2 &&
                modalNames.every((model) => groupedByModal[model].length === 1)
            ) {
                const selectedModal = inventoryData.model;

                const selectedVariantEntry = inventoryData.variant.find(
                    (v) => v.variant?.model === selectedModal
                );

                if (selectedVariantEntry) {
                    simplifiedVariants = [
                        {
                            variantId: selectedVariantEntry.id,
                            price: selectedVariantEntry.dropPrice,
                        },
                    ];
                } else {
                    simplifiedVariants = [];
                }
            } else if (
                totalModals > 1 &&
                modalNames.some((model) => groupedByModal[model]?.length > 1)
            ) {
                const selectedVariantEntry = inventoryData.variant.find(
                    (v) => v.id === activeVariantId
                );

                if (selectedVariantEntry) {
                    simplifiedVariants = [
                        {
                            variantId: selectedVariantEntry.id,
                            price: selectedVariantEntry.dropPrice,
                        },
                    ];
                } else {
                    simplifiedVariants = [];
                }
            } else if (
                totalModals === 1 &&
                groupedByModal[modalNames[0]]?.length > 1
            ) {
                const selectedVariantEntry = inventoryData.variant.find(
                    (v) => v.id === activeVariantId
                );

                if (selectedVariantEntry) {
                    simplifiedVariants = [
                        {
                            variantId: selectedVariantEntry.id,
                            price: selectedVariantEntry.dropPrice,
                        },
                    ];
                } else {
                    simplifiedVariants = [];
                }
            } else {
                simplifiedVariants = inventoryData.variant.map((v) => ({
                    variantId: v.id || v.variantId,
                    price: v.dropPrice,
                }));
            }



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
                        model: 'Selfship',
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

    return (
        <>

            <div className="flex justify-between items-center mb-4 mt-6">

                <h2 className="md:text-[24px] text-lg text-[#F98F5C] font-lato font-bold">{title}</h2>
                <Link href="/dropshipping/product-list" className="text-[16px] text-[#222222] hover:text-orange-500 flex items-center gap-2 font-lato">
                    View All <IoIosArrowForward className='text-[#F98F5C]' />
                </Link>
            </div>
            <div className="md:w-[293px] border-b-3 border-[#F98F5C] mt-1 mb-4"></div>


            <div className="products-grid pb-5 md:pb-0  grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-3 gap-4 xl:gap-6 lg:gap-4 mt-4">
                <div className="grid bg-[#212B36] rounded-xl shadow-xl overflow-hidden cursor-default">
                    <Image src={productimg} alt={`Best of ${title}`} className={`w-full  object-cover ${activeTab == "notmy" ? "md:max-h-[250px] h-[200px]" : "md:max-h-[230px] h-[200px]"}`} />
                    <div className="bg-[#212B36] bg-opacity-50 p-4 px-2 text-center text-white">
                        <p className="text-[16px] font-semibold font-lato">Best of {title}</p>
                        <p className="text-[15px] text-[#F98F5C] font-lato">{products.length} Products</p>
                    </div>
                </div>

                {products.map((product, index) => {

                    const productName = product?.product?.name || "NIL";
                    const variants = product?.variants || product?.variants?.supplierProductVariant || [];
                    const firstVariantImageString = variants[0]?.variant?.image || "";
                    const imageUrl = firstVariantImageString.split(",")[0]?.trim() || "/default-image.jpg";


                    return (
                        <div
                            key={index}
                            tabIndex={0} // Allows focus via tap on mobile
                            className="bg-white focus-within:z-10 rounded-xl group overflow-hidden cursor-pointer shadow-sm relative transition-transform duration-300 hover:shadow-lg hover:scale-[1.02] outline-none"
                        >
                            {/* FLIP CARD */}
                            <div onClick={() => viewProduct(product.id)} className={`relative md:h-[200px] h-[150px] perspective ${showVariantPopup === true ? 'z-20' : 'z-40'}`}>
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
                                <div className="mt-3 pt-2 border-t border-[#EDEDED] flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Image src={gift || "/icons/gift.svg"} className="w-5 h-5" alt="Gift" />
                                        <span className="font-lato text-[#2C3454] font-bold">100-10k</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Image src={ship || "/icons/ship.svg"} className="w-5 h-5" alt="Shipping" />
                                        <span className="font-lato text-[#2C3454] font-bold">4.5</span>
                                    </div>
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
                                {activeTab === "notmy" && (
                                    <button
                                        onClick={() => {
                                            setShowPopup(true);
                                            setInventoryData({
                                                supplierProductId: product.id,
                                                id: product.id,
                                                variant: product.variants,
                                                isVarientExists: product?.product?.isVarientExists,
                                                shopifyApp: "",
                                                model: 'Selfship',
                                            });
                                        }}
                                        className="w-full py-2 px-4 md:text-sm  text-xs text-white rounded-md  bg-[#2B3674] hover:bg-[#1f285a] transition-colors duration-200"
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

                                {activeTab === "my" && (
                                    <button
                                        onClick={() => handleEdit(product.id)}
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


            {showPopup && (
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
                                <div className='flex justify-between'>
                                    <div className="flex items-center gap-2"><Store /> <label className="block text-sm font-semibold mb-1">Store</label></div>

                                    <select
                                        className=" border border-[#E0E2E7] p-2 rounded-md"
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

                                {(() => {



                                    // CASE 1: 1 model, 1 variant
                                    // Assuming this is inside a React component render
                                    if (totalModals === 1 && groupedByModal[modalNames[0]].length === 1) {
                                        const variant = getVariantData(groupedByModal[modalNames[0]][0]);
                                        return (
                                            <div className="p-4  gap-4 rounded-lg border border-gray-300 bg-white text-left">
                                                <div className="text-gray-800 font-medium mb-2">Price: ₹{variant.suggested_price}</div>

                                                <div key={variant.id} className="space-y-5 border p-4 rounded-lg shadow-sm">
                                                    {/* Product Info */}
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
                                                                Model:{" "}
                                                                <span className="font-semibold text-[#4C4C4C]">
                                                                    {variant.model || 'C2445129'}
                                                                </span>
                                                                <ClipboardCopy
                                                                    className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer"
                                                                    onClick={() => navigator.clipboard.writeText(variant.model || '')}
                                                                />
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Pricing Section */}
                                                    <div className="border-t pt-4 space-y-3">
                                                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            Pricing
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-semibold text-gray-600 md:w-7/12 flex items-center gap-1">
                                                                Set Your Selling Price (₹)
                                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={variant.full?.dropPrice || ''}
                                                                onChange={(e) =>
                                                                    handleVariantChange(variant.id, 'dropPrice', e.target.value)
                                                                }
                                                                className="md:w-5/12 border border-[#E0E2E7] rounded-md p-2"
                                                            />
                                                        </div>

                                                        <div
                                                            onClick={() => {
                                                                setcalculateData(variant.full);
                                                                setOpenCalculator(true);
                                                            }}
                                                            className="flex items-center bg-purple-100 p-2 rounded-md mt-3 cursor-pointer"
                                                        >
                                                            <FaCalculator className="text-purple-700 mr-2 text-2xl" />
                                                            <span className="text-black underline font-semibold text-sm">
                                                                Calculate <br /> Expected Profit
                                                            </span>
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
                                                            Your Margin{" "}
                                                            <span className="float-right">
                                                                {variant.full?.dropPrice != null && variant.suggested_price != null && (
                                                                    <>₹{(variant.full.dropPrice || 0) - (variant.suggested_price || 0)}</>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* RTO/RVP Note */}
                                                    <div className="text-xs text-gray-600 border-t pt-3">
                                                        RTO & RVP charges are applicable and vary depending on the product weight.{" "}
                                                        <span className="font-semibold underline cursor-pointer">
                                                            View charges for this product
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }


                                    // CASE 2: 1 model, multiple variants

                                    if (totalModals === 1 && groupedByModal[modalNames[0]].length > 1) {
                                        const variants = groupedByModal[modalNames[0]].map(getVariantData);

                                        return (
                                            <div className="space-y-6">
                                                {/* Variant Toggle Buttons */}
                                                <div className="flex flex-wrap gap-2">
                                                    {variants.map((variant) => (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            onClick={() => setActiveVariantId(variant.id)}
                                                            className={`px-4 py-1  text-sm font-medium border transition ${activeVariantId === variant.id
                                                                ? "  border-blue-600"
                                                                : " text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {variant.name || 'Variant'}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Selected Variant Display */}
                                                {variants
                                                    .filter((v) => v.id === activeVariantId)
                                                    .map((variant, idx) => (
                                                        <div key={variant.id || idx} className="space-y-5 border p-4 rounded-lg shadow-sm">
                                                            {/* Product Info */}
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
                                                                        <span className="font-semibold text-[#4C4C4C]">{variant.model}</span>
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
                                                                        onChange={(e) =>
                                                                            handleVariantChange(variant.id, 'dropPrice', e.target.value)
                                                                        }
                                                                        className="md:w-5/12 border border-[#E0E2E7] rounded-md p-2"
                                                                    />
                                                                </div>

                                                                <div
                                                                    onClick={() => {
                                                                        setcalculateData(variant.full);
                                                                        setOpenCalculator(true);
                                                                    }}
                                                                    className="flex items-center bg-purple-100 p-2 rounded-md mt-3 cursor-pointer"
                                                                >
                                                                    <FaCalculator className="text-purple-700 mr-2 text-2xl" />
                                                                    <span className="text-black underline font-semibold text-sm">
                                                                        Calculate <br /> Expected Profit
                                                                    </span>
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

                                                            {/* RTO/RVP Note */}
                                                            <div className="text-xs text-gray-600 border-t pt-3">
                                                                RTO & RVP charges are applicable and vary depending on the product weight.{' '}
                                                                <span className="font-semibold underline cursor-pointer">
                                                                    View charges for this product
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        );
                                    }

                                    // CASE 3: 2 modals with 1 variant each (radio button)
                                    if (totalModals === 2 && modalNames.every(model => groupedByModal[model].length === 1)) {
                                        return (
                                            <div className="space-y-4">
                                                {modalNames.map((model, index) => {
                                                    const variant = getVariantData(groupedByModal[model][0]);
                                                    const isSelected = inventoryData.model === model;

                                                    return (
                                                        <label key={variant.id || index} className="flex flex-col gap-3 cursor-pointer border rounded-lg p-4">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="model"
                                                                    value={model}
                                                                    required
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        handleVariantChange(null, 'model', e.target.value);
                                                                    }}
                                                                />
                                                                <span className="text-gray-800 font-medium">{model}</span>
                                                                {isSelected && (
                                                                    <span className="ml-2 text-green-600 font-semibold">
                                                                        ₹{variant.suggested_price}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {isSelected && (
                                                                <div className="space-y-5">
                                                                    {/* Product Info */}
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
                                                                                <span className="font-semibold text-[#4C4C4C]">
                                                                                    {variant.model || 'C2445129'}
                                                                                </span>
                                                                                <ClipboardCopy
                                                                                    className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer"
                                                                                    onClick={() => navigator.clipboard.writeText(variant.model || '')}
                                                                                />
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Pricing Section */}
                                                                    <div className="border-t pt-4 space-y-3">
                                                                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                                            Pricing
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <div className="text-sm font-semibold text-gray-600 md:w-7/12 flex items-center gap-1">
                                                                                Set Your Selling Price (₹)
                                                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                                                                            </div>



                                                                            <input
                                                                                type="number"
                                                                                value={variant.full?.dropPrice || ''}
                                                                                onChange={(e) =>
                                                                                    handleVariantChange(variant.id, 'dropPrice', e.target.value)
                                                                                }
                                                                                className="md:w-5/12 border border-[#E0E2E7] rounded-md p-2"
                                                                            />
                                                                        </div>

                                                                        <div
                                                                            onClick={() => {
                                                                                setcalculateData(variant.full);
                                                                                setOpenCalculator(true);
                                                                            }}
                                                                            className="flex items-center bg-purple-100 p-2 rounded-md mt-3 cursor-pointer"
                                                                        >
                                                                            <FaCalculator className="text-purple-700 mr-2 text-2xl" />
                                                                            <span className="text-black underline font-semibold text-sm">
                                                                                Calculate <br /> Expected Profit
                                                                            </span>
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

                                                                    {/* RTO/RVP Note */}
                                                                    <div className="text-xs text-gray-600 border-t pt-3">
                                                                        RTO & RVP charges are applicable and vary depending on the product weight.{' '}
                                                                        <span className="font-semibold underline cursor-pointer">
                                                                            View charges for this product
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }



                                    // CASE 4: Multiple modals with multiple variants → TABS
                                    if (totalModals > 1 && modalNames.some(model => groupedByModal[model]?.length > 1)) {
                                        const variantsInActiveModal = groupedByModal[activeModal]?.map(getVariantData) || [];

                                        return (
                                            <>
                                                {/* Model Tabs */}
                                                <div className="flex gap-3 mb-4 border-b pb-2">
                                                    {modalNames.map((model, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 ${activeModal === model
                                                                ? "border-orange-600 text-orange-600"
                                                                : "border-transparent text-gray-600 hover:text-orange-500"
                                                                }`}
                                                            onClick={() => {
                                                                setActiveModal(model);

                                                                const modalVariants = groupedByModal[model]?.map(getVariantData) || [];
                                                                const minVariant = modalVariants.reduce((min, curr) =>
                                                                    curr.suggested_price < min.suggested_price ? curr : min,
                                                                    modalVariants[0]);

                                                                setActiveVariantId(minVariant?.id || null);
                                                            }}
                                                        >
                                                            {model}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Variant Name Buttons */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {variantsInActiveModal.map((variant) => (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            onClick={() => setActiveVariantId(variant.id)}
                                                            className={`px-4 py-1  text-sm font-medium border transition ${activeVariantId === variant.id
                                                                ? "  border-blue-600"
                                                                : " text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {variant.name || 'Variant'}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Selected Variant Details */}
                                                <div className="grid grid-cols-1 gap-4">
                                                    {variantsInActiveModal
                                                        .filter((variant) => variant.id === activeVariantId)
                                                        .map((variant, index) => (
                                                            <div key={variant.id || index} className="space-y-5 border p-4 rounded-lg shadow-sm">
                                                                {/* Product Info */}
                                                                <div className="flex bg-gray-100 rounded-md p-3 items-start gap-3">
                                                                    <Image
                                                                        src={fetchImages(variant.image)}
                                                                        alt={variant.name || 'Product Image'}
                                                                        width={64}
                                                                        height={64}
                                                                        className="rounded border object-cover"
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium leading-5 line-clamp-2">
                                                                            {variant.name || 'Stainless Steel Cable Lock Ties'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                                            Model: <span className="font-semibold text-[#4C4C4C]">{variant.model || 'N/A'}</span>
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
                                                                            onChange={(e) =>
                                                                                handleVariantChange(variant.id, 'dropPrice', e.target.value)
                                                                            }
                                                                            className="md:w-5/12 border border-[#E0E2E7] rounded-md p-2"
                                                                        />
                                                                    </div>

                                                                    <div
                                                                        onClick={() => {
                                                                            setcalculateData(variant);
                                                                            setOpenCalculator(true);
                                                                        }}
                                                                        className="flex items-center bg-purple-100 p-2 rounded-md mt-3 cursor-pointer"
                                                                    >
                                                                        <FaCalculator className="text-purple-700 mr-2 text-2xl" />
                                                                        <span className="text-black underline font-semibold text-sm">
                                                                            Calculate <br /> Expected Profit
                                                                        </span>
                                                                    </div>

                                                                    <p className="text-sm font-semibold">
                                                                        Shipowl Price <span className="float-right">₹{variant.suggested_price || 0}</span>
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 -mt-2 flex items-center gap-1">
                                                                        Including GST & Shipping Charges
                                                                        <HelpCircle className="w-3.5 h-3.5" />
                                                                    </p>

                                                                    <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm font-semibold">
                                                                        Your Margin{' '}
                                                                        <span className="float-right">
                                                                            {variant.full?.dropPrice != null && variant.suggested_price != null && (
                                                                                <>₹{(variant.full.dropPrice || 0) - (variant.suggested_price || 0)}</>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* RTO/RVP Note */}
                                                                <div className="text-xs text-gray-600 border-t pt-3">
                                                                    RTO & RVP charges are applicable and vary depending on the product weight.{' '}
                                                                    <span className="font-semibold underline cursor-pointer">
                                                                        View charges for this product
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </>
                                        );
                                    }


                                    // Default fallback if no variants found
                                    return <p className="text-gray-500">No variants available</p>;

                                })()}


                            </div>

                            {/* Footer */}
                            <div className=" bottom-0 left-0 right-0 p-4 border-t bg-white flex items-center justify-between">
                                <button
                                    onClick={handleSubmit}
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-900"
                                >
                                    <Upload className="w-4 h-4" />
                                    Push To Shopify
                                </button>


                            </div>
                        </form>
                    </div >
                </div >
            )}

            {calculateData && openCalculator && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b pb-3">
                            <div className='flex gap-3 items-center'>
                                <div className='bg-gray-200 text-center p-3 flex justify-center items-center '>
                                    <FaCalculator className="text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Pricing Calculator</h2>
                                    <p className='text-xs'>Please enter all the required fields (<span className='text-red-500'>*</span>) to calculate your expected profit</p>
                                </div>
                            </div>
                            <div className='flex gap-4 justify-end'>
                                <button className="text-sm underline font-bold items-center gap-2 flex text-black" onClick={() => setForm({
                                    dropPrice: '',
                                    totalOrderQty: '',
                                    confirmOrderPercentage: '90',
                                    deliveryPercentage: '50',
                                    adSpends: '',
                                    miscCharges: '',
                                })}>
                                    <RiResetRightLine /> Reset
                                </button>
                                <button onClick={() => setOpenCalculator(false)} className="text-sm text-black font-bold" >
                                    <RxCross1 />
                                </button>
                            </div>
                        </div>

                        {/* Info Bar */}
                        <div className="flex gap-6 mt-4 mb-6">
                            {calculateData?.image ? (
                                <Image
                                    src={fetchImages(calculateData.image.split(",")[0] || null)}
                                    alt={calculateData?.name || "Product Image"}
                                    width={100}
                                    height={100}
                                />
                            ) : null}

                            <ProductInfo label="Shipowl Price" value={calculateData?.price} />
                            <ProductInfo label="RTO Charges" value={shipCost} />
                            <ProductInfo label="Product Weight" value={`${calculateData?.weight} GM `} />
                        </div>

                        {/* Main Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Form Side */}
                            <div className="space-y-4 bg-[#f5f5f5] rounded-md p-4">
                                <InputField
                                    label="Selling Price"
                                    value={form.dropPrice}
                                    onChange={(val) => handleChange('dropPrice', val)}
                                    error={errors.dropPrice}
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
                                    <ResultItem label="Net Profit" value={`₹${finalMargin.toFixed(2)}`} isVisible={showResult} />
                                    <p className='text-xs'>Total Earnings - Total Spends</p>
                                    <hr className='my-4' />
                                    <ResultItem label="Net Profit (Per Order)" value={`₹${profitPerOrder.toFixed(2)}`} isVisible={showResult} />
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
                                                <div className="bg-purple-100 p-2 ">
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
                                                <div className="bg-green-100 p-2 ">
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

                                                        Margin Per Order: <span>{dropPrice > 0 ? dropPrice - productPrice : '-'}</span>
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
                                                <div className="bg-red-100 p-2 ">
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
                                                        Total Ad Spends: <span>{totalAddSpend}</span>
                                                    </li>
                                                    <li>
                                                        (+)Total RTO Charges:{" "}
                                                        <span>{deliveryCostPerUnit * deliveredRTOQty}</span>
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
            )
            }

            {showVariantPopup && selectedProduct && (
                <div className="fixed  px-6 md:px-0  inset-0 bg-[#000000b0] bg-opacity-40 flex z-50 items-center justify-center ">
                    <div className="bg-white border border-orange-500 p-6 rounded-lg w-full z-50 max-w-4xl shadow-xl relative">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Variant Details</h2>
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
                                
                                const imageUrls = variant.image

                                const isExists = selectedProduct?.product?.isVarientExists;

                                return (
                                    <div
                                        key={variant.id || idx}
                                        className="bg-white hover:border-orange-500 p-4 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 transition-all duration-300 flex flex-col"
                                    >
                                        {/* Image */}
                                        <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                                            {imageUrls?.length > 0 ? (
                                                <img
                                                    src={fetchImages(imageUrls.split(','))}
                                                    alt={`variant-img-${idx}`}
                                                    className="h-full w-full object-cover p-3 rounded-md"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xl font-bold">{idx + 1}</span>
                                            )}

                                        </div>

                                        {/* Text Info */}
                                        <div className="text-sm text-gray-700 space-y-1">
                                            <p><span className="font-semibold">Model:</span> {variant.model || "—"}</p>
                                            <p><span className="font-semibold">Suggested Price:</span> {v.price || v?.supplierProductVariant?.price || "—"}</p>

                                            {isExists && (
                                                <>
                                                    <p><span className="font-semibold">Name:</span> {variant.name || "—"}</p>
                                                    <p><span className="font-semibold">SKU:</span> {variant.sku || "—"}</p>
                                                    <p><span className="font-semibold">Color:</span> {variant.color || "—"}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            )}

        </>
    );
};

export default NewlyLaunched;

function InputField({ label, value, onChange, error, required }) {
    return (
        <>
            <div className='flex justify-between'>
                <label className="md:w-7/12 block text-sm font-medium mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </label>

                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`md:w-5/12 bg-white border px-3 py-[6px] ${error ? 'border-red-500' : 'border-gray-300'}`}
                />
            </div>
        </>
    );
}

// Result output component with conditional display
function ResultItem({ label, value, isVisible, placeholder = '-' }) {
    const numeric = parseFloat(value?.replace?.(/[₹,]/g, '')) || 0;
    return (
        <div className="flex justify-between text-sm w-full">
            <span className="font-medium text-black">{label}</span>
            <span className={` font-bold  text-green-800 ${!isVisible ? 'text-gray-400' : numeric < 0 ? 'text-red-800' : 'text-green-800'}`}>
                {isVisible ? value : placeholder}
            </span>
        </div>
    );
}

// Info box component
function ProductInfo({ label, value }) {
    return (
        <div className="flex items-center space-x-1 text-sm">
            <span className="text-gray-500">{label}:</span>
            <span className="font-medium text-black">{value}</span>
        </div>
    );
}





///
