"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAdmin } from "../middleware/AdminMiddleWareContext";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
export default function Create() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    website: "",
    email: "",
    phoneNumber: "",
    rtoCharges:"",
    flatShippingRate:"",
    status: "active",
  });


  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(null);
  const {verifyAdminAuth} = useAdmin();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Courier name is required.";
    if (!formData.flatShippingRate.trim()) newErrors.flatShippingRate = "This Field is required.";
    if (!formData.rtoCharges.trim()) newErrors.rtoCharges = "This Field is required.";
    if (!formData.code.trim()) newErrors.code = "Courier code is required.";
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website))
      newErrors.website = "Enter a valid website URL.";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email address.";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required.";
    return newErrors;
  };

   useEffect(()=>{
    verifyAdminAuth();
   },[verifyAdminAuth])

   const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }
  
    const token = dropshipperData?.security?.token;
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
  
    setErrors({}); // clear any previous errors
  
    try {
      Swal.fire({
        title: 'Creating Company...',
        text: 'Please wait while we save your Company.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      const form = new FormData();
  
      // Append all formData key-value pairs
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
  
     
  
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/courier-company`;
  
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
          title: "Creation Failed",
          text: result.message || result.error || "An error occurred",
        });
  
        if (result.error && typeof result.error === "object") {
          const entries = Object.entries(result.error);
          let focused = false;
  
          entries.forEach(([key, message]) => {
            setErrors((prev) => ({
              ...prev,
              [key]: message,
            }));
  
            if (!focused) {
              setTimeout(() => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) input.focus();
              }, 300);
  
              focused = true;
            }
          });
        }
      } else {
        Swal.close();
        Swal.fire({
          icon: "success",
          title: "Company Created",
          text: `The Company has been created successfully!`,
          showConfirmButton: true,
        }).then((res) => {
          router.push("/admin/courier/list/");
          if (res.isConfirmed) {
            setFormData({
              name: "",
              code: "",
              website: "",
              email: "",
              phoneNumber: "",
              rtoCharges:"",
              flatShippingRate:"",
              status: "active",
            });
          }
        });
      }
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
  

  const inputClass = (field) =>
    `text-[#718EBF] border w-full rounded-md p-3 mt-2 ${
      errors[field] ? "border-red-500" : "border-[#DFEAF2]"
    }`;

  const Label = ({ htmlFor, children, required }) => (
    <label className="block font-medium">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
   if (loading) {
          return (
              <div className="flex items-center justify-center h-[80vh]">
                  <HashLoader size={60} color="#F97316" loading={true} />
              </div>
          );
      }

  return (
    <div className="md:w-10/12 p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Add Courier Company</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
          <div>
            <Label htmlFor="name" required>Courier Name</Label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={inputClass("name")}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="code" required>Courier Code</Label>
            <input
              type="text"
              name="code"
              value={formData.code || ''}
              onChange={handleChange}
              className={inputClass("code")}
            />
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className={inputClass("website")}
              placeholder="https://"
            />
            {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}
          </div>

          <div>
            <Label htmlFor="email">Contact Email</Label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={inputClass("email")}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phoneNumber" required>Contact Number</Label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className={inputClass("phoneNumber")}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
          </div>
          <div>
            <Label htmlFor="flatShippingRate" required>Flat Shipping Rate</Label>
            <input
              type="number"
              name="flatShippingRate"
              value={formData.flatShippingRate || ''}
              onChange={handleChange}
              className={inputClass("flatShippingRate")}
            />
            {errors.flatShippingRate && <p className="text-red-500 text-sm">{errors.flatShippingRate}</p>}
          </div>
          <div>
            <Label htmlFor="rtoCharges" required>RTO charges</Label>
            <input
              type="number"
              name="rtoCharges"
              value={formData.rtoCharges || ''}
              onChange={handleChange}
              className={inputClass("rtoCharges")}
            />
            {errors.rtoCharges && <p className="text-red-500 text-sm">{errors.rtoCharges}</p>}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
              className={inputClass("status")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white md:px-15 rounded-md p-3 px-4">
            Save
          </button>
          <button
            type="button"
            className="bg-gray-500 text-white md:px-15 rounded-md p-3 px-4"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
