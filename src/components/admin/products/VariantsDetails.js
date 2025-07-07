'use client';

import { useContext, useState } from 'react';
import { Plus, Minus, ImageIcon } from 'lucide-react';
import { ProductContextEdit } from './ProductContextEdit';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useRouter, useSearchParams } from "next/navigation";
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import Swal from "sweetalert2";
import { useImageURL } from "@/components/ImageURLContext";
export default function VariantDetails() {

  const searchParams = useSearchParams();

  const productId = searchParams.get("id");
  const { fetchImages } = useImageURL();
  const { formData, setFormData, setActiveTab } = useContext(ProductContextEdit);
  const [loading, setLoading] = useState(null);
  const numericFields = ['suggested_price'];
  const router = useRouter(); // Place this at the top of your component
  const handleChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = numericFields.includes(field)
      ? value === '' ? '' : Number(value)
      : value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleIsVariantExistsChange = (e) => {
    const value = e?.target?.value || '';
    let updatedVariants = formData.variants || [];

    const isBoth = formData.list_as === 'both';

    // Only reset variants if they're empty or not present
    if ((value === 'yes' || value === 'no') && updatedVariants.length === 0) {
      const baseVariant =
        value === 'yes'
        && {
          color: '',
          sku: '',
          product_link: '',
          name: '',
          suggested_price: 0,
          image: null,
        }
      value === 'no' && {
        product_link: '',
        sku: '',
        suggested_price: 0,
        image: null,
      };

      updatedVariants = isBoth
        ? [
          { ...baseVariant, model: 'Shipowl' },
          { ...baseVariant, model: 'Selfship' },
        ]
        : [{ ...baseVariant, model: formData.list_as }];
    }

    setFormData((prev) => ({
      ...prev,
      isVarientExists: value,
      variants: updatedVariants,
    }));
  };


  const showAddButton = formData.isVarientExists === 'yes';


  const handleFileChange = (event, index) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      const imageKey = `variant_images_${index}`;
      setFormData((prev) => ({
        ...prev,
        [imageKey]: [...(prev[imageKey] || []), ...selectedFiles],
      }));
    }
  };

  const addVariant = () => {
    const newVariant = {
      color: '',
      sku: '',
      product_link: '',
      name: '',
      suggested_price: 0,
      image: null,
    };

    let updatedVariants = [...formData.variants];
    if (formData.list_as === 'both') {
      updatedVariants = [...updatedVariants, { ...newVariant, model: 'Shipowl' }, { ...newVariant, model: 'Selfship' }];
    } else {
      updatedVariants = [...updatedVariants, { ...newVariant, model: formData.list_as }];
    }

    setFormData({ ...formData, variants: updatedVariants });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const validate = () => {
    const errors = {};
    if (!formData.isVarientExists) {
      errors.isVarientExists = "This Field Is Required";
    }
    setError(errors);
    return Object.keys(errors).length === 0; // ✅ returns true if no errors
  };
  const handleSubmit = () => {
    setActiveTab('shipping-details');
  };

  const handleImageDelete = async (index, type, variantId) => {
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Deleting Image...',
        text: 'Please wait while we remove the image.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/product/${productId}/variant/${variantId}/image/${index}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        Swal.close();
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: errorMessage.message || errorMessage.error || "An error occurred",
        });
        throw new Error(errorMessage.message || errorMessage.error || "Submission failed");
      }

      const result = await response.json();
      Swal.close();


      if (result) {
        Swal.fire({
          icon: "success",
          title: "Image Deleted",
          text: `The image has been deleted successfully!`,
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            window.location.reload(); // ✅ Works for Pages Router
          }
        });
      }

    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
      setError(error.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="mt-4 p-6 rounded-xl bg-white">
      <div className="md:flex mb-6 justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#2B3674] mb-4">Variant Details</h2>
        <button className="bg-[#4318FF] text-white px-4 py-2 rounded-md mt-4" onClick={handleSubmit}>
          Next
        </button>
      </div>

      <div>
        <label className='block' htmlFor="isVarientExists">
          Is Variant Exists <span className='text-red-500'>*</span>
        </label>
        <select
          className="w-full border border-[#DFEAF2] p-3 rounded-md text-[#718EBF] font-bold mt-2 outline-0"
          name="isVarientExists"
          id="isVarientExists"
          value={formData.isVarientExists || ''}
          onChange={handleIsVariantExistsChange}
        >
          <option value="">Please Select Option</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <>
        {showAddButton && (
          <div className="flex justify-end md:hidden mt-4 mb-2">
            <button className="bg-green-500 text-white p-2 rounded-lg" onClick={addVariant}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}


        <div className={`mt-5 lg:grid  hidden overflow-auto grid-cols-1 gap-6 items-center justify-between border-b border-[#E9EDF7] pb-2 mb-4 text-gray-600 font-semibold ${!showAddButton ? 'lg:grid-cols-5' : 'lg:grid-cols-8'}`}>
          {formData.isVarientExists && (
            <span className="text-[#A3AED0] whitespace-nowrap">Model</span>

          )}

          {showAddButton && (
            <>
              <span className="text-[#A3AED0] whitespace-nowrap">Variant Name</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Color</span>
            </>
          )}
          {formData.isVarientExists && (
            <>
              <span className="text-[#A3AED0] whitespace-nowrap">SKU</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Suggested Price</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Product Link</span>
              <span className="text-[#A3AED0] whitespace-nowrap text-right">Images</span>
            </>
          )}
          {showAddButton && (
            <div className="flex justify-end">
              <button className="bg-green-500 text-white p-2 rounded-lg" onClick={addVariant}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {formData.isVarientExists && (
          <div className='border p-3 rounded-md border-gray-500'>
            {
              Array.isArray(formData.variants) &&
              formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className={`md:grid p-3 rounded-md border  mt-5 border-dotted overflow-auto md:grid-cols-2 gap-6 justify-between mb-4 border-b border-[#E9EDF7] pb-4  ${!showAddButton ? 'lg:grid-cols-5' : 'lg:grid-cols-8'}`}
                >
                  {formData.isVarientExists && (
                    <div>
                      <input type="text" value={variant.model} className='uppercase' name="model" id="model" readOnly />
                    </div>
                  )}


                  {formData.isVarientExists === 'yes' && (
                    <>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Variant Name</span>
                        <input
                          type="text"
                          placeholder="name"
                          className="border  p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.name}
                          onChange={(e) => handleChange(index, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Color</span>
                        <select
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2]"
                          value={variant.color}
                          onChange={(e) => handleChange(index, 'color', e.target.value)}
                        >
                          <option value="">Select Color</option>
                          <option value="Red">Red</option>
                          <option value="Blue">Blue</option>
                          <option value="Green">Green</option>
                        </select>
                      </div>


                    </>
                  )}

                  {formData.isVarientExists && (
                    <>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">SKU</span>
                        <input
                          type="text"
                          placeholder="SKU"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.sku}
                          onChange={(e) => handleChange(index, 'sku', e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Suggested Price</span>
                        <input
                          type="number"
                          placeholder="suggested_price"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.suggested_price}
                          onChange={(e) => handleChange(index, 'suggested_price', e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Product Link</span>
                        <input
                          type="text"
                          placeholder="Link"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2]"
                          value={variant.product_link || ''}
                          onChange={(e) => handleChange(index, 'product_link', e.target.value)}
                        />
                      </div>

                      <div className="md:flex flex-wrap justify-end">
                        <span className="text-orange-500 font-semibold lg:hidden block">Images</span>
                        <div className="relative border border-[#DFEAF2] rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                          {Array.isArray(variant?.variant_images) && variant.variant_images.length > 0
                            ? variant.variant_images.map((file, i) => file.name || `File ${i + 1}`).join(', ')
                            : 'Upload'}

                          <input
                            type="file"
                            multiple
                            className="absolute opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => handleFileChange(e, index)}
                          />
                        </div>
                        {variant.variant_images && (
                          <div className="mt-3 w-full">
                            <Swiper
                              key={index}
                              modules={[Navigation]}
                              slidesPerView={1}
                              spaceBetween={12}
                              loop={
                                Array.isArray(variant.variant_images)
                                  ? variant.variant_images.length > 1
                                  : variant.variant_images.split(',').length > 1
                              }
                              navigation={true}
                              className="mySwiper"
                            >
                              {(Array.isArray(variant.variant_images)
                                ? variant.variant_images
                                : variant.variant_images.split(',').map((url) => url.trim())
                              ).map((file, index) => (
                                <SwiperSlide key={index} className="relative group">
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 opacity-90 hover:opacity-100"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Are you sure?',
                                        text: 'Do you want to delete this image?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Yes, delete it!',
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          handleImageDelete(index, 'variant_image', variant.id);
                                        }
                                      });
                                    }}
                                  >
                                    ✕
                                  </button>

                                  <Image
                                    src={fetchImages(file)}
                                    alt={`Image ${index + 1}`}
                                    width={500}
                                    height={500}
                                    className="rounded-lg object-cover w-full h-32"
                                  />
                                </SwiperSlide>
                              ))}
                            </Swiper>
                          </div>
                        )}

                      </div>
                    </>
                  )}

                  {showAddButton && (
                    <div className="flex items-start justify-end gap-2 mt-2">
                      <button className="bg-red-500 text-white p-2 rounded" onClick={() => removeVariant(index)}>
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

        )}
      </>
    </div>
  );
}
