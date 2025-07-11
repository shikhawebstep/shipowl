'use client';
import { useContext, useState } from 'react';
import { ProductContextEdit } from './ProductContextEdit';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function OtherDetails() {
  const { formData, setFormData, files,setFiles } = useContext(ProductContextEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validateForm = () => {
    const newError = {};



    if (formData.hsn_code && formData.hsn_code.toString().length !== 8) {
      newError.hsn_code = 'HSN Code must be exactly 8 digits long.';
    }

    setError(newError);
    return Object.keys(newError).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
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
        title: 'Updating Product...',
        text: 'Please wait while we update your product.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/product/${id}`;
      const form = new FormData();

      const combinedData = { ...formData, ...files };
      console.log('files(!)_',files)

      for (const key in combinedData) {
        let value = combinedData[key];

        if (value === null || value === undefined || value === '') continue;

        if (key === "isVarientExists") {
          // Convert "yes"/"no" to boolean
          value = value === "yes";
          form.append(key, value);
        } else if (Array.isArray(value) && value[0] instanceof File) {
          // For array of files
          value.forEach((file) => form.append(key, file));
        } else if (value instanceof File) {
          form.append(key, value);
        } else if (Array.isArray(value) || typeof value === 'object') {
          // Objects and arrays (non-files)
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, value);
        }
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const result = await response.json();
      Swal.close();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: result.message || result.error || 'An error occurred',
        });
        Swal.close();

        throw new Error(result.message || result.error || 'Update failed');
        Swal.close();

      }

      Swal.fire({
        icon: 'success',
        title: 'Product Updated',
        text: 'The product has been updated successfully!',
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setFormData({});
          setFiles({});
          router.push('/admin/products/list');
        }
      });
    } catch (err) {
      console.error('Submission Error:', err);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: err.message || 'Something went wrong. Please try again.',
      });
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
              className={`border p-3 mt-2 rounded-md w-full ${error.hsn_code ? 'border-red-500' : 'border-[#DFEAF2]'}`}
            />
            {error.hsn_code && <p className="text-red-500 text-sm mt-1">{error.hsn_code}</p>}
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
            onClick={() => router.push('/admin/product')}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
