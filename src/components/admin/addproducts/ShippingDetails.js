'use client';

import { useContext } from 'react';
import { UploadCloud } from 'lucide-react';
import { ProductContext } from './ProductContext';
import { useRouter } from 'next/navigation';

export default function ShippingDetails() {
  const { formData, validateForm2, setFormData, shippingErrors, fileFields, setActiveTabs, videoFields } = useContext(ProductContext);
  const router = useRouter();
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
      setActiveTabs('other-details');
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

          {/* Chargable Weight Field (Read-only + unit visible) */}
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
                  accept="image/*"
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  onChange={(e) => handleFileChange(e, key)}
                />
              </div>

              {shippingErrors[key] && <p className="text-red-500 text-sm">{shippingErrors[key]}</p>}
            </div>
          ))}
          {videoFields.map(({ label, key }) => (
            <div key={key} className="flex flex-col space-y-2 w-full md:w-[250px]">
              <label className="text-[#232323] font-bold block mb-1">
                {label} <span className="text-red-500">*</span>
              </label>

              <div className="relative border-2 border-dashed border-red-300 rounded-xl p-4 w-full h-36 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                <UploadCloud className="w-6 h-6 text-[#232323] mb-2" />
                <span className="text-xs text-[#232323] text-center">
                  {Array.isArray(formData?.[key]) && formData[key].length > 0
                    ? formData[key].map((file, i) => file.name || `File ${i + 1}`).join(', ')
                    : 'Upload'}
                </span>

                <input
                  type="file"
                  multiple
                  accept="video/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange(e, key)}
                />
                 {shippingErrors[key] && <p className="text-red-500 text-sm">{shippingErrors[key]}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <button type="submit" className="bg-orange-500 text-white px-14 py-2 rounded-md">
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
      </form>
    </div>
  );
}
