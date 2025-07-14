'use client';

import Image from 'next/image';
import productimg from '@/app/assets/product1.png';
import { useRouter } from 'next/navigation';
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import { useEffect, useState, useCallback } from 'react';
import { HashLoader } from 'react-spinners';
import Swal from 'sweetalert2';
import gift from '@/app/assets/gift.png';
import ship from '@/app/assets/delivery.png';
import { X, Send } from "lucide-react"; // Lucide icons
export default function Allroducts() {
    const { verifyDropShipperAuth } = useDropshipper();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(null);
    const router = useRouter();
    const [showVariantPopup, setShowVariantPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    


    const fetchProducts = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/inventory?type='my'`, {
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
                    text: result.error || result.message || "Network Error.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }

            setProducts(result?.products || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await verifyDropShipperAuth();
            await fetchProducts();
            setLoading(false);
        };
        fetchData();
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    return (

        <>
            <div className="">
                <div className="flex flex-wrap md:justify-end gap-3 justify-center mb-6">
                    <button className="bg-[#05CD99] text-white lg:px-8 p-4 py-2 rounded-md">Export</button>
                    <button className="bg-[#3965FF] text-white lg:px-8 p-4 py-2 rounded-md">Import</button>
                </div>

                {products.length === 0 ? (
                    <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
                        No products found
                    </div>
                ) : (
                    <div className="products-grid  grid xl:grid-cols-5 lg:grid-cols-3 gap-4 xl:gap-6 lg:gap-4 mt-4">

                        {products.map((product, index) => {

                            const productName = product?.product?.name || "NIL";

                            return (

                                <div
                                    key={index}
                                    className="bg-white rounded-xl group  overflow-hidden  cursor-pointer shadow-sm relative transition-transform duration-300 hover:shadow-lg hover:scale-[1.02]"
                                >
                                    <div className="relative h-[200px] perspective">
                                        <div className="relative  overflow-hidden  w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                                            {/* FRONT */}
                                            <Image
                                                src={productimg}
                                                alt={productName}
                                                height={200}
                                                width={100}
                                                className="w-full h-full object-cover backface-hidden"
                                            />
                                            {/* BACK (optional or just black layer) */}
                                            <div className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center rotate-y-180 backface-hidden">
                                                <span className="text-sm">Back View</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
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
                                                                v?.price ?? v?.supplierProductVariant?.price ?? Infinity
                                                        )
                                                    )}
                                            </p>
                                        </div>
                                        <p className="text-[12px] text-[#ADADAD] font-lato font-semibold">
                                            {productName}
                                        </p>

                                        {/* Info Footer */}
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

                                    {/* Slide-in Button Group */}
                                    <div
                                        className="absolute  bottom-0 shadow border border-gray-100 left-0 w-full p-3 bg-white z-10 opacity-0 translate-y-4
                                         group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300
                                         pointer-events-none group-hover:pointer-events-auto"
                                    >

                                        <button

                                           
                                            className="w-full py-2 px-4 text-white rounded-md text-sm  bg-[#2B3674] hover:bg-[#1f285a] transition-colors duration-200"
                                        >
                                            Edit From Shopify
                                        </button>
                                        <button

                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setShowVariantPopup(true);
                                            }}
                                            className="w-full mt-2 py-2 px-4 text-white rounded-md text-sm bg-[#3965FF] hover:bg-[#2b50d6] transition-colors duration-200"
                                        >
                                            View Variants
                                        </button>


                                    </div>
                                </div>

                            );
                        })}
                    </div>
                )}
            </div>
          


            {showVariantPopup && selectedProduct && (
                <div className="fixed inset-0 bg-[#000000b0] bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white border border-orange-500 p-6 rounded-lg w-full max-w-4xl shadow-xl relative">
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
                                variant = { ...(v.variant || {}), ...v };



                                const imageUrls = variant.image
                                    ? variant.image.split(",").map((img) => img.trim()).filter(Boolean)
                                    : [];

                                const isExists = selectedProduct?.product?.isVarientExists;

                                return (
                                    <div
                                        key={variant.id || idx}
                                        className="bg-white hover:border-orange-500 p-4 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 transition-all duration-300 flex flex-col"
                                    >
                                        {/* Image */}
                                        <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                                            {imageUrls.length > 0 ? (
                                                <img
                                                    src={`https://placehold.co/600x400?text=${idx + 1}`}
                                                    alt={`variant-img-${idx}`}
                                                    className="h-full w-full object-cover p-3 rounded-md"
                                                />
                                            ) : (
                                                <span className="text-gray-400  text-xl font-bold">{idx + 1}</span>
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

}
