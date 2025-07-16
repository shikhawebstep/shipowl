"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
// import Select from "react-select";
import { HashLoader } from "react-spinners";
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });
export default function Create() {
  const router = useRouter();
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
    status: "active",
    password: "",
    profilePicture: null,
    phoneNumber: "",
    permanentAddress: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
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

    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle File or Blob directly
        if (value instanceof File || value instanceof Blob) {
          data.append(key, value);
        }
        
        // Handle primitive values (string, number, boolean)
        else {
          data.append(key, value);
        }
      }
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create dropshipper");

      Swal.fire("Success", "dropshipper created Successfuly!", "success");
      // Reset form
      setFormData({
        name: "",

        email: "",
        status: "",
        password: "",
        profilePicture: null,
        phoneNumber: "",
        permanentAddress: "",
        permanentCity: "",
        permanentState: "",
        permanentCountry: "",
      });
      router.push('/dropshipping/sub-user/list')
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProtected = useCallback(async (url, setter, key, setLoading) => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;
    if (!token || dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");;
      router.push("/dropshipping/auth/login");
      return;
    }

    if (setLoading) setLoading(true);

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
  }, [ fetchCountryAndState]);



  const formFields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Email", name: "email", type: "email", required: true },
    { label: "Password", name: "password", type: "password", required: true },
    { label: "Phone Number", name: "phoneNumber", type: "text" },
    { label: "Permanent Address", name: "permanentAddress", type: "text" },
  ];
  if (loading ) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="bg-white lg:p-10 p-3  rounded-2xl">
      {/* <h2 className="text-xl font-semibold">Create Subuser</h2> */}
      <div className="mb-2">
        <label className="block text-[#232323] font-bold mb-1">Profile Picture <span className="text-red-500">*</span></label>
        <input
          type="file"
          name="profilePicture"
          accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
          onChange={handleChange}
          className={`w-full p-3  file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100  border rounded-lg font-bold ${errors.profilePicture ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'}`}
        />
        {errors.profilePicture && <p className="text-red-500 text-sm">{errors.profilePicture}</p>}
      </div>
      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1">
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
            {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        ))}

        {/* Move the Status dropdown outside the loop */}
        <div className="col-span-3">
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
      </div>

      <div className="md:grid lg:grid-cols-3 md:grid-cols-2 gap-4 grid-cols-1 mt-3">
        {["permanentCountry", "permanentState", "permanentCity"].map((field) => (
          <div key={field} className="relative">
            <label className="block text-[#232323] font-bold mb-1 capitalize">
              {field.replace("permanent", "")} <span className="text-red-500">*</span>
            </label>

            <Select
              isDisabled={
                (field === "permanentCountry" && loadingCountries) ||
                (field === "permanentState" && loadingStates) ||
                (field === "permanentCity" && loadingCities)
              }
              name={field}
              value={selectOptions(
                field === "permanentCountry" ? countryData :
                  field === "permanentState" ? stateData :
                    cityData
              ).find((item) => item.value === formData[field])}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";

                setFormData((prev) => ({ ...prev, [field]: value }));

                if (field === "permanentCountry") {
                  fetchStateList(value); // <-- call with selected country ID
                }
                if (field === "permanentState") {
                  fetchCity(value); // <-- call with selected country ID
                }
              }}

              options={selectOptions(
                field === "permanentCountry" ? countryData :
                  field === "permanentState" ? stateData :
                    cityData
              )}
              isClearable
            />

            {((field === "permanentCountry" && loadingCountries) ||
              (field === "permanentState" && loadingStates) ||
              (field === "permanentCity" && loadingCities)) && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                </div>
              )}

            {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
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
    </form>
  );
}
