'use client';

import { useContext, useEffect, useState } from 'react';
import { ProductContext } from './ProductContext';
import "@pathofdev/react-tag-input/build/index.css"; // Required styles
import ReactTagInput from "@pathofdev/react-tag-input";
import { HashLoader } from 'react-spinners';
import { useAdmin } from '../middleware/AdminMiddleWareContext';
import { useRouter } from 'next/navigation';

import dynamic from 'next/dynamic';
const Select = dynamic(() => import('react-select'), { ssr: false });
// Dynamically import TinyMCE Editor with SSR disabled
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
});
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
    setActiveTabs,
    validateFields,
    errors, setErrors, loading
  } = useContext(ProductContext);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const router = useRouter();
  const { fetchSupplier, suppliers } = useAdmin();
  const handleEditorChange = (value, field) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
  const handleChangeTags = (newTags) => {



    setFormData((prevData) => {
      const updatedData = { ...prevData, tags: newTags };
      return updatedData;
    });
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);

    // Save preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(previews);

    // Save files to formData
    setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      gallery: updatedFiles,
    }));
  };


  const handleSubmit = () => {
    if (validateFields()) {
      setActiveTabs('variants-details')
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
          Image Gallary <span className="text-red-500">*</span>
        </label>

        <div className="mt-2 grid grid-cols-4 gap-4 ">

          {galleryPreviews.length > 0 &&
            galleryPreviews.map((src, index) => (
              <div  key={index}>
              <div className="relative w-full p-4 h-[300px] rounded overflow-hidden border border-gray-300">
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

        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1 mt-4">

        <div>
          <label className="block text-[#232323] font-semibold mb-2">Product Tags<span className="text-red-500">*</span></label>
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
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status}</p>
          )}
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
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
