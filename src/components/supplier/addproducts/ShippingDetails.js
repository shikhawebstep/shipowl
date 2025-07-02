'use client';

import { useState, useContext } from 'react';
import { UploadCloud } from 'lucide-react';
import { ProductContext } from './ProductContext';

export default function ShippingDetails() {
  const { formData, validateForm2, setFormData, shippingErrors, fileFields, setActiveTab } = useContext(ProductContext);



  const handleFileChange = (event, key) => {
    const selectedFiles = Array.from(event.target.files);

    // Update formData state with the actual File objects
    setFormData((prev) => ({
      ...prev,
      [key]: selectedFiles,
    }));
  };




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
          {['weight', 'package_length', 'package_width', 'package_height', 'chargable_weight'].map((field) => (
            <div key={field}>
              <label className="text-[#232323] font-bold block">
                {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder={field.includes('weight') ? 'GM' : 'CM'}
                className={`border placeholder-black placeholder:text-right ${shippingErrors[field] ? 'border-red-500' : 'border-[#DFEAF2]'
                  } mt-2 w-full p-3 rounded-xl`}
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
              />
              {shippingErrors[field] && <p className="text-red-500 text-sm">{shippingErrors[field]}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-8 my-8">
          {fileFields.map(({ label, key }) => (
            <div key={key} className="flex flex-col space-y-2">
              <label className="text-[#232323] font-bold block">
                {label} <span className="text-red-500">*</span>
              </label>
              <div className="border-1 relative border-dashed border-red-300 rounded-xl p-6 w-48 h-32 flex flex-col items-center justify-center">
                <UploadCloud className="w-8 h-8 text-[#232323]" />
                <span className="text-xs text-[#232323] text-center">
                  {Array.isArray(formData?.[key]) && formData[key].length > 0
                    ? formData[key]
                      .map((file, i) => file.name || `File ${i + 1}`)
                      .join(', ')
                    : 'Upload'}
                </span>
                <input
                  type="file"
                  multiple
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  onChange={(e) => handleFileChange(e, key)}
                />
              </div>

              {shippingErrors[key] && <p className="text-red-500 text-sm">{shippingErrors[key]}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <button type="submit" className="bg-orange-500 text-white px-14 py-2 rounded-md">
            Next
          </button>
          <button type="button" className="bg-[#8F9BBA] text-white px-14 py-2 rounded-md">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
