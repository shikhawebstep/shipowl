"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
// import Select from "react-select";
import { HashLoader } from "react-spinners";
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });
export default function Register() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countryData, setCountryData] = useState([]);
  const [states, setStates] = useState([]);
  const [city, setCity] = useState([]);
  const [country, setCountry] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [billingStateLoading, setBillingStateLoading] = useState(false);
  const [billingCityLoading, setBillingCityLoading] = useState(false);
  const [billingCountryLoading, setBillingCountryLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    currentAddress: "",
    permanentAddress: "",
    permanentPostalCode: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
    companyName: "",
    brandName: "",
    billingAddress: "",
    billingPincode: "",
    billingState: "",
    billingCity: "",
    profilePicture: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === "profilePicture" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "permanentCountry") {
      fetchStateList(value);
    }
    if (name === "permanentState") {
      fetchCity(value);
    }
    if (name === "billingState") {
      fetchCity(value);
    }
  };

  const validate = () => {
    const newErrors = {};
    const {
      name,
      username,
      email,
      password,
      currentAddress,
      permanentAddress,
      permanentPostalCode,
      permanentCity,
      permanentState,
      permanentCountry,
      companyName,
      brandName,
      billingAddress,
      billingPincode,
      billingState,
      billingCity,
      profilePicture,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!username.trim()) newErrors.username = "Username is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password.trim()) newErrors.password = "Password is required";
    if (!currentAddress.trim()) newErrors.currentAddress = "Current Address is required";
    if (!permanentAddress.trim()) newErrors.permanentAddress = "Permanent Address is required";
    if (!permanentPostalCode.trim()) newErrors.permanentPostalCode = "Postal Code is required";
    if (!permanentCity) newErrors.permanentCity = "City is required";
    if (!permanentState) newErrors.permanentState = "State is required";
    if (!permanentCountry) newErrors.permanentCountry = "Country is required";
    if (!companyName.trim()) newErrors.companyName = "Company Name is required";
    if (!brandName.trim()) newErrors.brandName = "Brand Name is required";
    if (!billingAddress.trim()) newErrors.billingAddress = "Billing Address is required";
    if (!billingPincode.trim()) newErrors.billingPincode = "Billing Pincode is required";
    if (!billingState.trim()) newErrors.billingState = "Billing State is required";
    if (!billingCity.trim()) newErrors.billingCity = "Billing City is required";
    if (!profilePicture) newErrors.profilePicture = "Profile picture is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    const data = new FormData();

    for (const key in formData) {
    if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/auth/registration`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || "Failed to create supplier");

      Swal.fire({
        title: "Success",
        text: "Supplier Registered Successfully!",
        icon: "success",
        confirmButtonText: "Go to Login",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/supplier/auth/login");
        }
      });

      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        currentAddress: "",
        permanentAddress: "",
        permanentPostalCode: "",
        permanentCity: "",
        permanentState: "",
        permanentCountry: "",
        companyName: "",
        brandName: "",
        billingAddress: "",
        billingPincode: "",
        billingState: "",
        billingCity: "",
        profilePicture: null,
      });
      setImagePreview(null);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const fetchProtected = useCallback(async (url, setter, key, setLoadingFn) => {
    if (setLoadingFn) setLoadingFn(true);
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || `Failed to fetch ${key}`);

      // ✅ handle missing key gracefully
      setter(result[key] || []);
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    } finally {
      if (setLoadingFn) setLoadingFn(false);
    }
  }, []);

  const fetchCountryAndState = useCallback(() => {
    fetchProtected(
      "/api/location/country",
      setCountryData,
      "countries",             // ✅ make sure backend response uses this key
      setLoadingCountries
    );
  }, [fetchProtected]);

  const fetchState = useCallback((countryId) => {
    fetchProtected(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${countryId}/states`,
      setStates,
      "states",         // ⚠️ verify that your API returns a `billingstates` key
      setBillingStateLoading
    );
  }, [fetchProtected]);

  const fetchStateList = useCallback((countryId) => {
    fetchProtected(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${countryId}/states`,
      setStateData,
      "states",
      setLoadingStates
    );
  }, [fetchProtected]);

  const fetchCity = useCallback((stateId) => {
    fetchProtected(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${stateId}/cities`,
      setCityData,
      "cities",
      setLoadingCities
    );
  }, [fetchProtected]);

  const fetchCity2 = useCallback((stateId) => {
    fetchProtected(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${stateId}/cities`,
      setCity,
      "cities",               // ⚠️ This key must match your API response structure
      setBillingCityLoading
    );
  }, [fetchProtected]);
  const fetchContry2 = useCallback(() => {
    fetchProtected(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`,
      setCountry,
      "countries",               // ⚠️ This key must match your API response structure
      setBillingCountryLoading
    );
  }, [fetchProtected]);


  const selectOptions = (data) =>
    data.map((item) => ({
      value: item.id || item._id,
      label: item.name,
    }));

  useEffect(() => {
    fetchCountryAndState();
    fetchContry2();
  }, [fetchCountryAndState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="md:w-8/12 mx-auto p-8 bg-white rounded-xl space-y-8 border border-gray-100"
    >
      {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Create an Account</h2> */}
      <div className="">
        <h3 className="block text-[#232323] font-bold mb-1" htmlFor="name">
              Profile Photo <span className="text-red-600">*</span></h3>

        <div className="w-full space-y-3">
          <label
            htmlFor="profilePicture"
            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-orange-500 transition"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-full mb-2"
              />
            ) : (
              <span className="text-gray-500">Click to upload profile picture</span>
            )}
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
              onChange={handleChange}
              className="hidden"
            />
          </label>
          {errors.profilePicture && (
            <p className="text-red-600 text-sm">{errors.profilePicture}</p>
          )}
        </div>
      </div>
      <div className="  gap-8">
        {/* Left: Profile Picture */}


        {/* Basic Info */}
        <h3 className="text-sm text-orange-500 font-bold mb-3">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="name">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.name ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="username">
              Username <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.username ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.username && <p className="text-red-600 text-sm">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="email">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.email ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="block text-[#232323] font-bold mb-1" htmlFor="password">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.password ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
          </div>

         
         

          <div className="md:col-span-3">
            <label className="block text-[#232323] font-bold mb-1" htmlFor="currentAddress">
              Current Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="currentAddress"
              name="currentAddress"
              value={formData.currentAddress || ''}
              onChange={handleChange}
              rows={2}
              className={`w-full p-3 border rounded-lg font-bold ${errors.currentAddress ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.currentAddress && (
              <p className="text-red-600 text-sm">{errors.currentAddress}</p>
            )}
          </div>
        </div>

        {/* Permanent Address */}
        <div className=" ">
          <h3 className="text-sm text-orange-500 font-bold mb-3">Permanent Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="">
              <label
                className="block text-[#232323] font-bold mb-1"
                htmlFor="permanentAddress"
              >
                Address <span className="text-red-600">*</span>
              </label>
              <textarea
                id="permanentAddress"
                name="permanentAddress"
                value={formData.permanentAddress || ''}
                onChange={handleChange}
                rows={1}
                className={`w-full p-3 border rounded-lg font-bold ${errors.permanentAddress ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                  }`}
              />
              {errors.permanentAddress && (
                <p className="text-red-600 text-sm">{errors.permanentAddress}</p>
              )}
            </div>

            <div className="">
              <label
                htmlFor="permanentPostalCode"
                className="block text-[#232323] font-bold mb-1"
              >
                Postal Code <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="permanentPostalCode"
                name="permanentPostalCode"
                value={formData.permanentPostalCode || ''}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg font-bold ${errors.permanentPostalCode ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                  }`}
              />
              {errors.permanentPostalCode && (
                <p className="text-red-600 text-sm">{errors.permanentPostalCode}</p>
              )}
            </div>


          </div>
          <div className="grid lg:grid-cols-3  gap-3">
            {['permanentCountry', 'permanentState', 'permanentCity'].map((field) => {
              const loading =
                (field === 'permanentCountry' && loadingCountries) ||
                (field === 'permanentState' && loadingStates) ||
                (field === 'permanentCity' && loadingCities);

              const options = selectOptions(
                field === 'permanentCountry'
                  ? countryData
                  : field === 'permanentState'
                    ? stateData
                    : cityData
              );

              return (
                <div key={field} className="relative">
                  <label className="block text-[#232323] font-bold mb-1">
                    {field.replace('permanent', '')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isDisabled={loading}
                    name={field}
                    value={options.find((item) => item.value === formData[field]) || ''}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData((prev) => ({ ...prev, [field]: value }));

                      if (field === 'permanentCountry') fetchStateList(value);
                      if (field === 'permanentState') fetchCity(value);
                    }}
                    options={options}

                    classNamePrefix="react-select"
                  />
                  {loading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <div className="loader -transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {errors[field] && (
                    <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>


      </div>
      <div>
        <h3 className="text-sm mb-3 font-bold text-orange-500">Company & Brand Information</h3>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="companyName">
              Company Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.companyName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.companyName && (
              <p className="text-red-600 text-sm">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="brandName">
              Brand Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="brandName"
              name="brandName"
              value={formData.brandName || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.brandName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.brandName && (
              <p className="text-red-600 text-sm">{errors.brandName}</p>
            )}
          </div>

        
        </div>
      </div>
      <div className=" ">
        <h3 className="text-sm mb-3 font-bold text-orange-500">Billing Address</h3>

        <div className=" gap-2">
          <div className="md:col-span-2">
            <label className="block text-[#232323] font-bold mb-1" htmlFor="billingAddress">
              Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              value={formData.billingAddress || ''}
              onChange={handleChange}
              rows={2}
              className={`w-full p-3 border rounded-lg font-bold ${errors.billingAddress ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.billingAddress && (
              <p className="text-red-600 text-sm">{errors.billingAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-[#232323] font-bold mb-1" htmlFor="billingPincode">
              Pincode <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="billingPincode"
              name="billingPincode"
              value={formData.billingPincode || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors.billingPincode ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.billingPincode && (
              <p className="text-red-600 text-sm">{errors.billingPincode}</p>
            )}
          </div>

          <div className="grid grid-cols-1 mt-3 sm:grid-cols-3 gap-6">
            {['billingCountry', 'billingState', 'billingCity'].map((field) => {
              const loading =
                (field === 'billingCountry' && billingCountryLoading) ||
                (field === 'billingState' && billingStateLoading) ||
                (field === 'billingCity' && billingCityLoading);
              const options = selectOptions(
                field === 'billingCountry'
                  ? country
                  : field === 'billingState'
                    ? states
                    : city
              );

              return (
                <div key={field} className="relative">
                  <label className="block text-[#232323] font-bold mb-1">
                    {field.replace('billing', '')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isDisabled={loading}
                    name={field}
                    value={options.find((item) => item.value === formData[field]) || ''}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData((prev) => ({ ...prev, [field]: value }));

                      if (field === 'billingCountry') fetchState(value);
                      if (field === 'billingState') fetchCity2(value);
                    }}
                    options={options}
                    classNamePrefix="react-select"
                  />
                  {loading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <div className="loader -transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {errors[field] && (
                    <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                  )}
                </div>
              );
            })}
          </div>


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
    </form>
  )
}