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
  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    permanentPostalCode: "",
    password: "",
    status: "active",
    profilePicture: null,
    referralCode: "",
    phoneNumber: "",
    website: "",
    permanentAddress: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === "profilePicture" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: type === "file" ? files[0] : value,
      })); setImagePreview(URL.createObjectURL(file)); // Set preview
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name == "permanentCountry") {
      fetchStateList(value);
    }
    if (name == "permanentState") {
      fetchCity(value);
    }
  };



  const validate = () => {
    const newErrors = {};
    const {
      name,
      email,
      password,
      profilePicture,
      permanentCountry,
      permanentState,
      permanentCity,
      permanentPostalCode,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password.trim()) newErrors.password = "Password is required";
    if (!profilePicture) newErrors.profilePicture = "Profile picture is required";
    if (!permanentCountry) newErrors.permanentCountry = "Country is required";
    if (!permanentState) newErrors.permanentState = "State is required";
    if (!permanentCity) newErrors.permanentCity = "City is required";
    if (!permanentPostalCode) newErrors.permanentPostalCode = "permanentPostalCode is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Inside handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== "") {
        if (key === "profilePicture") {
          data.append("profilePicture", formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      }
    }



    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/auth/registration`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create dropshipper");

      Swal.fire({
        title: "Success",
        text: "Dropshipper Registered Successfully!",
        icon: "success",
        confirmButtonText: "Go to Login",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/dropshipping/auth/login');
        }
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        status: "",
        profilePicture: null,
        referralCode: "",
        phoneNumber: "",
        website: "",
        permanentAddress: "",
        permanentCity: "",
        permanentState: "",
        permanentCountry: "",
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }

  };
  const fetchProtected = useCallback(async (url, setter, key, setLoading) => {
    if (setLoading) setLoading(true);

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || `Failed to fetch ${key}`);
      setter(result[key] || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [router]);

  const fetchCountryAndState = useCallback(() => {
    fetchProtected(
      "/api/location/country",
      setCountryData,
      "countries",
      setLoadingCountries
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

  const selectOptions = (data) =>
    data.map((item) => ({
      value: item.id || item._id,
      label: item.name,
    }));

  useEffect(() => {
    fetchCountryAndState();
  }, [, fetchCountryAndState]);



  const formFields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Email", name: "email", type: "email", required: true },
    { label: "Phone Number", name: "phoneNumber", type: "text" },
    { label: "Password", name: "password", type: "password", required: true },
    { label: "Website", name: "website", type: "text" },
    { label: "Referral Code", name: "referralCode", type: "text" },
  ];
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
      className="max-w-5xl mx-auto p-8 bg-white rounded-xl space-y-8 border border-gray-100"
    >
      {/* <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Register</h2> */}

      <div className=" gap-8">
        {/* Left: Profile Picture */}
        <div className="">
          {/* <h3 className="text-lg font-semibold text-gray-700  pb-2">Profile Photo</h3> */}

          <div className="w-full space-y-3">
            <label className="block text-[#232323] font-bold mb-1">
              Upload Profile Picture <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={handleChange}
              className={`w-full p-3  file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100  border rounded-lg font-bold ${errors.profilePicture ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors.profilePicture && (
              <p className="text-red-500 text-sm">{errors.profilePicture}</p>
            )}

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="rounded-md border border-gray-200  w-48 h-48 object-cover"
                />
              </div>
            )}
          </div>
        </div>


        {/* Right: Form Fields */}
        <div className="">
          {/* Basic Info */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-orange-600  pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formFields.map(({ label, name, type, required }) => (
                <div key={name}>
                  <label className="block text-[#232323] font-bold mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg font-bold ${errors[name] ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                      }`}
                  />
                  {errors[name] && (
                    <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Address Info */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-orange-600  pb-2">Permanent Address</h3>

            <div>
              <label className="block text-[#232323] font-bold mb-1 ">Street Address</label>
              <input
                type="text"
                name="permanentAddress"
                value={formData.permanentAddress || ''}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]`} />
            </div>

            <div>
              <label className="block text-[#232323] font-bold mb-1 ">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="permanentPostalCode"
                value={formData.permanentPostalCode || ''}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg font-bold ${errors.permanentPostalCode ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                  }`}
              />
              {errors.permanentPostalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.permanentPostalCode}</p>
              )}
            </div>

            {/* Country, State, City */}
            <div className="grid grid-cols-1 mt-3 sm:grid-cols-3 gap-6">
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
                    <label className="block text-[#232323] font-bold mb-1 capitalize">
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
                      isClearable
                      classNamePrefix="react-select"
                    />
                    {loading && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
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
      </div>
      <div className="">
        <label className="block text-[#232323] font-bold mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status || ''}
          onChange={handleChange}
          className={`w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]
                }`}          >
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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

  );
}
