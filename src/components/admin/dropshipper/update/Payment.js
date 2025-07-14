'use client';

import { useContext, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { HashLoader } from 'react-spinners';
import { DropshipperProfileContext } from '../DropshipperProfileContext';

const Payment = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { formData, setFormData, fetchSupplier, files, setFiles, setActiveTab } = useContext(DropshipperProfileContext);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (name, e) => {
    const { value, files: selectedFiles } = e.target;

    if (['panCardImage', 'aadharCardImage', 'gstDocument'].includes(name)) {
      if (selectedFiles?.length > 0) {
        setFiles((prev) => ({
          ...prev,
          [name]: Array.from(selectedFiles),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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

  const handleImageDelete = async (index, type) => {
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (!dropshipperData?.security?.token) {
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

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/${formData.id}/company/${formData.companyid}/image/${index}?type=${type}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${dropshipperData.security.token}` },
      });

      Swal.close();

      if (!response.ok) {
        const error = await response.json();
        Swal.fire("Error", error.message || "Image deletion failed", "error");
        return;
      }

      Swal.fire("Deleted", "Image has been deleted.", "success");

      const updatedImages = (formData[type] || '')
        .split(',')
        .filter((_, i) => i !== index)
        .join(',');

      setFormData((prev) => ({
        ...prev,
        [type]: updatedImages,
      }));

      fetchSupplier();
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Updating Dropshipper...',
        text: 'Please wait while we save your changes.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/${id}`;
      const form = new FormData();

      for (const key in files) {
        const value = files[key];
        if (value && Array.isArray(value)) {
          value.forEach((file) => {
            form.append(key, file, file.name);
          });
        }
      }

      for (const key in formData) {
        const value = formData[key];
        if (['panCardImage', 'gstDocument', 'aadharCardImage', 'profilePicture'].includes(key)) continue;
        form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      Swal.close();

      if (!response.ok) {
        const error = await response.json();
        Swal.fire("Error", error.message || "Update failed", "error");
        return;
      }

      Swal.fire("Success", "Dropshipper updated successfully!", "success").then(() => {
        setFormData({});
        router.push("/admin/dropshipper/list");
      });

      setActiveTab("account_details");
    } catch (err) {
      Swal.fire("Error", err.message || "Submission failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" />
      </div>
    );
  }

  return (
    <div className="bg-white lg:p-10 p-3 rounded-2xl rounded-tl-none rounded-tr-none">
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
              onChange={(e) => handleChange(name, e)}
              className={`w-full p-3 border rounded-lg font-bold ${
                errors[name] ? 'border-red-500' : 'border-[#DFEAF2]'
              } text-[#718EBF]`}
            />
            {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
          </div>
        ))}

        {['panCardImage', 'aadharCardImage', 'gstDocument'].map((name) => (
          <div key={name} className="mb-6 w-full overflow-auto">
            <label className="block text-[#232323] font-bold mb-1 capitalize">
              {name.replace(/([A-Z])/g, ' $1')} Upload
            </label>
            <input
              type="file"
              name={name}
              multiple
              onChange={(e) => handleChange(name, e)}
              className="w-full p-3 border rounded-lg border-[#DFEAF2] text-[#718EBF] font-bold"
            />

            {formData[name]?.length > 0 && (
              <div className="flex gap-3 overflow-x-auto mt-3">
                {formData[name].split(',').map((img, index) => (
                  <div key={index} className="relative min-w-[200px]">
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                      onClick={() => {
                        Swal.fire({
                          title: 'Are you sure?',
                          text: `Do you want to delete this image?`,
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#d33',
                          cancelButtonColor: '#3085d6',
                          confirmButtonText: 'Yes, delete it!',
                        }).then((res) => {
                          if (res.isConfirmed) handleImageDelete(index, name);
                        });
                      }}
                    >
                      ✕
                    </button>
                    <Image
                      src={img.trim()}
                      alt={`Image ${index + 1}`}
                      width={200}
                      height={200}
                      className="p-2 object-cover rounded border border-[#DFEAF2]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
