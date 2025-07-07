'use client';

import { useState, useContext } from 'react';
import { UploadCloud } from 'lucide-react';
import { ProductContextEdit } from './ProductContextEdit';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import Image from "next/image";
import 'swiper/css/navigation';
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from 'next/navigation';
import { useImageURL } from "@/components/ImageURLContext";
export default function ShippingDetails() {
  const { formData, files, setFiles, validateForm2, setFormData, shippingErrors, fileFields, videoFields, setActiveTab } = useContext(ProductContextEdit);
  const [loading, setLoading] = useState(null);
  const { fetchImages } = useImageURL();

  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");

  const handleFileChange = (e, key) => {
    const selectedFiles = Array.from(e.target.files); // ✅ real File objects
    setFiles((prev) => ({
      ...prev,
      [key]: selectedFiles,
    }));
  };





  const handleImageDelete = async (index, type) => {
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

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/product/${id}/image/${index}?type=${type}`;

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


  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the main field
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Recalculate chargable weight if any of the dimensions or weight changes
      const weight = parseFloat(
        name === 'weight' ? value : updated.weight
      ) || 0;
      const length = parseFloat(
        name === 'package_length' ? value : updated.package_length
      ) || 0;
      const width = parseFloat(
        name === 'package_width' ? value : updated.package_width
      ) || 0;
      const height = parseFloat(
        name === 'package_height' ? value : updated.package_height
      ) || 0;

      const volumetric = (length * width * height) / 5000;
      const chargable = Math.max(weight, volumetric).toFixed(2);

      return {
        ...updated,
        chargable_weight: chargable,
      };
    });
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm2()) {
      setActiveTab('other-details');
    }
  };

  return (
    <div className="xl:w-11/12 mt-4 xl:p-6 p-3 rounded-2xl bg-white">
      <form onSubmit={handleSubmit}>
        <div className="md:grid-cols-1 grid my-4">
          <div>
            <label className="text-[#232323] font-bold block">
              Shipping Time (in Days) <span className="text-red-500">*</span>
            </label>
            <select
              name="shipping_time"
              className={`border ${shippingErrors.shipping_time ? 'border-red-500' : 'border-[#DFEAF2]'} mt-2 w-full p-3 rounded-xl`}
              value={formData.shipping_time || ''}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="24 Hours">24 Hours</option>
              <option value="3">3 Days</option>
              <option value="5">5 Days</option>
            </select>
            {shippingErrors.shipping_time && <p className="text-red-500 text-sm">{shippingErrors.shipping_time}</p>}
          </div>
        </div>

        <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-4 mb-4">
          {['weight', 'package_length', 'package_width', 'package_height'].map((field) => {
            const unit = field.includes('weight') ? 'KG' : 'CM';
            return (
              <div key={field} className="relative">
                <label className="text-[#232323] font-bold block">
                  {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  <span className="text-red-500"> *</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    className={`border ${shippingErrors[field] ? 'border-red-500' : 'border-[#DFEAF2]'} w-full p-3 pr-12 rounded-xl`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">{unit}</span>
                </div>
                {shippingErrors[field] && (
                  <p className="text-red-500 text-sm mt-1">{shippingErrors[field]}</p>
                )}
              </div>
            );
          })}

          <div className="relative">
            <label className="text-[#232323] font-bold block">
              Chargable Weight <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <input
                type="number"
                name="chargable_weight"
                readOnly
                value={formData.chargable_weight || ''}
                className={`border ${shippingErrors.chargable_weight ? 'border-red-500' : 'border-[#DFEAF2]'
                  } w-full p-3 pr-12 rounded-xl bg-gray-100`}
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">KG</span>
            </div>
            {shippingErrors.chargable_weight && (
              <p className="text-red-500 text-sm mt-1">{shippingErrors.chargable_weight}</p>
            )}
          </div>

        </div>

        <div className="flex flex-wrap gap-8 my-8">
          {fileFields.map(({ label, key }) => (
            <div key={key} className="flex flex-col space-y-2 w-full md:w-[250px]">
              <label className="text-[#232323] font-bold block mb-1">
                {label}
              </label>

              <div className="relative border-2 border-dashed border-red-300 rounded-xl p-4 w-full h-36 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                <UploadCloud className="w-6 h-6 text-[#232323] mb-2" />
                <span className="text-xs text-[#232323] text-center">
                  {Array.isArray(files?.[key]) && files[key].length > 0
                    ? files[key]
                      .map((file, i) => file.name || `File ${i + 1}`)
                      .join(', ')
                    : 'Upload'}
                </span>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange(e, key)}
                />
              </div>

              {formData[key] && (
                <div className="mt-3 w-full">
                  <Swiper
                    key={key}
                    modules={[Navigation]}
                    slidesPerView={2}
                    spaceBetween={12}
                    loop={
                      Array.isArray(formData[key])
                        ? formData[key].length > 1
                        : formData[key].split(',').length > 1
                    }
                    navigation={true}
                    className="mySwiper"
                  >
                    {(Array.isArray(formData[key])
                      ? formData[key]
                      : formData[key].split(',').map((url) => url.trim())
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
                                handleImageDelete(index, key);
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
          ))}
          {videoFields.map(({ label, key }) => (
            <div key={key} className="flex flex-col space-y-2 w-full md:w-[250px]">
              <label className="text-[#232323] font-bold block mb-1">
                {label}
              </label>

              <div className="relative border-2 border-dashed border-red-300 rounded-xl p-4 w-full h-36 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                <UploadCloud className="w-6 h-6 text-[#232323] mb-2" />
                <span className="text-xs text-[#232323] text-center">
                  {Array.isArray(files?.[key]) && files[key].length > 0
                    ? files[key].map((file, i) => file.name || `File ${i + 1}`).join(', ')
                    : 'Upload'}
                </span>

                <input
                  type="file"
                  multiple
                  accept="video/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange(e, key)}
                />
              </div>

              {formData[key] && (
                <div className="mt-3 w-full">
                  <Swiper
                    key={key}
                    modules={[Navigation]}
                    slidesPerView={1}
                    spaceBetween={12}
                    loop={
                      Array.isArray(formData[key])
                        ? formData[key].length > 1
                        : formData[key].split(',').length > 1
                    }
                    navigation={true}
                    className="mySwiper"
                  >
                    {(Array.isArray(formData[key])
                      ? formData[key]
                      : formData[key].split(',').map((url) => url.trim())
                    ).map((fileUrl, index) => (
                      <SwiperSlide key={index} className="relative group">
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 opacity-90 hover:opacity-100"
                          onClick={() => {
                            Swal.fire({
                              title: 'Are you sure?',
                              text: 'Do you want to delete this video?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#d33',
                              cancelButtonColor: '#3085d6',
                              confirmButtonText: 'Yes, delete it!',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleImageDelete(index, key);
                              }
                            });
                          }}
                        >
                          ✕
                        </button>

                        <video
                          src={fileUrl}
                          controls
                          className="rounded-lg object-cover w-full h-32"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>
          ))}


        </div>


        <div className="flex flex-wrap gap-4">
          <button type="submit" className="bg-orange-500 text-white md:px-14 py-2 rounded-md px-6">
            Next
          </button>
          <button type="button" className="bg-[#8F9BBA] text-white md:px-14 py-2 rounded-md px-6">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
