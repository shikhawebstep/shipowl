"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Create() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    iso2: "",
    iso3: "",
    phonecode: "",
    currency: "",
    currencyName: "",
    currencySymbol: "",
    nationality: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Country name is required.";
    if (!formData.iso2.trim()) newErrors.iso2 = "ISO 2 code is required.";
    if (!formData.iso3.trim()) newErrors.iso3 = "ISO 3 code is required.";
    if (!formData.currency.trim()) newErrors.currency = "Currency is required.";
    if (!formData.currencyName.trim()) newErrors.currencyName = "Currency name is required.";
    if (!formData.currencySymbol.trim()) newErrors.currencySymbol = "Currency symbol is required.";
    if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "admin") {
      localStorage.clear();
      router.push("/admin/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});

    try {
      Swal.fire({
        title: "Creating country...",
        text: "Please wait while we save your country.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const form = new FormData();
      for (const key in formData) {
        form.append(key, formData[key]);
      }

      const url = "/api/location/country";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
        throw new Error(errorMessage.message || "Submission failed");
      }

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Country Created",
        text: "The country has been created successfully!",
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setFormData({
            name: "",
            iso2: "",
            iso3: "",
            phonecode: "",
            currency: "",
            currencyName: "",
            currencySymbol: "",
            nationality: "",
            status: "active",
          });
          router.push("/admin/country/list");
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
      setError(error.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };
  
   

  return (
    <div className="p-6 lg:w-10/12 space-y-6">
      <h2 className="text-2xl font-semibold">Country Management</h2>
      <form onSubmit={handleSubmit} className="p-4 rounded-md bg-white shadow">
        <div className="space-y-4 gap-2 grid grid-cols-2">
          {[
            { name: "name", label: "Country Name" },
            { name: "iso2", label: "ISO 2 Code" },
            { name: "iso3", label: "ISO 3 Code" },
            { name: "phonecode", label: "Form Code" },
            { name: "currency", label: "Currency" },
            { name: "currencyName", label: "Currency Name" },
            { name: "currencySymbol", label: "Currency Symbol" },
            { name: "nationality", label: "Nationality" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block font-medium">
                {label} {!["phonecode"].includes(name) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name={name}
                placeholder={label}
                value={formData[name]}
                onChange={handleChange}
                className="border w-full border-[#DFEAF2] rounded-md p-3 mt-1"
              />
              {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <label className="block font-medium">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border w-full border-[#DFEAF2] rounded-md p-3 mt-1"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white px-6 rounded-md p-3">
            Save
          </button>
          <button
            type="button"
            className="bg-gray-500 text-white px-6 rounded-md p-3"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
