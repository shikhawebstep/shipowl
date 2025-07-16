'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSupplier } from '../middleware/SupplierMiddleWareContext';
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { HashLoader } from 'react-spinners';
import { FileText, Tag, Truck, Star } from "lucide-react"; // Icons
import { MdInventory } from "react-icons/md";

import { useImageURL } from "@/components/ImageURLContext";
export default function NewProducts() {
  const { fetchImages, getProductDescription } = useImageURL();
  const { verifySupplierAuth, hasPermission } = useSupplier();
  const [productsRequest, setProductsRequest] = useState([]);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const [type, setType] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [description, setDescription] = useState(null);
  const fetchDescription = (id) => {
    getProductDescription(id, setDescription);

  }

  const [inventoryData, setInventoryData] = useState({
    productId: "",
    variant: [],
    id: '',
    isVarientExists: '',
  });
  const viewProduct = (id) => {
    if (type == "notmy") {
      router.push(`/supplier/product/?id=${id}&type=${type}`);
    } else {

      router.push(`/supplier/product/?id=${id}`);
    }
  };
  const handleVariantChange = (id, field, value) => {
    setInventoryData((prevData) => ({
      ...prevData,
      variant: prevData.variant.map((v) =>
        v.id === id ? { ...v, [field]: field === 'qty' || field === 'shipowl_price' ? Number(value) : value } : v
      ),
    }));
  };
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
        setType(result?.type || '');
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
      localStorage.removeItem("shippingData");
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
          title: "Creation Failed",
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
  const canCreate = hasPermission("Product", "Add to List");

  return (
    <>
      <div>
        {productsRequest.length > 0 ? (
          <div className="grid xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-3 productsSection">
            {productsRequest.map((product, index) => {
              const imageUrl = typeof product?.gallery === 'string' && product.gallery.trim() !== ''
                ? product.gallery.split(',')
                : [];

              const productName = product?.name?.trim() || "Unnamed Product";

              // Parse imageSortingIndex safely
              let imageSortingIndex = {};
              try {
                imageSortingIndex = product?.imageSortingIndex
                  ? JSON.parse(product.imageSortingIndex)
                  : {};
              } catch (err) {
                console.error('Failed to parse imageSortingIndex:', err);
              }

              // Extract and sort imageSortingIndex.gallery safely
              const galleryIndexArray = Array.isArray(imageSortingIndex.gallery)
                ? imageSortingIndex.gallery.slice() // clone array to avoid mutating original
                : [];

              const productImageSortingIndex = galleryIndexArray.sort((a, b) => {
                const aValue = parseInt(a?.value ?? 0);
                const bValue = parseInt(b?.value ?? 0);
                return aValue - bValue;
              });

              const firstImageIndex = productImageSortingIndex[0]?.index ?? 0;


              const getPriceDisplay = (variants) => {
                if (!variants?.length) return <span>N/A</span>;

                const modalMap = {};
                variants.forEach((variant) => {
                  const model = variant.model || "Default";
                  if (!modalMap[model]) modalMap[model] = [];
                  modalMap[model].push(variant);
                });

                const modalKeys = Object.keys(modalMap);

                // Case 1: Only 1 model and 1 variant
                if (modalKeys.length === 1 && modalMap[modalKeys[0]].length === 1) {
                  const price = modalMap[modalKeys[0]][0]?.suggested_price ?? 0;
                  return <span className="block text-sm text-gray-800">{modalKeys[0]}: ₹{price}</span>;
                }

                // Case 2: 1 model, multiple variants
                if (modalKeys.length === 1) {
                  const prices = modalMap[modalKeys[0]].map(v => v?.suggested_price ?? 0);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return <span className="block text-sm text-gray-800">{modalKeys[0]}: ₹{min} - ₹{max}</span>;
                }

                // Case 3 or 4: multiple models
                return (
                  <>
                    {modalKeys.map((model, idx) => {
                      const prices = modalMap[model].map(v => v?.suggested_price ?? 0);
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      const priceLabel = (min === max) ? `₹${min}` : `₹${min} - ₹${max}`;

                      return (
                        <span key={model} className="block text-sm text-gray-800">
                          {model}: {priceLabel}
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
                    <div onClick={() => viewProduct(product.id)} className="relative h-[200px]  perspective">
                      <div className="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-180">
                        {/* FRONT */}
                        <Image
                          src={fetchImages(imageUrl[firstImageIndex])}
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

                    {/* PRICE & NAME */}
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-lg font-extrabold font-lato text-[#2C3454]">
                        {getPriceDisplay(product.variants)}
                      </p>
                    </div>
                    <p className="text-[13px] text-[#7A7A7A] font-lato font-semibold mt-1 hover:text-black transition-colors duration-300">
                      {productName}
                    </p>
                    <div className="flex mt-2 items-center gap-2">
                      <FileText size={16} />
                      <span className='text-sm'>
                        <button
                          onClick={() => fetchDescription(product.id)}
                          className="text-blue-600"
                        >
                          View Description
                        </button>

                      </span>
                    </div>

                    <div className="flex my-1 items-center gap-2">
                      <Tag size={14} />
                      <span className='text-sm'>SKU: {product?.main_sku || "-"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck size={14} />
                      <span className='text-sm'>Shipping Time: {product?.shipping_time || "-"}</span>
                    </div>
                    <div className="flex mt-2 items-center gap-1 text-sm text-gray-700">
                      <span>{product.variants?.rating || 4.3}</span>
                      <div className="flex gap-[1px] text-orange-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 fill-current ${i < Math.round(product.variants?.rating || 4.3)
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
                      {canCreate && (
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
                          className="py-2 px-4 text-white rounded-md md:text-sm  text-xs w-full bg-[#2B3674] hover:bg-[#1f285a] transition duration-300 ease-in-out"
                        >
                          Add To List
                        </button>
                      )}

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
        <div className="fixed px-6 inset-0 bg-[#00000087] bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg border-orange-500 w-full border max-w-5xl shadow-xl relative">
            <h2 className="text-2xl  flex justify-center gap-3 items-center text-center underline font-semibold mb-6 text-orange-500"><MdInventory /> Add To List</h2>

            {(() => {
              const varinatExists = inventoryData?.isVarientExists ? "yes" : "no";
              const isExists = varinatExists === "yes";

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-1">
                    {inventoryData.variant?.map((variant, idx) => {


                      return (
                        <div
                          key={variant.id || idx}
                          className="bg-white p-4 rounded-md  border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col space-y-3"
                        >
                          <div className='flex gap-2 relative'>
                            {/* Image Preview */}

                            <div className="w-full text-center bg-orange-500 p-2 text-white ">Suggested Price :{variant.suggested_price}</div>


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
      {description && (
        <div className="fixed p-4 inset-0 z-50 m-auto flex items-center justify-center bg-black/50">
          <div className="bg-white w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 relative shadow-lg popup-boxes">
            <button
              onClick={() => setDescription(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl"
            >
              &times;
            </button>
            {description ? (
              <div
                className="max-w-none prose [&_iframe]:h-[200px] [&_iframe]:max-h-[200px] [&_iframe]:w-full [&_iframe]:aspect-video"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-gray-500">NIL</p>
            )}
          </div>
        </div>
      )}

    </>
  );
}



