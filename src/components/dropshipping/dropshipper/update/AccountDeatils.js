'use client';
import { useContext, useState } from 'react';
import profileImg from '@/app/images/editprofile.png';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { DropshipperProfileContext } from './DropshipperProfileContext';
import { useImageURL } from "@/components/ImageURLContext";
const AccountDetails = () => {
  const { formData, setFormData, errors, setErrors, validate, setActiveTab } = useContext(DropshipperProfileContext);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { fetchImages } = useImageURL();
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedFormData = { ...formData };

    if (files?.length) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      updatedFormData[name] = file; // Set the file in formData
    } else {
      updatedFormData[name] = value;
      if (name === "profilePicture") {
        setPreviewUrl(null); // Remove preview if profilePicture is not selected
      }
    }

    setFormData(updatedFormData); // Update the form data with the new file or value



    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  const handleSubmit = () => {
    if (validate()) {
      setActiveTab('address_details');
    }
  };


  const inputClasses = (field) =>
    `w-full p-3 border rounded-lg font-bold ${errors[field] ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
    }`;

  const labelClasses = (field) =>
    `block font-bold mb-1 ${errors[field] ? 'text-red-500' : 'text-[#232323]'}`;

  const handleCancel = () => {
    setErrors({});
  };

  return (
    <div className='md:flex gap-4 xl:w-10/12 py-10 bg-white rounded-tl-none rounded-tr-none p-3 xl:p-10 rounded-2xl'>
      <div className='md:w-2/12'>
        <div className="relative">
          <Image
            src={fetchImages(formData.profilePicture)}
            alt="Profile image"
            height={40}
            width={40}
            className="md:w-full w-6/12 h-full object-cover rounded-full p-3"
          />

          {/* Hidden input */}
          <input
            type="file"
            id="upload"
            name="profilePicture"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          {/* Edit Icon */}
          <label
            htmlFor="upload"
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer"
          >
            <Pencil size={18} className="text-gray-600" />
          </label>
        </div>

      </div>

      <div className="md:w-10/12">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {/* Basic Inputs */}
          {[
            { label: 'Name', name: 'name', type: 'text' },
            { label: 'Mobile Number', name: 'phoneNumber', type: 'number' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Website URL', name: 'website', type: 'text' },
            { label: 'Referral Code', name: 'referralCode', type: 'text' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className={labelClasses(name)}>
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                className={inputClasses(name)}
              />
              {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block font-bold  text-[#232323]">Status</label>
            <select name="status" onChange={handleChange}
              className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-1 font-bold } `} value={formData?.status || ''}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>

    </div>
  );
};

export default AccountDetails;
