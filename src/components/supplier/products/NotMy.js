'use client';

import Image from 'next/image';
import productImage from '@/app/images/product-img.png';
import { useRouter } from 'next/navigation';
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { HashLoader } from 'react-spinners';
import { X, FileText, Tag, Truck } from "lucide-react"; // Icons
import { useImageURL } from "@/components/ImageURLContext";

export default function NotMy() {
    const { fetchImages, getProductDescription } = useImageURL();
  const { verifySupplierAuth } = useSupplier();
  const [productsRequest, setProductsRequest] = useState([]);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    productId: "",
    variant: [],
    id: '',
    isVarientExists: '',
  });
  const handleVariantChange = (id, field, value) => {
    setInventoryData((prevData) => ({
      ...prevData,
      variant: prevData.variant.map((v) =>
        v.id === id ? { ...v, [field]: field === 'qty' || field === 'shipowl_price' ? Number(value) : value } : v
      ),
    }));
  };
    const [description, setDescription] = useState("");
      const fetchDescription = (id) => {
          getProductDescription(id, setDescription);
  
      }
  const fetchProducts = useCallback(async () => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product/inventory?type=notmy`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Went Wrong!",
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Network Error.",
        });
        throw new Error(errorMessage.message || errorMessage.error || "Something Went Wrong!");
      }

      const result = await response.json();
      if (result) {
        setProductsRequest(result?.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      await verifySupplierAuth();
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
      const simplifiedVariants = inventoryData.variant.map((v) => ({
        variantId: v.id || v.variantId,
        stock: v.stock,
        price: v.price,
        status: v.status
      }));

      form.append('productId', inventoryData.productId);
      form.append('variants', JSON.stringify(simplifiedVariants));



      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product/my-inventory`;

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
          title: isEdit ? "Updation Failed" : "Creation Failed",
          text: result.message || result.error || "An error occurred",
        });
        Swal.close();
        return;
      }

      // On success
      Swal.fire({
        icon: "success",
        title: "Product Created",
        text: "The Product has been created successfully!",
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setInventoryData({
            productId: "",
            variant: [],
            id: '',
          });
          setShowPopup(false);
          fetchProducts();
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

  return (
    <>
      <div>
        {productsRequest.length > 0 ? (
          <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 xl:grid-cols-5 gap-6">
            {productsRequest.map((product) => {
              const firstVariant = product.variants?.[0];
              const imageUrl = productImage || "/placeholder.png"; // Fallback
              const productName = product.name || "Unnamed Product";

              const price =
                product.variants.length === 1
                  ? firstVariant?.suggested_price || 0
                  : Math.min(...product.variants.map(v => v?.suggested_price ?? Infinity));

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#B9B9B9] shadow-sm hover:shadow-lg transition-all duration-300 relative"
                >
                  {/* Flip Image Section */}
                  <div className="relative h-[200px] perspective">
                    <div className="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                      {/* FRONT */}
                      <Image
                        src={imageUrl}
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
                  <div className="p-3 relative">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold nunito">{productName}</h2>
                      <p className="text-black font-bold nunito">₹{price}</p>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                         <span>
                          <button
                            onClick={() => fetchDescription(product.id)}
                            className="text-blue-600"
                          >
                            View Description
                          </button>
                          {description === product.id && (
                            <div className="fixed p-4 inset-0 z-50 m-auto  flex items-center justify-center bg-black/50">
                              <div className="bg-white w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 relative shadow-lg popup-boxes">
                                {/* Close Button */}
                                <button
                                  onClick={() => setDescription(null)}
                                  className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl"
                                >
                                  &times;
                                </button>

                                {/* HTML Description Content */}
                                {product.description ? (
                                  <div
                                    className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                  />
                                ) : (
                                  <p className="text-gray-500">NIL</p>
                                )}
                              </div>
                            </div>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span>SKU: {product?.main_sku || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck size={16} />
                        <span>
                          Shipping Time: {product?.shipping_time || "-"}
                        </span>
                      </div>
                    </div>

                    <button
                   
                      className="mt-3 w-full bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition"
                    >
                      Add to List
                    </button>

                    {/* Hover Action Buttons */}
                    <div
                      className="absolute bottom-0 left-0 w-full p-3 bg-white z-10 opacity-0 translate-y-4
                      group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300
                      pointer-events-none group-hover:pointer-events-auto shadow border border-gray-100"
                    >
                      <div className="flex items-center gap-2">

                        <button
                          onClick={() => {
                            setShowPopup(true);
                            setInventoryData({
                              productId: product.id,
                              variant: product.variants,
                              id: product.id,
                              isVarientExists: product.isVarientExists,
                            });
                          }}
                          className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          <p className="text-center">No Products Found</p>
        )}
      </div>
      {showPopup && (
        <div className="fixed inset-0 bg-[#00000087] bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg border-orange-500 w-full border max-w-5xl shadow-xl relative">
            <h2 className="text-xl font-semibold mb-6">Add to Inventory</h2>

            {(() => {
              const varinatExists = inventoryData?.isVarientExists ? "yes" : "no";
              const isExists = varinatExists === "yes";

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-1">
                    {inventoryData.variant?.map((variant, idx) => {
                      const imageUrls = variant.image
                        ? variant.image.split(",").map((img) => img.trim()).filter(Boolean)
                        : [];

                      return (
                        <div
                          key={variant.id || idx}
                          className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                        >
                          <div className='flex gap-2'>
                            {/* Image Preview */}
                            <div className="md:min-w-4/12 h-20 rounded-lg flex items-center justify-center overflow-hidden">
                              {imageUrls.length > 0 ? (
                                <img
                                  src={`https://placehold.co/600x400?text=${idx + 1}`}
                                  alt={variant.name || "Variant Image"}
                                  className="h-full object-cover"
                                />
                              ) : (
                                <img
                                  src="https://placehold.co/600x400"
                                  alt="Placeholder"
                                  className="h-full object-cover"
                                />
                              )}
                            </div>

                            <div className="text-sm md:w-8/12 text-gray-700 space-y-1">
                              <p><span className="font-semibold">Model:</span> {variant.model || "NIL"}</p>
                              {isExists && (
                                <>
                                  <p><span className="font-semibold">Name:</span> {variant.name || "NIL"}</p>
                                  <p><span className="font-semibold">SKU:</span> {variant.sku || "NIL"}</p>
                                  <p><span className="font-semibold">Color:</span> {variant.color || "NIL"}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Input Fields */}
                          <div className="flex flex-col space-y-2">
                            <input
                              type="number"
                              placeholder="Stock"
                              name="stock"
                              className="border border-gray-300 shadow rounded px-3 py-2 text-sm"
                              value={variant.stock || ""}
                              onChange={(e) =>
                                handleVariantChange(variant.id, "stock", e.target.value)
                              }
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              name="price"
                              className="border border-gray-300 shadow rounded px-3 py-2 text-sm"
                              value={variant.price || ""}
                              onChange={(e) =>
                                handleVariantChange(variant.id, "price", e.target.value)
                              }
                            />
                          </div>

                          {/* Status Switch */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Status:</span>
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
    </>
  );
}
