"use client";
import { useRouter ,useSearchParams} from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Select from 'react-select';
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
export default function Update() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [showBulkForm, setShowBulkForm] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [pinCode, setPinCode] = useState([]);

  const [formData, setFormData] = useState({
    state: "",
    country: "",
    city: "",
    pincode: "",
  });
 const searchParams = useSearchParams();
  const id = searchParams.get('id');
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
  const fetchPincodes = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));

    if (adminData?.project?.active_panel !== "admin") {
        localStorage.removeItem("shippingData");
        router.push("/admin/auth/login");
        return;
    }

    const admintoken = adminData?.security?.token;
    if (!admintoken) {
        router.push("/admin/auth/login");
        return;
    }

    try {
        setLoading(true);
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}api/high-rto/${id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${admintoken}`,
                },
            }
        );

        if (!response.ok) {
            const errorMessage = await response.json();
            Swal.fire({
                icon: "error",
                title: "Something Wrong!",
                text: errorMessage.message || "Network Error.",
            });
            throw new Error(errorMessage.message);
        }

        const result = await response.json();
        const pinCode = result?.highRto || {};
        if(pinCode?.countryId){
            fetchStateList(pinCode?.countryId);
        }
        if(pinCode?.stateId){
            fetchCity(pinCode?.stateId);
        }

        setFormData({
          state: pinCode?.stateId || "",
          country:pinCode?.countryId|| "",
          city:pinCode?.cityId ||  "",
          pincode: pinCode?.pincode|| "",
          });
          setPinCode(pinCode)
    } catch (error) {
        console.error("Error fetching Company:", error);
    } finally {
        setLoading(false);
    }
}, [router, id]);

  const fetchCity = useCallback(async (id) => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
      router.push("/admin/auth/login");
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [router]);

  const fetchStateList = useCallback(async (id) => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
      router.push("/admin/auth/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}/states`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to fetch states");

      setStateData(result?.states || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchCountryAndState = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
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

      if (!res.ok) throw new Error(result.message || "Failed to fetch country list");

      setCountryData(result?.countries || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPincodes();
    fetchCountryAndState();
  }, [fetchCountryAndState,fetchPincodes]);

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

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    if (dropshipperData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
      router.push("/admin/auth/login");
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      Swal.fire({ title: "Creating High Rto...", allowOutsideClick: false, didOpen: Swal.showLoading });
      const formdata = new FormData();
      formdata.append("city", formData.city);
      formdata.append("country", formData.country);
      formdata.append("state", formData.state);
      formdata.append("pincode", formData.pincode);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/high-rto/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formdata,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || result.error || "Creation failed");

      Swal.fire("Updating...", "Rto has been Updated successfully!", "success").then(() => {
        setFormData({state: "", country: "", city: "", pincode: "" });
        router.push("/admin/high-rto/list");
      });
    } catch (err) {
      Swal.fire("Error", err.message || err.error || "Something went wrong.", "error");
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
      // Upload logic here
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

          <div>
            <label className="font-bold block text-[#232323]">State<span className="text-red-500">*</span></label>
            <Select
              name="state"
              value={stateOptions.find(opt => opt.value === formData.state) || null}
              onChange={(selected) => handleChange({ target: { name: "state", value: selected?.value } })}
              options={stateOptions}
              placeholder="Select State"
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="font-bold block text-[#232323]">City<span className="text-red-500">*</span></label>
            <Select
              name="city"
              value={cityOptions.find(opt => opt.value === formData.city) || null}
              onChange={(selected) => handleChange({ target: { name: "city", value: selected?.value } })}
              options={cityOptions}
              placeholder="Select City"
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="font-bold block text-[#232323]">Pincode<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode || ''}
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
