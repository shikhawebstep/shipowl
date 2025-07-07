'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { DropshipperProfileContext } from './DropshipperProfileContext';

const Payment = () => {
  const { formData, setFormData } = useContext(DropshipperProfileContext);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (['panCardImage', 'aadharCardImage', 'gstDocument'].includes(name)) {
    // Store array of files
    setFormData((prev) => ({ ...prev, [name]: files ? Array.from(files) : [] }));
  } else if (name) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};


  const validate = () => {
    const newErrors = {};

    if (!formData.gstNumber) newErrors.gstNumber = 'Required';
    if (!formData.panCardHolderName) newErrors.panCardHolderName = 'Required';
    if (!formData.aadharCardHolderName) newErrors.aadharCardHolderName = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const adminData = JSON.parse(localStorage.getItem('shippingData'));
    if (adminData?.project?.active_panel !== 'admin') {
      localStorage.clear();
      router.push('/admin/auth/login');
      return;
    }

    const token = adminData?.security?.token;
    if (!token) {
      router.push('/admin/auth/login');
      return;
    }

    try {
      Swal.fire({
        title: 'Creating dropshipper...',
        text: 'Please wait while we save your dropshipper.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper`;
      const form = new FormData();

      // Append formData
     for (const key in formData) {
  const value = formData[key];

  if (value === null || value === undefined || value === '') continue;

  if (['panCardImage', 'gstDocument', 'aadharCardImage', 'profilePicture'].includes(key)) {
    if (Array.isArray(value)) {
      // Append each file separately with same key
      value.forEach((file) => {
        if (file instanceof File) {
          form.append(key, file, file.name);
        }
      });
    } else if (value instanceof File) {
      form.append(key, value, value.name);
    }
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
  } else {
    form.append(key, value);
  }
}


      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      Swal.close();

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Creation Failed',
          text: errorMessage.message || errorMessage.error || 'An error occurred',
        });
        throw new Error(errorMessage.message || errorMessage.error || 'Submission failed');
      }

      const result = await response.json();

      if (result) {
        Swal.fire({
          icon: 'success',
          title: 'Dropshipper Created',
          text: 'The Dropshipper has been created successfully!',
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            setFormData({});
            router.push('/admin/dropshipper/list');
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white lg:p-10 rounded-tl-none rounded-tr-none  p-3 rounded-2xl">

      <div>
        <h3 className="font-semibold text-[#FF702C] py-5 underline text-sm">KYC Details</h3>
        <div className="grid lg:grid-cols-3 gap-4 mt-2">
          {[
            { name: 'gstNumber', label: 'GST Number' },
            { name: 'panCardHolderName', label: 'Name on PAN Card' },
            { name: 'aadharCardHolderName', label: 'Name on Aadhar Card' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-[#232323] font-bold mb-1">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name={name}
                value={formData[name] || ''}
                onChange={(e) => handleChange( e)}
                className={`w-full p-3 border rounded-lg font-bold ${errors[name] ? 'border-red-500' : 'border-[#DFEAF2]'
                  } text-[#718EBF]`}
              />
              {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
            </div>
          ))}

          {/* File Uploads */}
          {['panCardImage', 'aadharCardImage', 'gstDocument'].map((name) => (
            <div key={name}>
              <label className="block text-[#232323] font-bold mb-1 capitalize">
                {name.replace(/([A-Z])/g, ' $1')} Upload
              </label>
              <input
                type="file"
                name={name}
                multiple
                onChange={(e) => handleChange( e)}
                className="w-full p-3 border rounded-lg border-[#DFEAF2] text-[#718EBF] font-bold"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
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
};

export default Payment;
