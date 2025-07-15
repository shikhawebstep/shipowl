'use client';

import { useContext, useState } from 'react';
import { ProductContext } from './ProductContext';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function OtherDetails() {
  const { formData, setFormData, setActiveTab, setErrors } = useContext(ProductContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const router = useRouter();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const requiredFields = ['tax_rate'];

  const validateForm = () => {
    const newError = {};

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newError[field] = `${field.replace('_', ' ')} is required.`;
      }
    });

    setError(newError);
    return Object.keys(newError).length === 0;
  };

  const getTabByFieldName = (fieldName) => {
    const ProductDetails = [
      'category',
      'name',
      'main_sku',
      'description',
      'brand',
      'tags',
      'origin_country',
      'shipping_country',
      'list_as',
    ];

    const businessFields = Object.keys(requiredFields);

    const shippingDetails = [
      'shipping_time',
      'weight',
      'package_length',
      'package_width',
      'package_height',
      'chargable_weight',
    ];


    if (ProductDetails.includes(fieldName)) return 'product-details';
    if (shippingDetails.includes(fieldName)) return 'shipping-details';
    if (businessFields.includes(fieldName)) return 'other-details';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!validateForm()) return;

    setLoading(true);

    const supplierData = JSON.parse(localStorage.getItem("shippingData"));
    if (!supplierData?.project?.active_panel === "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = supplierData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Creating Product...',
        text: 'Please wait while we save your Product.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/product`;
      const form = new FormData();

      for (const key in formData) {
        const value = formData[key];

        if (value === null || value === undefined || value === '') continue;

        // ✅ Handle arrays of File objects (multiple image upload)
        if (Array.isArray(value) && value[0] instanceof File) {
          value.forEach((file) => form.append(key, file));
        }

        // ✅ Handle single File
        else if (value instanceof File) {
          form.append(key, value);
        }

        // ✅ Handle variants, tags, and other arrays or objects
        else if (Array.isArray(value) || typeof value === 'object') {
          form.append(key, JSON.stringify(value));
        }

        // ✅ Handle primitive values (strings, numbers)
        else {
          form.append(key, value);
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.close();

        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: result.message || result.error || "An error occurred",
        });

        if (result.error && typeof result.error === 'object') {
          const entries = Object.entries(result.error);
          let focused = false;

          entries.forEach(([key, message]) => {
            setErrors((prev) => ({
              ...prev,
              [key]: message,
            }));

            if (!focused) {
              const tab = getTabByFieldName(key);
              if (tab) setActiveTab(tab);

              setTimeout(() => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) input.focus();
              }, 300);

              focused = true;
            }
          });
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Product Created",
          text: "The Product has been created successfully!",
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            setFormData({});
            router.push("/supplier");
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
    <form onSubmit={handleSubmit}>
      <div className="xl:w-11/12 mt-4 p-6 rounded-2xl bg-white">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
        
          <div>
            <label htmlFor="hsn_code" className="font-bold block uppercase">
              HSN Code
            </label>
            <input
              type="text"
              name="hsn_code"
              value={formData.hsn_code || ''}
              onChange={handleChange}
              className="border border-[#DFEAF2] p-3 mt-2 rounded-md w-full"
            />
          </div>
           <div>
            <label htmlFor="tax_rate" className="font-bold block">
              Tax Rate (GST) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="tax_rate"
              value={formData.tax_rate || ''}
              onChange={handleChange}
              className={`border p-3 mt-2 rounded-md w-full ${error.tax_rate ? 'border-red-500' : 'border-[#DFEAF2]'
                }`}
            />
            {error.tax_rate && <p className="text-red-500 text-sm mt-1">{error.tax_rate}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white md:px-14 py-2 rounded-md px-6"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="bg-[#8F9BBA] text-white md:px-14 py-2 rounded-md px-6"
            onClick={() => router.push('/supplier/product')}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
