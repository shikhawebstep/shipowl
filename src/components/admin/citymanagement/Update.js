"use client"
import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { HashLoader } from 'react-spinners'
import { useAdmin } from '../middleware/AdminMiddleWareContext'
import Select from 'react-select';

export default function Update() {
    const [countryData,setCountryData] = useState([])
    const [stateData,setStateData] = useState([])
    const [formData, setFormData] = useState({
            name: "",
            state: "",
            country: "",
          });
          const countryOptions = countryData?.map((item) => ({
            value: item.id || item._id,
            label: item.name,
          }));
          const stateOptions = stateData?.map((item) => ({
            value: item.id || item._id,
            label: item.name,
          }));
        const searchParams = useSearchParams();
        const id = searchParams.get('id');
        const [validationErrors, setValidationErrors] = useState({});
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

    const { verifyAdminAuth } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        verifyAdminAuth();
    }, [verifyAdminAuth]);

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = ' name is required.';
        if (!formData.state.trim()) errors.gst_number = 'State Id is required.';
        if (!formData.country.trim()) errors.contact_name = 'Country Id is required.';
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const fetchCity = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/city/${id}`,
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
            const countryData = result?.countries || {};
            const stateData = result?.states || {};
            const cityData = result?.city || {};

            setFormData({
                name:cityData?.name || "",
                state:cityData?.stateId || "",
                country:cityData?.countryId|| "",
              });
              setCountryData(countryData)
              setStateData(stateData)
        } catch (error) {
            console.error("Error fetching city:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id]);

    useEffect(() => {
        fetchCity();
    }, [fetchCity]);

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

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        setValidationErrors({});

        try {
            Swal.fire({
                title: 'Updating city...',
                text: 'Please wait while we save your city.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/city/${id}`;
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
                title: "city Updated",
                text: `The city has been updated successfully!`,
                showConfirmButton: true,
            }).then((res) => {
                if (res.isConfirmed) {
                    setFormData({
                        name: '',
                        state: '',
                        countryId: '',
                    });
                    router.push("/admin/city/list");
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    return (
        <section className="add-city xl:w-8/12">
              <form onSubmit={handleSubmit} className="p-4 rounded-md bg-white shadow">
              <div>
            <label className="font-bold block text-[#232323]">Country</label>
            <Select
              name="country"
              value={countryOptions.find((option) => option.value === formData.country)}
              onChange={(selectedOption) =>
                handleChange({ target: { name: 'country', value: selectedOption?.value } })
              }
              options={countryOptions}
              placeholder="Select a country"
              className="mt-1"
              classNamePrefix="react-select"
            />
            {validationErrors.country && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
            )}
          </div>
          <div className="pt-2">
              <label className="font-bold block text-[#232323]">State</label>
                <Select
                           name="stateId"
                           value={stateOptions.find((option) => option.value === formData.stateId)}
                           onChange={(selectedOption) =>
                             handleChange({ target: { name: 'stateId', value: selectedOption?.value } })
                           }
                           options={stateOptions}
                           placeholder="Select a State"
                           className="mt-1"
                           classNamePrefix="react-select"
                         />
              {validationErrors.state && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
              )}
            </div>
          <div className="pt-2">
              <label className="font-bold block text-[#232323]">City</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border w-full border-[#DFEAF2] rounded-md p-3 mt-1"
              />
               
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>
          <div>

        

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 rounded-md p-3"
            >
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
