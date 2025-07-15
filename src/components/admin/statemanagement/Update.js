"use client";
import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from "next/navigation";
import { HashLoader } from "react-spinners";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import Select from 'react-select';

export default function Update() {
  const [formData, setFormData] = useState({
    name: "",
    iso2: "",
    country: "",
    type: "",
  });

  const [countryData, setCountryData] = useState([]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { verifyAdminAuth } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    verifyAdminAuth();
  }, [verifyAdminAuth]);
  const countryOptions = countryData.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "State name is required.";
    if (!formData.iso2.trim()) errors.iso2 = "ISO 2 code is required.";
    if (!formData.country.trim()) errors.country = "Country ID is required.";
    if (!formData.type.trim()) errors.type = "Type is required.";
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchState = useCallback(async () => {
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}`,
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
      const state = result?.state || {};

      setFormData({
        name: state.name || "",
        iso2: state.iso2 || "",
        country: state.countryId|| "",
        type: state.type || "",
      });
    } catch (error) {
      console.error("Error fetching state:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const fetchCountries = useCallback(async () => {
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`,
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
          text: errorMessage.error || errorMessage.message || "Your session has expired.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      setCountryData(result?.countries || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  }, [router]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const token = adminData?.security?.token;

    if (adminData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
      router.push("/admin/auth/login");
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      setValidationErrors({});
      Swal.fire({
        title: "Updating state...",
        text: "Please wait while we save your state.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const form = new FormData();
      for (const key in formData) {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      Swal.close();

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: errorMessage.message || "An error occurred",
        });
        throw new Error(errorMessage.message);
      }

      Swal.fire({
        icon: "success",
        title: "State Updated",
        text: "The state has been updated successfully!",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/admin/state/list");
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong.",
      });
      setError(error.message);
    } finally {
      setLoading(false);
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
    <section className="add-state xl:w-8/12">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl p-5">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            <div>
              <label className="font-bold block text-[#232323]">State Name</label>
              <input
                type="text"
                onChange={handleChange}
                value={formData.name}
                name="name"
                className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3  font-bold"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <label className="font-bold block text-[#232323]">ISO 2 Code</label>
              <input
                type="text"
                onChange={handleChange}
                value={formData.iso2}
                name="iso2"
                className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 font-bold"
              />
              {validationErrors.iso2 && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.iso2}</p>
              )}
            </div>
            <div>
              <label className="font-bold block text-[#232323]">Country</label>
              <Select
                   name="country"
                   value={countryOptions.find(opt => opt.value === formData.country) || null}
                   onChange={(selected) => handleChange({ target: { name: "country", value: selected?.value } })}
                   options={countryOptions}
                   placeholder="Select Country"
                  
                 />
              {validationErrors.country && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
              )}
            </div>
            <div>
              <label className="font-bold block text-[#232323]">Type</label>
              <input
                type="text"
                onChange={handleChange}
                value={formData.type}
                name="type"
                className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3  font-bold"
              />
              {validationErrors.type && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.type}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button type="submit" className="bg-orange-500 text-white px-6 rounded-md p-3">
              Update
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-6 rounded-md p-3"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
