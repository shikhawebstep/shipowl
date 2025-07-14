"use client";

import { useEffect, useState,useCallback } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import Select from 'react-select';

export default function Create() {
  const router = useRouter();
  const { verifyAdminAuth } = useAdmin();

  const [validationErrors, setValidationErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    iso2: "",
    country: "",
    type: "",
  });

  useEffect(() => {
    verifyAdminAuth();
  }, [verifyAdminAuth]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "State name is required.";
    if (!formData.iso2.trim()) errors.iso2 = "ISO 2 code is required.";
    if (!formData.country.trim()) errors.country = "Country ID is required.";
    if (!formData.type.trim()) errors.type = "Type is required.";
    return errors;
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
                      text:
                          errorMessage.error ||
                          errorMessage.message ||
                          "Network Error.",
                  });
                  throw new Error(
                      errorMessage.message || errorMessage.error || "Something Wrong!"
                  );
              }
  
              const result = await response.json();
              if (result) {
                  setCountryData(result?.countries || []);
              }
          } catch (error) {
              console.error("Error fetching categories:", error);
          } finally {
              setLoading(false);
          }
      }, [router, setCountryData]);
  useEffect(()=>{
    fetchcountry();
  },[fetchcountry]);
  const countryOptions = countryData.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (!dropshipperData?.project?.active_panel === "admin") {
      localStorage.clear("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    setValidationErrors({});

    try {
      Swal.fire({
        title: "Creating state...",
        text: "Please wait while we save your state.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const form = new FormData();
      for (const key in formData) {
        form.append(key, formData[key]);
      }
      files.forEach((file) => {
        form.append("image", file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      Swal.close();

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: errorMessage.message || errorMessage.error || "An error occurred",
        });
        return;
      }

      const result = await response.json();
      if (result) {
        Swal.fire({
          icon: "success",
          title: "State Created",
          text: "The state has been created successfully!",
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            setFormData({
              name: "",
              iso2: "",
              country: "",
              type: "",
            });
            setFiles([]);
            router.push("/admin/state/list");
          }
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="add-warehouse xl:w-8/12">
      <div className="bg-white rounded-2xl p-5">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            {[
              { label: "State Name", name: "name" },
              { label: "ISO 2 Code", name: "iso2" },
              { label: "Type", name: "type" },
            ].map(({ label, name }) => (
              <div key={name}>
                <label htmlFor={name} className="font-bold block text-[#232323]">
                  {label} <span className="text-red-500 text-lg">*</span>
                </label>
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  id={name}
                  onChange={handleChange}
                  className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 font-bold ${
                    validationErrors.type? "border-red-500" : "border-[#E0E5F2]"
                  }`}
                />
                {validationErrors.type&& (
                  <p className="text-red-500 text-sm mt-1">{validationErrors[name]}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block font-medium">Country</label>
               <Select
                   name="country"
                   value={countryOptions.find(opt => opt.value === formData.country) || null}
                   onChange={(selected) => handleChange({ target: { name: "country", value: selected?.value } })}
                   options={countryOptions}
                   placeholder="Select Country"
                  
                 />
            </div>
           
        </div>
          

          <div className="flex flex-wrap gap-3 mt-5">
            <button type="submit" className="bg-orange-500 text-white px-6 rounded-md p-3">
            Save
            </button>
            <button type="button" className="bg-gray-500 text-white px-6 rounded-md p-3" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
