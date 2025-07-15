'use client';

import { useContext, useState } from 'react';
import { ProfileEditContext } from './ProfileEditContext';
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const AccountInfo = () => {
  const { formData, setFormData, files } = useContext(ProfileEditContext);
  const [errors, setErrors] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();


  const id = searchParams.get("id");
  const handleChange = (index, e) => {
    const { name, value, files } = e.target;
    const updatedAccounts = [...formData.bankAccounts];
    updatedAccounts[index][name] = files ? files[0] : value; // Handle files or text input
    setFormData({ ...formData, bankAccounts: updatedAccounts });

    const updatedErrors = [...errors];
    if (value || files?.length) {
      if (updatedErrors[index]) updatedErrors[index][name] = '';
    }
    setErrors(updatedErrors);
  };

  const handleFileChange = (event, index) => {
    const file = event.target.files[0];
    if (file) {
      const updatedAccounts = [...formData.bankAccounts];
      const imageKey = 'cancelledChequeImage';

      if (!updatedAccounts[index][imageKey]) {
        updatedAccounts[index][imageKey] = [];
      }

      updatedAccounts[index][imageKey].push(file); // Add new file to the array
      setFormData({ ...formData, bankAccounts: updatedAccounts });
    }
  };

  const handleImageDelete = async (index, type, id) => {
    setLoading(true);

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
        didOpen: () => {
          Swal.showLoading();
        }
      });




    

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/${formData.id}/company/${id}/image/${index}?type=${type}`;
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
          text: errorMessage.message || errorMessage.error || "An error occurred",
        });
        throw new Error(errorMessage.message || errorMessage.error || "Submission failed");
      }

      const result = await response.json();
      Swal.close();

      if (result) {
        Swal.fire({
          icon: "success",
          title: "Image Deleted",
          text: `The image has been deleted successfully!`,
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            
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
    } finally {
      setLoading(false);
    }
  };
  const validate = () => {
    const newErrors = formData.bankAccounts.map(account => {
      const accountErrors = {};
      for (let field in account) {
        if (!account[field]) {
          accountErrors[field] = 'This field is required';
        }
      }
      return accountErrors;
    });

    setErrors(newErrors);
    return newErrors.every(err => Object.keys(err).length === 0);
  };



  const handleSubmit = async (e) => {
    if (validate()) {
      e.preventDefault();
      setLoading(true);

      const adminData = JSON.parse(localStorage.getItem("shippingData"));
      if (!adminData?.project?.active_panel === "admin") {
        localStorage.removeItem("shippingData");
        router.push("/admin/auth/login");
        return;
      }

      const token = adminData?.security?.token;
      if (!token) {
        router.push("/admin/auth/login");
        return;
      }

      try {
        Swal.fire({
          title: 'Creating Supplier...',
          text: 'Please wait while we save your Supplier.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/${id}`; // Ensure the URL is correct
        const form = new FormData();
        for (const key in files) {
          const value = files[key];

          // Skip null, undefined, or empty values
          if (value === null || value === undefined || value === '') continue;

          // Special handling for file inputs
          if (['panCardImage', 'gstDocument', 'additionalDocumentUpload', 'documentImage', 'aadharCardImage', 'profilePicture'].includes(key)) {
            if (Array.isArray(value)) {
              // Append each file in the array
              value.forEach(file => {
                form.append(key, file, file.name);
              });
            } else if (value instanceof File) {
              // Single file input
              form.append(key, value, value.name);
            }
          }
        }
        for (const key in formData) {
          const value = formData[key];
          if (value === null || value === undefined || value === '') continue;
          if (['panCardImage', 'gstDocument', 'additionalDocumentUpload', 'documentImage', 'aadharCardImage', 'profilePicture'].includes(key)) {
            continue;
          }

          else if (key === 'bankAccounts') {
            value.forEach((bank, bankIndex) => {
              const file = bank['cancelledChequeImage'];
              const fileNameWithIndex = `cancelledChequeImage${bankIndex}`;

              if (Array.isArray(file)) {
                // Append each file in the array
                file.forEach(fileItem => {
                  form.append(fileNameWithIndex, fileItem, fileItem.name);
                });
              } else if (file instanceof File) {
                // Single file input
                form.append(fileNameWithIndex, file, file.name);
              }
            });
            form.append('bankAccounts', JSON.stringify(value));
          }
          // ✅ Other arrays
          else if (Array.isArray(value)) {
            form.append(key, JSON.stringify(value));
          }

          // ✅ Objects
          else if (typeof value === 'object') {
            form.append(key, JSON.stringify(value));
          }

          // ✅ Strings, numbers
          else {
            form.append(key, value);
          }
        }

        const response = await fetch(url, {
          method: "PUT", // Use POST for creating the resource
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: form,
        });

        if (!response.ok) {
          Swal.close();
          const errorMessage = await response.json();
          Swal.fire({
            icon: "error",
            title: "Creation Failed",
            text: errorMessage.message || errorMessage.error || "An error occurred",
          });
          throw new Error(errorMessage.message || errorMessage.error || "Submission failed");
        }

        const result = await response.json();
        Swal.close();

        if (result) {
          Swal.fire({
            icon: "success",
            title: "Updated",
            text: `Supplier has been Updated successfully!`,
            showConfirmButton: true,
          }).then((res) => {
            if (res.isConfirmed) {
              setFormData({});
              router.push("/admin/supplier/list");
            }
          });
        }
        router.push("/admin/supplier/list");

      } catch (error) {
        console.error("Error:", error);
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Submission Error",
          text: error.message || "Something went wrong. Please try again.",
        });
        setErrors(error.message || "Submission failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white lg:p-10 p-3 rounded-tr-none rounded-tl-none rounded-2xl">
      {formData.bankAccounts.map((account, index) => (
        <div key={index} className="grid lg:grid-cols-3 items-center border p-3 rounded-md mb-3 gap-4 py-5">
          {/* Form Fields for Account Info */}
          {[
            ['Account Holder Name', 'accountHolderName'],
            ['Account Number', 'accountNumber'],
            ['Bank Name', 'bankName'],
            ['Bank Branch', 'bankBranch'],
            ['IFSC Code', 'ifscCode'],
          ].map(([label, name]) => (
            <div key={name}>
              <label className="block text-[#232323] font-bold mb-1">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name={name}
                value={account[name]}
                onChange={(e) => handleChange(index, e)}
                className={`w-full p-3 border rounded-lg font-bold ${errors[index]?.[name]
                    ? 'border-red-500 text-red-500'
                    : 'border-[#DFEAF2] text-[#718EBF]'
                  }`}
              />
              {errors[index]?.[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[index][name]}</p>
              )}
            </div>
          ))}

          {/* Account Type Select */}
          <div>
            <label className="block text-[#232323] font-bold mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="accountType"
              value={account.accountType}
              onChange={(e) => handleChange(index, e)}
              className={`w-full p-3 border rounded-lg font-bold ${errors[index]?.accountType
                  ? 'border-red-500 text-red-500'
                  : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            >
              <option value="">Select Type</option>
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
              <option value="Business">Business</option>
            </select>
            {errors[index]?.accountType && (
              <p className="text-red-500 text-sm mt-1">{errors[index].accountType}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[#232323] font-bold mb-1">Upload Cancelled Cheque Image</label>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileChange(e, index)}
              className="w-full p-3 border rounded-lg font-bold"
            />

            {account.cancelledChequeImage && (
              <Swiper navigation modules={[Navigation]} spaceBetween={10} slidesPerView={3}>
                {(
                  Array.isArray(account.cancelledChequeImage)
                    ? account.cancelledChequeImage
                    : account.cancelledChequeImage.split(',')
                ).map((img, imgIndex) => (
                  <SwiperSlide key={imgIndex}>
                    <div className="relative">
                      <Image

                        src={`https://placehold.co/600x400?text=${index + 1}`}
                        alt={`Cheque Image ${imgIndex}`}
                        width={100}
                        height={100}
                        className="object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(index, 'cancelledChequeImage', account.id)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full"
                      >
                        X
                      </button>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

        
        </div>
      ))}

    
      <div className="flex pt-4">
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-8 py-3 text-white font-bold bg-[#1D84C6] rounded-md"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default AccountInfo;
