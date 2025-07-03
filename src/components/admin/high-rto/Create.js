"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Select from 'react-select';
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
export default function Create() {
  const router = useRouter();
  const [stateLoading, setStateLoading] = useState(null);
  const [cityLoading, setCityLoading] = useState(null);
  const [loading, setLoading] = useState(null);
  const [showBulkForm, setShowBulkForm] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);

  const [formData, setFormData] = useState({
    state: "",
    country: "",
    city: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "country") fetchStateList(value);
    if (name === "state") fetchCity(value);

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const fetchCity = useCallback(async (id) => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.clear();
      router.push("/admin/auth/login");
      return;
    }

    try {
      setCityLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to fetch cities");

      setCityData(result?.cities || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setCityLoading(false);
    }
  }, [router]);

  const fetchStateList = useCallback(async (id) => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.clear();
      router.push("/admin/auth/login");
      return;
    }

    try {
      setStateLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}/states`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || result.error || "Failed to fetch states");

      setStateData(result?.states || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setStateLoading(false);
    }
  }, [router]);

  const fetchCountryAndState = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.clear();
      router.push("/admin/auth/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message ||result.error || "Failed to fetch country list");

      setCountryData(result?.countries || []);
    } catch (err) {
      Swal.fire("Error", err.message , "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCountryAndState();
  }, [fetchCountryAndState]);

  const validate = () => {
    const newErrors = {};
    if (!formData.country) newErrors.country = "Country is required.";
    if (!formData.state) newErrors.state = "State is required.";
    if (!formData.city) newErrors.city = "City is required.";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required.";
    return newErrors;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Safely parse localStorage data
    const dropshipperDataRaw = localStorage.getItem("shippingData");
    if (!dropshipperDataRaw) throw new Error("Session expired. Please log in again.");

    const dropshipperData = JSON.parse(dropshipperDataRaw);
    const token = dropshipperData?.security?.token;

    if (dropshipperData?.project?.active_panel !== "admin" || !token) {
      localStorage.clear();
      router.push("/admin/auth/login");
      return;
    }

    // Validate form inputs
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    Swal.fire({ title: "Creating High RTO...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // Prepare FormData
    const formdata = new FormData();
    formdata.append("city", formData.city);
    formdata.append("country", formData.country);
    formdata.append("state", formData.state);
    formdata.append("pincode", formData.pincode);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/high-rto`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
        // Do NOT set 'Content-Type' when sending FormData
      },
      body: formdata,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || result.error || "Creation failed");
    }

    // Success
    await Swal.fire("High RTO Created", "High RTO has been created successfully!", "success");

    // Reset and redirect
    setFormData({ state: "", country: "", city: "", pincode: "" });
    router.push("/admin/high-rto/list");
  } catch (err) {
    Swal.fire("Error", err.message || "Something went wrong.", "error");
  } finally {
    setLoading(false);
  }
};


  const countryOptions = countryData.map((item) => ({ value: item.id || item._id, label: item.name }));
  const stateOptions = stateData.map((item) => ({ value: item.id || item._id, label: item.name }));
  const cityOptions = cityData.map((item) => ({ value: item.id || item._id, label: item.name }));

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (bulkFile) {
    } else {
      Swal.fire("Please select a file before uploading", "", "warning");
    }
  };
  if (loading) {
            return (
                <div className="flex items-center justify-center h-[80vh]">
                    <HashLoader size={60} color="#F97316" loading={true} />
                </div>
            );
        }

  return (
    <div className="md:w-10/12 p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Add High RTO</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          <div>
            <label className="font-bold block text-[#232323]">Country<span className="text-red-500">*</span></label>
            <Select
              name="country"
              value={countryOptions.find(opt => opt.value === formData.country) || null}
              onChange={(selected) => handleChange({ target: { name: "country", value: selected?.value } })}
              options={countryOptions}
              placeholder="Select Country"
            />
            {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
          </div>

        <div className="relative">
          <label className="font-bold block text-[#232323]">
            State<span className="text-red-500">*</span>
          </label>
          <Select
            name="state"
            value={stateOptions.find(opt => opt.value === formData.state) || null}
            onChange={(selected) =>
              handleChange({ target: { name: "state", value: selected?.value || "" } })
            }
            options={stateOptions}
            isDisabled={stateLoading}
            placeholder="Select State"
            classNamePrefix="react-select"
          />
          {stateLoading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className="border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
            </div>
          )}
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state}</p>
          )}
        </div>


        <div className="relative">
            <label className="font-bold block text-[#232323]">City<span className="text-red-500">*</span></label>
            <Select
              name="city"
              value={cityOptions.find(opt => opt.value === formData.city) || null}
              onChange={(selected) => handleChange({ target: { name: "city", value: selected?.value } })}
              options={cityOptions}
              placeholder="Select City"
              isDisabled={cityLoading}
            />
             {cityLoading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className="border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
            </div>
          )}
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="font-bold block text-[#232323]">Pincode<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3"
            />
            {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white md:px-10 rounded-md p-3 px-3">Save</button>
          <button type="button" className="bg-gray-500 text-white md:px-10 rounded-md p-3 px-3" onClick={() => router.back()}>Cancel</button>
          <button type="button" className="bg-blue-600 text-white md:px-10 rounded-md p-3 px-3" onClick={() => setShowBulkForm(prev => !prev)}>Bulk Upload</button>
        </div>
      </form>

      {showBulkForm && (
        <form onSubmit={handleBulkSubmit} className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium mb-2">Bulk Upload CSV/Excel</h3>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setBulkFile(e.target.files[0])}
            className="border w-full border-[#DFEAF2] rounded-md p-3 mt-2"
          />
          <div className="mt-3">
            <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded-md">Upload File</button>
          </div>
        </form>
      )}
    </div>
  );
}
