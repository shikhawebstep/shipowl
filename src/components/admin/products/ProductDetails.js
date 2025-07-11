'use client';

import { useContext, useEffect, useState } from 'react';
import { ProductContextEdit } from './ProductContextEdit';
import "@pathofdev/react-tag-input/build/index.css"; // Required styles
import ReactTagInput from "@pathofdev/react-tag-input";
import { useAdmin } from '../middleware/AdminMiddleWareContext';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
// Dynamically import TinyMCE Editor with SSR disabled
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
});
const Select = dynamic(() => import('react-select'), { ssr: false });
export default function ProductDetails() {
  const {
    fetchCountry,
    formData,
    setFormData,
    countryData,
    fetchCategory,
    categoryData,
    brandData,
    fetchBrand,
    setActiveTab,
    setFiles,
    files,
    errors, setErrors, validateFields,

  } = useContext(ProductContextEdit);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const { fetchSupplier, suppliers } = useAdmin();
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);

    // Save preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(previews);

    // Save files to formData
    setFiles((prev) => ({
      ...prev,
      gallery: files, // or `galleryFiles`, if you want to keep it in separate state
    }));

    setErrors((prev) => ({ ...prev, gallery: '' }));
  };

 const handleGalleryImageDelete = (index) => {
    const updatedPreviews = [...galleryPreviews];
    const updatedFiles = [...formData.gallery];

    updatedPreviews.splice(index, 1);
    updatedFiles.splice(index, 1);

    setGalleryPreviews(updatedPreviews);
    setFiles((prev) => ({
      ...prev,
      gallery: updatedFiles,
    }));
  };

  const searchParams = useSearchParams();


  const id = searchParams.get("id");

  const handleImageDelete = async (index, type) => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id");

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
        didOpen: () => Swal.showLoading(),
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
          text: errorMessage.message || "An error occurred",
        });
        return;
      }

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Image Deleted",
        text: `The image has been deleted successfully!`,
        showConfirmButton: true,
      }).then(() => {
        const updatedImages = typeof formData[type] === 'string'
          ? formData[type].split(',').map((img) => img.trim())
          : Array.isArray(formData[type])
            ? [...formData[type]]
            : [];

        updatedImages.splice(index, 1);

        setFormData((prev) => ({
          ...prev,
          [type]: updatedImages.join(','),
        }));

        removeSortingIndex(index, type);
      });

    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Something went wrong.",
      });
    }
  };

  const handleSortingIndexChange = (idx, type, value) => {
    setFormData((prev) => {
      // Clone existing state
      const imageSortingIndex = { ...(prev.imageSortingIndex || {}) };
      const typeArray = [...(imageSortingIndex[type] || [])];

      // Check if the index already exists
      const existingIndex = typeArray.findIndex(item => item.index === idx);

      if (existingIndex !== -1) {
        // Update the value
        typeArray[existingIndex].value = value;
      } else {
        // Add a new entry
        typeArray.push({ index: idx, value });
      }

      // Assign updated array back
      imageSortingIndex[type] = typeArray;

      return {
        ...prev,
        imageSortingIndex
      };
    });
  };

  const removeSortingIndex = (idx, type) => {
    setFormData((prev) => {
      const imageSortingIndex = { ...(prev.imageSortingIndex || {}) };
      const typeArray = [...(imageSortingIndex[type] || [])];

      // Remove the entry with the given index
      let updatedTypeArray = typeArray.filter(item => item.index !== idx);

      // Reassign all entries after the removed one with updated index
      updatedTypeArray = updatedTypeArray.map(item => {
        if (item.index > idx) {
          return { ...item, index: item.index - 1 }; // shift left
        }
        return item;
      });

      imageSortingIndex[type] = updatedTypeArray;

      return {
        ...prev,
        imageSortingIndex
      };
    });
  };

  console.log(`FormData - `, formData);

  useEffect(() => {
    fetchCategory();
    fetchBrand();
    fetchCountry();
    fetchSupplier();
  }, [fetchCategory, fetchBrand, fetchCountry]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors({ ...errors, [name]: '' });
  };
  const handleEditorChange = (value, field) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeTags = (newTags) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData, tags: newTags };
      return updatedData;
    });
  };



  const handleSubmit = () => {
    if (validateFields()) {
      setActiveTab('variants-details')
    }
  };


  return (
    <div className="mt-4 lg:p-6 p-3 rounded-2xl bg-white">
      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1">
        <div>
          <label className="block text-[#232323] font-semibold">
            Product Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            className={`w-full border ${errors.category ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            onChange={handleChange}
            value={formData.category || ''}
          >
            <option value="">Select Category</option>
            {categoryData.map((item, index) => (
              <option key={index} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-[#232323] font-semibold">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            className={`w-full border ${errors.name ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            placeholder="Name"
            onChange={handleChange}
            value={formData.name || ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[#232323] font-semibold">
            Product Main SKU <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="main_sku"
            className={`w-full border ${errors.main_sku ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            placeholder="Main SKU"
            onChange={handleChange}
            value={formData.main_sku || ''}
          />
          {errors.main_sku && <p className="text-red-500 text-sm mt-1">{errors.main_sku}</p>}
        </div>
      </div>
      <div>
        <label className="block mt-3 text-[#232323] font-semibold">
          Image Gallery <span className="text-red-500">*</span>
        </label>

        <div className="mt-2 grid grid-cols-4 gap-4">
          {(() => {
            const serverImages = typeof formData.gallery === 'string'
              ? formData.gallery.split(',').map((url) => url.trim()).filter(Boolean)
              : Array.isArray(formData.gallery)
                ? formData.gallery
                : [];

            const totalServerImages = serverImages.length;

            return [...serverImages].map((img, index) => {
              const isFile = index >= totalServerImages;
              const fileIndex = index - totalServerImages;
              const imageUrl = typeof img === 'string' ? img : URL.createObjectURL(img);

              return (
                <div>
                  <div
                    key={index}
                    className="relative w-full h-[300px] rounded overflow-hidden border border-gray-300"
                  >
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 hover:opacity-100 opacity-90"
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
                            if (isFile) {
                              handleGalleryImageDelete(fileIndex);
                            } else {
                              handleImageDelete(index, 'gallery');
                            }
                          }
                        });
                      }}
                    >
                      ✕
                    </button>

                    <img
                      src={imageUrl}
                      alt={`Gallery ${index}`}
                      className="w-full h-full object-cover"
                    />

                  </div>
                  {
                    !isFile && <input
                      className='border w-full border-gray-200 rounded-md p-2 mt-1'
                      type='number'
                      name="sorting_index"
                      placeholder='Sorting Index'
                      value={
                        formData.imageSortingIndex?.gallery?.find(item => item.index === index)?.value || ''
                      }
                      onChange={(e) => handleSortingIndexChange(index, 'gallery', e.target.value)}
                    />
                  }
                </div>
              );
            });
          })()}

            {galleryPreviews.length > 0 &&
            galleryPreviews.map((src, index) => (
              <div key={index} className="relative w-full p-4 h-[300px] rounded overflow-hidden border border-gray-300">
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10"
                  onClick={() => handleGalleryImageDelete(index)}
                >
                  ✕
                </button>
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

          {/* "+" Add button */}
          <label
            htmlFor="gallery-upload"
            className="flex items-center justify-center min-w-[100px] h-[100px] border border-dashed border-gray-400 text-3xl text-gray-500 cursor-pointer rounded"
          >
            +
            <input
              id="gallery-upload"
              type="file"
              name="gallery"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryChange}
            />
          </label>
        </div>




        {/* Error message */}
        {errors.gallery && <p className="text-red-500 text-sm mt-1">{errors.gallery}</p>}
      </div>



      <div className="mt-4">
        <label className="block text-[#232323] font-semibold">
          Description <span className="text-red-500">*</span>
        </label>

        {/* 'checklist', 'mediaembed', 'casechange', 'formatpainter',
            'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen',
            'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate',
            'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes',
            'mergetags', 'autocorrect', 'typography', 'inlinecss',
            'markdown', 'importword', 'exportword', 'exportpdf' */}
        <Editor
          apiKey="frnlhul2sjabyse5v4xtgnphkcgjxm316p0r37ojfop0ux83"
          value={formData.description}
          onEditorChange={(content) => handleEditorChange(content, 'description')}
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
              'image', 'link', 'lists', 'media', 'searchreplace', 'table',
              'visualblocks', 'wordcount'
            ],
            toolbar:
              'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
              'link image media table mergetags | addcomment showcomments | ' +
              'spellcheckdialog a11ycheck typography | align lineheight | ' +
              'checklist numlist bullist indent outdent | emoticons charmap | removeformat',
            tinycomments_mode: 'embedded',
            tinycomments_author: 'Author name',
            mergetags_list: [
              { value: 'First.Name', title: 'First Name' },
              { value: 'Email', title: 'Email' },
            ],
            ai_request: (request, respondWith) =>
              respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
          }}
        />

        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>


      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1 mt-4">

        <div>
          <label className="block text-[#232323] font-semibold">Product Tags<span className="text-red-500">*</span></label>
          <ReactTagInput
            name="tags"
            className={`w-full border ${errors.description ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0 h-24`}

            tags={formData.tags || []} // Ensure this is an array of strings
            onChange={handleChangeTags} // Correctly passing the tag array to update formData
            placeholder="Type and press enter"
          />
          {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}

        </div>


        <div>
          <label className="block text-[#232323] font-semibold">
            Brand <span className="text-red-500">*</span>
          </label>
          <select
            name="brand"
            className={`w-full border ${errors.brand ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            onChange={handleChange}
            value={formData.brand || ''}
          >
            <option value="">Select Brand</option>
            {brandData.map((item, index) => (
              <option key={index} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
        </div>

        <div>
          <label className="block text-[#232323] font-semibold">
            Country Of Origin <span className="text-red-500">*</span>
          </label>
          <select
            name="origin_country"
            className={`w-full border ${errors.origin_country ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            onChange={handleChange}
            value={formData.origin_country || ''}
          >
            <option value="">Select Country</option>
            {countryData?.map((item, index) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.origin_country && <p className="text-red-500 text-sm mt-1">{errors.origin_country}</p>}
        </div>
      </div>

      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1 mt-4">
        <div>
          <label className="block text-[#232323] font-semibold">
            Shipping Country <span className="text-red-500">*</span>
          </label>
          <select
            name="shipping_country"
            className={`w-full border ${errors.shipping_country ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0`}
            onChange={handleChange}
            value={formData.shipping_country || ''}
          >
            <option value="">Select Country</option>
            {countryData?.map((item, index) => (
              <option key={index} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.shipping_country && <p className="text-red-500 text-sm mt-1">{errors.shipping_country}</p>}
        </div>

        <div>
          <label className="block text-[#232323] font-semibold">
            Product Video URL <span className="text-[#aaa]">(mp4, mov only)</span>
          </label>
          <input
            type="text"
            name="video_url"
            className="w-full border border-[#DFEAF2] p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0"
            placeholder="Video URL"
            onChange={handleChange}
            value={formData.video_url || ''}
          />
        </div>

        <div className="mt-4">
          <label className="block text-[#232323] font-semibold">
            List As <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-4 mt-2">
            {['Selfship', 'Shipowl', 'both'].map((val) => (
              <label key={val} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="list_as"
                  value={val}
                  onChange={handleChange}
                  checked={formData.list_as === val}
                />{' '}
                {val === 'both' ? 'Both' : val.charAt(0).toUpperCase() + val.slice(1) + ' Model'}
              </label>
            ))}
          </div>
          {errors.list_as && <p className="text-red-500 text-sm mt-1">{errors.list_as}</p>}
        </div>
        <div>

          <label className="flex mt-2 items-center cursor-pointer">
            <input
              type="checkbox"
              name='isVisibleToAll'
              className="sr-only"
              checked={formData.isVisibleToAll || ''}
              onChange={handleChange}
            />
            <div
              className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${formData.isVisibleToAll ? "bg-orange-500" : ""
                }`}
            >
              <div
                className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${formData.isVisibleToAll ? "translate-x-5" : ""
                  }`}
              ></div>
            </div>
            <span className="ms-2 text-sm text-gray-600">
              is Visible To All
            </span>
          </label>
          {errors.isVisibleToAll && (
            <p className="text-red-500 text-sm mt-1">{errors.isVisibleToAll}</p>
          )}
        </div>
        <div>

          <label className="flex mt-2 items-center cursor-pointer">
            <input
              type="checkbox"
              name='status'
              className="sr-only"
              checked={formData.status || ''}
              onChange={handleChange}
            />
            <div
              className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${formData.status ? "bg-orange-500" : ""
                }`}
            >
              <div
                className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${formData.status ? "translate-x-5" : ""
                  }`}
              ></div>
            </div>
            <span className="ms-2 text-sm text-gray-600">
              Status
            </span>
          </label>

        </div>
      </div>
      {!formData.isVisibleToAll && (
        <div className='mt-3'>
          <label className="block text-[#232323] font-semibold">
            Select Suppliers <span className="text-red-500">*</span>
          </label>

          <Select
            isMulti
            name="supplierIds"
            options={suppliers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            className="mt-2"
            classNamePrefix="react-select"
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions
                ? selectedOptions.map((option) => option.value).join(',') // comma-separated string
                : '';

              handleChange({
                target: {
                  name: 'supplierIds',
                  value: selectedValues,
                },
              });
            }}
            value={
              typeof formData.supplierIds === 'string'
                ? suppliers
                  .filter((s) =>
                    formData.supplierIds.split(',').includes(s.id.toString())
                  )
                  .map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))
                : []
            }
          />


          {errors.supplierIds && (
            <p className="text-red-500 text-sm mt-1">{errors.supplierIds}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={handleSubmit}
          className="bg-orange-500 text-white md:px-14 py-2 rounded-md px-6"
        >
          Next
        </button>
        <button className="bg-[#8F9BBA] text-white md:px-14 py-2 rounded-md px-6">Cancel</button>
      </div>
    </div>
  );
}
