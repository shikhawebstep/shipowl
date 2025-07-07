'use client';

import Image from 'next/image';
import productimg from '@/app/assets/product1.png';
import { useRouter } from 'next/navigation';
import { useDropshipper } from '../middleware/DropshipperMiddleWareContext';
import { useEffect, useState, useCallback } from 'react';
import { HashLoader } from 'react-spinners';
import Swal from 'sweetalert2';
import coupen from '@/app/assets/coupen.png';
import gift from '@/app/assets/gift.png';
import ship from '@/app/assets/delivery.png';
import { IoIosArrowForward } from 'react-icons/io';

const ProductList = () => {
  const { verifyDropShipperAuth } = useDropshipper();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    supplierProductId: "",
    variant: []
  });
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const handleVariantChange = (id, field, value) => {
    setInventoryData((prevData) => ({
      ...prevData,
      variant: prevData.variant.map((v) =>
        v.id === id ? { ...v, [field]: field === 'qty' || field === 'shipowl_price' ? Number(value) : value } : v
      ),
    }));
  };

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/product/inventory?type=all`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${dropshippertoken}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Your session has expired. Please log in again.",
        });
        throw new Error(
          errorMessage.message || errorMessage.error || "Something Wrong!"
        );
      }

      const result = await response.json();
      if (result) {
        setProducts(result?.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [router, setProducts]);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await verifyDropShipperAuth();
      await fetchProducts();
      setLoading(false);
    };
    fetchData();
  }, []);
  const handleSubmit = async (e, id) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.clear("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/dropshipping/auth/login");
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

      Swal.fire({
        icon: "success",
        title: "Product Created",
        text: result.message || "The Product has been created successfully!",
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setInventoryData({
            supplierProductId: "",
            stock: "",
            price: "",
            status: "",
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }



  return (
    <section className="lg:p-6">
      <div className="container">
        <div className='xl:flex gap-3'>
          <div className="md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:w-[87%] justify-center gap-4">
            <div className="">
              <label className="block text-sm font-medium text-[#777980] mb-1 public-sans">Search Product</label>
              <input
                type="text"
                placeholder="Search"
                className="w-full p-[11px] border  border-[#E0E2E7] text-[#858D9D] rounded-md bg-white focus:outline-none public-sans "
              />
            </div>
            <div className="">
              <label className="block text-sm font-medium text-[#777980] mb-1 public-sans">Product Category</label>
              <select className="w-full p-3 border border-[#E0E2E7] text-[#858D9D] rounded-md bg-white focus:outline-none public-sans ">
                <option>Select...</option>
              </select>
            </div>
            <div className="">
              <label className="block text-sm font-medium text-[#777980] mb-1 public-sans">Select Price Range</label>
              <select className="w-full p-3 border border-[#E0E2E7] text-[#858D9D] rounded-md bg-white focus:outline-none public-sans ">
                <option>Select...</option>
              </select>
            </div>
            <div className="">
              <label className="block text-sm font-medium text-[#777980] mb-1 public-sans">Sold Units</label>
              <select className="w-full p-3 border border-[#E0E2E7] text-[#858D9D] rounded-md bg-white focus:outline-none public-sans ">
                <option>Select...</option>
              </select>
            </div>
            <div className="">
              <label className="block text-sm font-medium text-[#777980] mb-1 public-sans">Delivery Rate</label>
              <select className="w-full p-3 border border-[#E0E2E7] text-[#858D9D] rounded-md bg-white focus:outline-none public-sans ">
                <option>Select...</option>
              </select>
            </div>
          </div>


          <div className="xl:w-[13%]  mt-3 lg:mt-0  flex items-end justify-end">
            <button className="w-full bg-[#1D1F2C]  text-white p-3  px-2 rounded-md hover:bg-gray-800 public-sans lg:w-auto">Search Product</button>
          </div>
        </div>

        <div className="flex justify-between items-center my-4">
          <h2 className="md:text-3xl text-lg font-lato font-semibold text-[#F98F5C]">Newly Launched <span className='text-sm text-gray-500'>(100 Products)</span></h2>
        </div>
        <div className="md:w-[350px] border-b-3 border-[#F98F5C] mb-4"></div>
        {products.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
            No products found
          </div>
        ) : (
          <div className="products-grid  grid xl:grid-cols-5 lg:grid-cols-3 gap-4 xl:gap-6 lg:gap-4 mt-4">
            {products.map((product, index) => {
              const variant = product?.product?.variants?.[0];
              const imageUrl = variant?.image?.split(",")?.[0]?.trim() || "/default-image.png";
              const productName = product?.product?.name || "NIL";
              const price = variant?.shipowl_price ?? "-";

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl cursor-pointer shadow-sm relative"
                >
                  <Image
                    src={productimg || imageUrl}
                    alt={productName}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />


                  <div className="p-3 mb:pb-0">
                    <div className="flex justify-between">
                      <p className="text-lg font-extrabold font-lato">₹{price}</p>
                      <div className="coupen-box flex gap-2 items-center">
                        <Image src={coupen} className="w-5" alt="Coupon" />
                        <span className="text-[#249B3E] font-lato font-bold text-[12px]">WELCOME10</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#ADADAD] font-lato font-semibold">{productName}</p>

                    <div className="flex items-center border-t pt-2 mt-5 border-[#EDEDED] justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Image src={gift} className="w-5" alt="Gift" />
                        <span className="font-lato text-[#2C3454] font-bold">100-10k</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Image src={ship} className="w-5" alt="Shipping" />
                        <span className="font-lato text-[#2C3454] font-bold">4.5</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowPopup(true);
                        setInventoryData({
                          supplierProductId: product.id,
                          variant: product.variants
                        });
                      }}
                      className="py-2 px-4 text-white rounded-md text-sm w-full mt-3 bg-[#2B3674]"
                    >
                      Add To Inventory
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product); // `item` is your current product row
                        setShowVariantPopup(true);
                      }}
                      className="py-2 px-4 text-white rounded-md text-sm w-full mt-3 bg-[#3965FF]"
                    >
                      View Variants
                    </button>

                    {showPopup && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                          <h2 className="text-xl font-semibold mb-4">Add to Inventory</h2>
                          <table className="min-w-full table-auto border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-4 py-2">Image</th>
                                <th className="border px-4 py-2">Stock</th>
                                <th className="border px-4 py-2">Price</th>
                                <th className="border px-4 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryData.variant?.map((variant, index) => (
                                <tr key={index}>
                                  <td className="border px-4 py-2">
                                    <Image
                                      height={40}
                                      width={40}
                                      src={"https://placehold.co/400" || variant.image}
                                      alt={variant.color || "NIL"}
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <input
                                      type="number"
                                      placeholder="Stock"
                                      name="dropStock"
                                      className="w-full border rounded p-2"
                                      value={variant.dropStock || ''}
                                      onChange={(e) =>
                                        handleVariantChange(variant.id, "dropStock", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <input
                                      type="number"
                                      name="dropPrice"
                                      placeholder="Price"
                                      className="w-full border rounded p-2"
                                      value={variant.dropPrice || ''}
                                      onChange={(e) =>
                                        handleVariantChange(variant.id, "dropPrice", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <label className="flex mt-2 items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        name="Dropstatus"
                                        className="sr-only"
                                        checked={variant.Dropstatus || false}
                                        onChange={(e) =>
                                          handleVariantChange(variant.id, "Dropstatus", e.target.checked)
                                        }
                                      />
                                      <div
                                        className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${variant.Dropstatus ? "bg-orange-500" : ""
                                          }`}
                                      >
                                        <div
                                          className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${variant.Dropstatus ? "translate-x-5" : ""
                                            }`}
                                        ></div>
                                      </div>
                                      <span className="ms-2 text-sm text-gray-600">Status</span>
                                    </label>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>




                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              onClick={() => {
                                setShowPopup(false);
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={(e) => handleSubmit(e)}
                              className="px-4 py-2 bg-green-600 text-white rounded"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {showVariantPopup && selectedProduct && (
                      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-5xl shadow-xl relative">
                          <h2 className="text-xl font-semibold mb-4">Variant Details</h2>

                          <table className="min-w-full table-auto border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-4 py-2">Image</th>
                                <th className="border px-4 py-2">SKU</th>
                                <th className="border px-4 py-2">Color</th>
                                <th className="border px-4 py-2">Qty</th>
                                <th className="border px-4 py-2">ShipOwl Price</th>
                                <th className="border px-4 py-2">RTO Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProduct.variants?.map((v, index) => {
                                const imageUrls = v.image
                                  ? v.image.split(',').map((img) => img.trim()).filter(Boolean)
                                  : [];
                                const variant = v.variant || v;

                                return (
                                  <tr key={index}>
                                    <td className="border px-4 py-2">
                                      <div className="flex space-x-2 overflow-x-auto max-w-[200px]">
                                        {imageUrls.length > 0 ? (
                                          imageUrls.map((url, idx) => (
                                            <Image
                                              key={idx}
                                              height={40}
                                              width={40}
                                              src={url}
                                              alt={variant.name || 'NIL'}
                                              className="shrink-0 rounded"
                                            />
                                          ))
                                        ) : (
                                          <Image
                                            height={40}
                                            width={40}
                                            src="https://placehold.co/400"
                                            alt="Placeholder"
                                            className="shrink-0 rounded"
                                          />
                                        )}
                                      </div>
                                    </td>
                                    <td className="border px-4 py-2">{variant.sku || 'NIL'}</td>
                                    <td className="border px-4 py-2">{variant.color || 'NIL'}</td>
                                    <td className="border px-4 py-2">{variant.qty ?? 'NIL'}</td>
                                    <td className="border px-4 py-2">{variant.shipowl_price ?? 'NIL'}</td>
                                    <td className="border px-4 py-2">{variant.rto_price ?? 'NIL'}</td>
                                  </tr>
                                );
                              })}

                            </tbody>

                          </table>

                          <button
                            onClick={() => setShowVariantPopup(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;
