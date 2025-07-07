"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { HashLoader } from 'react-spinners';
import Swal from "sweetalert2";

export default function Update() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const fetchcountry = useCallback(async () => {
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}`,
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
          text: errorMessage.message || "Your session has expired. Please log in again.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const country = result?.country || {};

      setFormData({
        name: country.name || "",
        iso2: country.iso2 || "",
        iso3: country.iso3 || "",
        phonecode: country.phonecode || "",
        currency: country.currency || "",
        currencyName: country.currencyName || "",
        currencySymbol: country.currencySymbol || "",
        nationality: country.nationality || "",
        status: country.status || "active",
      });
    } catch (error) {
      console.error("Error fetching country:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id]);

  useEffect(() => {
    fetchcountry();
  }, [fetchcountry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    setErrors({});

    try {
      Swal.fire({
        title: 'Updating Country...',
        text: 'Please wait while we save your country.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}`;
      const form = new FormData();
      for (const key in formData) {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form,
      });

      if (!response.ok) {
        Swal.close();
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: errorMessage.message || "An error occurred",
        });
        throw new Error(errorMessage.message || "Update failed");
      }

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Country Updated",
        text: `The country has been updated successfully!`,
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
      setErrors({ general: error.message || "Submission failed." });
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
    <div className="p-6 lg:w-10/12 space-y-6">
      <h2 className="text-2xl font-semibold">Country Management</h2>
      <form onSubmit={handleSubmit} className="p-4 rounded-md bg-white shadow space-y-4">
        <div className="md:grid grid-cols-2 gap-4">
          {[
            { label: "Country Name", name: "name", required: true },
            { label: "ISO 2 Code", name: "iso2", required: true },
            { label: "ISO 3 Code", name: "iso3", required: true },
            { label: "Phone Code", name: "phonecode" },
            { label: "Currency", name: "currency", required: true },
            { label: "Currency Name", name: "currencyName", required: true },
            { label: "Currency Symbol", name: "currencySymbol", required: true },
            { label: "Nationality", name: "nationality", required: true },
          ].map(({ label, name, required }) => (
            <div key={name}>
              <label className="block font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={label}
                className="border w-full border-[#DFEAF2] rounded-md p-3 mt-1"
              />
              {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
            </div>
          ))}
        </div>

        <div>
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

        {errors.general && <p className="text-red-500 text-sm mt-2">{errors.general}</p>}

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white px-6 rounded-md p-3">
            Update
          </button>
          <button type="button" className="bg-gray-500 text-white px-6 rounded-md p-3" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
