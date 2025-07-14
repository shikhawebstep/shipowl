"use client"
import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { HashLoader } from 'react-spinners'
import { useAdmin } from '../middleware/AdminMiddleWareContext'
import Select from 'react-select';

export default function Update() {
    const [companyData,setcompanyData] = useState([])
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        website: "",
        email: "",
        rtoCharges:"",
        flatShippingRate:"",
        phoneNumber: "",
        status: "",
    })
           
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { verifyAdminAuth } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        verifyAdminAuth();
    }, [verifyAdminAuth]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const fetchCompany = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/courier-company/${id}`,
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
            const companyData = result?.courierCompany || {};

            setFormData({
                name:companyData?.name || "",
                code: companyData?.code || "",
                website:companyData?.website || "",
                email:companyData?.email || "",
                phoneNumber:companyData?.phoneNumber|| "",
                rtoCharges:companyData?.rtoCharges || "",
                flatShippingRate:companyData?.flatShippingRate || "",
                status: companyData?.status || "active",
              });
              setcompanyData(companyData)
        } catch (error) {
            console.error("Error fetching Company:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id]);

    useEffect(() => {
        fetchCompany();
    }, [fetchCompany]);
    const inputClass = (field) =>
        `text-[#718EBF] border w-full rounded-md p-3 mt-2 ${
          errors[field] ? "border-red-500" : "border-[#DFEAF2]"
        }`;
    
      const Label = ({ htmlFor, children, required }) => (
        <label className="block font-medium">
          {children} {required && <span className="text-red-500">*</span>}
        </label>
      );
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        if (adminData?.project?.active_panel !== "admin") {
            localStorage.clear("shippingData");
            router.push("/admin/auth/login");
            return;
        }

        const token = adminData?.security?.token;
        if (!token) {
            router.push("/admin/auth/login");
            return;
        }

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            setLoading(false);
            return;
        }

        setErrors({});

        try {
            Swal.fire({
                title: 'Updating Company...',
                text: 'Please wait while we save your Company.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/courier-company/${id}`;
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
                title:  "Company Updated",
                text: `The Company has been updated successfully!`,
                showConfirmButton: true,
            }).then((res) => {
                if (res.isConfirmed) {
                    setFormData({
                        name: "",
                        code: "",
                        website: "",
                        email: "",
                        rtoCharges:"",
                        flatShippingRate:"",
                        phoneNumber: "",
                        status: "",
                    });
                    router.push("/admin/courier/list");
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
            setErrors(error.message || "Submission failed.");
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
        <section className="add Company bg-white p-3 rounded-md xl:w-8/12">
        <h2 className="text-xl font-semibold mb-4">Update Courier Company</h2>
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
            Update
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
        </section>
    );
}
