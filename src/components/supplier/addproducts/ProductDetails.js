'use client';

import { useContext, useEffect, useState } from 'react';
import { ProductContext } from './ProductContext';
import "@pathofdev/react-tag-input/build/index.css"; // Required styles
import ReactTagInput from "@pathofdev/react-tag-input";
import { HashLoader } from 'react-spinners';
import dynamic from 'next/dynamic';
import { useSupplier } from '../middleware/SupplierMiddleWareContext';

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
    validateFields,
    errors, setErrors, loading
  } = useContext(ProductContext);

  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    fetchCategory();
    fetchBrand();
    fetchCountry();
    // fetchSupplier();
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


  const handleSubmit = () => {
    if (validateFields()) {
      setActiveTab('variants-details')
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

      <div className="mt-4">
        <label className="block text-[#232323] font-semibold">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          className={`w-full border ${errors.description ? 'border-red-500' : 'border-[#DFEAF2]'} p-2 rounded-md text-[#718EBF] font-bold mt-2 outline-0 h-24`}
          placeholder="Description"
          onChange={handleChange}
          value={formData.description || ''}
        ></textarea>
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
       

      </div>

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={handleSubmit}
          className="bg-orange-500 text-white px-14 py-2 rounded-md"
        >
          Next
        </button>
        <button className="bg-[#8F9BBA] text-white px-14 py-2 rounded-md">Cancel</button>
      </div>
    </div>
  );
}
