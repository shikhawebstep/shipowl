'use client';

import {useState } from 'react';
import BankAccountList from './BankAccountList';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

const AccountInfo = () => {
  const [accountErrors, setAccountErrors] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState(
    {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      bankBranch: "",
      accountType: "",
      ifscCode: "",
      cancelledChequeImage: [],
    },
  );
const handleChange = (e) => {
  const { name, type, value, checked, files } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: type === 'file' ? Array.from(files) : type === 'checkbox' ? checked : value,
  }));
};



  const validate = () => {
    const accountErrors = {};
    for (let field in formData) {
      const val = formData[field];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        accountErrors[field] = 'This field is required';
      }
    }

    setAccountErrors(accountErrors);
    return Object.keys(accountErrors).length === 0;
  };



 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setLoading(true);

  const adminData = JSON.parse(localStorage.getItem("shippingData"));
  if (adminData?.project?.active_panel !== "admin") {
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
      title: 'Submitting...',
      text: 'Please wait while we save the bank account.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const url = "/api/supplier/profile/bank-account/change-request";
    const form = new FormData();

    for (const key in formData) {
      if (key === "cancelledChequeImage") {
        formData.cancelledChequeImage.forEach((file) => {
          form.append(`cancelledChequeImage`, file);
        });
      } else {
        form.append(`${key}`, formData[key]);
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const result = await response.json();

    if (!response.ok) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: result.message || result.error || "An error occurred",
      });
      throw new Error(result.message || result.error || "Submission failed");
    }

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Bank Account Updated",
      text: "The bank account has been updated successfully!",
      showConfirmButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        setFormData({
          accountHolderName: "",
          accountNumber: "",
          bankName: "",
          bankBranch: "",
          accountType: "",
          ifscCode: "",
          cancelledChequeImage: [],
        });
        router.push("/admin/supplier/list");
      }
    });

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


  return (
    <div className="bg-white lg:p-10 p-3 rounded-tr-none rounded-tl-none rounded-2xl">
     <div className="grid lg:grid-cols-3 grid-cols-1 gap-4 py-5">
  {/* Account Holder Name */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      Account Holder Name <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="accountHolderName"
      value={formData.accountHolderName}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.accountHolderName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.accountHolderName && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.accountHolderName}</p>
    )}
  </div>

  {/* Account Number */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      Account Number <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="accountNumber"
      value={formData.accountNumber}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.accountNumber ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.accountNumber && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.accountNumber}</p>
    )}
  </div>

  {/* Bank Name */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      Bank Name <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="bankName"
      value={formData.bankName}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.bankName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.bankName && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.bankName}</p>
    )}
  </div>

  {/* Bank Branch */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      Bank Branch <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="bankBranch"
      value={formData.bankBranch}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.bankBranch ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.bankBranch && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.bankBranch}</p>
    )}
  </div>

  {/* IFSC Code */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      IFSC Code <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="ifscCode"
      value={formData.ifscCode}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.ifscCode ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.ifscCode && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.ifscCode}</p>
    )}
  </div>

  {/* Account Type */}
  <div>
    <label className="block text-[#232323] font-bold mb-1">
      Account Type <span className="text-red-500">*</span>
    </label>
    <select
      name="accountType"
      value={formData.accountType}
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.accountType ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    >
      <option value="">Select Type</option>
      <option value="Savings">Savings</option>
      <option value="Current">Current</option>
      <option value="Business">Business</option>
    </select>
    {accountErrors.accountType && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.accountType}</p>
    )}
  </div>

  {/* Cancelled Cheque Image */}
  <div className="col-span-3">
    <label className="block text-[#232323] font-bold mb-1">
      Cancelled Cheque Image
    </label>
    <input
      type="file"
      name="cancelledChequeImage"
      multiple
      onChange={handleChange}
      className={`w-full p-3 border rounded-lg font-bold ${
        accountErrors.cancelledChequeImage ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
      }`}
    />
    {accountErrors.cancelledChequeImage && (
      <p className="text-red-500 text-sm mt-1">{accountErrors.cancelledChequeImage}</p>
    )}
  </div>
</div>


      <div className="flex space-x-4 mt-6">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button className="px-4 py-2 bg-gray-400 text-white rounded-lg">Cancel</button>
      </div>

      <BankAccountList />
    </div>
  );
};

export default AccountInfo;
