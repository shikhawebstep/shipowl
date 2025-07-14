
"use client"
import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { HashLoader } from 'react-spinners'
import { useAdmin } from '../middleware/AdminMiddleWareContext'
import Select from 'react-select';

export default function AddWarehouse() {
    const [formData, setFormData] = useState({
        name: '',
        gst_number: '',
        contact_name: '',
        contact_number: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        supplier: '',
    });
    const { verifyAdminAuth,fetchSupplier,suppliers } = useAdmin();
    const [loadingCountry, setLoadingCountry] = useState(false);
    const [loadingState, setLoadingState] = useState(false);
    const [loadingCity, setLoadingCity] = useState(false);

    const [countryData, setCountryData] = useState([]);
    const router = useRouter();

    const [stateData, setStateData] = useState([]);
    const [cityData, setCityData] = useState([]);

    const fetchCity = useCallback(async (id) => {
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
            setLoadingCity(true)
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: result.message || result.error || "Network Error.",
                });
                throw new Error(result.message || result.error || "Something Wrong!");
            }

            setCityData(result?.cities || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoadingCity(false)
        }
    }, [router]);

    const fetchState = useCallback(async (value) => {
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
            setLoadingState(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${value}/states`,
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
                setStateData(result?.states || []);
            }
        } catch (error) {
            console.error("Error fetching state:", error);
        } finally {
            setLoadingState(false);
        }
    }, [router, setStateData]);

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
            setLoadingCountry(true);
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
            setLoadingCountry(false);
        }
    }, [router, setCountryData,]);

    useEffect(() => {
        fetchcountry();
        fetchSupplier();
    }, [fetchcountry]);

    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [files, setFiles] = useState(null); // if needed later

    // Convert your data to react-select format
    const countryOptions = countryData?.map(item => ({ value: item.id, label: item.name })) || [];
    const stateOptions = stateData?.map(item => ({ value: item.id, label: item.name })) || [];
    const cityOptions = cityData?.map(item => ({ value: item.id, label: item.name })) || [];



    useEffect(() => {
        verifyAdminAuth();
    }, [verifyAdminAuth]);

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Warehouse name is required.';
        if (!formData.gst_number.trim()) errors.gst_number = 'GST number is required.';
        if (!formData.contact_name.trim()) errors.contact_name = 'Contact name is required.';
        if (!formData.contact_number.trim()) errors.contact_number = 'Contact number is required.';
        if (!formData.address_line_1.trim()) errors.address_line_1 = 'Address Line 1 is required.';
        if (!formData.city.trim()) errors.city = 'City is required.';
        if (!formData.state.trim()) errors.state = 'State is required.';
        if (!formData.postal_code.trim()) errors.postal_code = 'Postal code is required.';
        if (!formData.country.trim()) errors.country = 'Country code is required.';
        if (!formData.supplier.trim()) errors.supplier = 'Please Select a Supplier.';
        return errors;
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name == "country") {
            fetchState(value)
        }
        if (name == "state") {
            fetchCity(value)
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        if (!adminData?.project?.active_panel === "admin") {
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
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        setValidationErrors({});

        try {
            Swal.fire({
                title: 'Creating Warehouse...',
                text: 'Please wait while we save your warehouse.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const url = "/api/warehouse";

            const form = new FormData();
            for (const key in formData) {
                if (formData[key] !== undefined && formData[key] !== null) {
                    form.append(key, formData[key]);
                }
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // ❌ Don't set Content-Type when using FormData
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
                throw new Error(errorMessage.message || errorMessage.error || "Submission failed");
            }

            const result = await response.json();
            Swal.close();

            if (result) {
                Swal.fire({
                    icon: "success",
                    title: "Warehouse Created",
                    text: `The warehouse has been created successfully!`,
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        setFormData({
                            name: '',
                            gst_number: '',
                            contact_name: '',
                            contact_number: '',
                            address_line_1: '',
                            address_line_2: '',
                            city: '',
                            state: '',
                            postal_code: ''
                        });
                        setFiles(null);
                        router.push("/admin/supplier/warehouse/list");
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
        <section className="add-warehouse xl:w-8/12">
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl p-5">
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                        <div> <label className="font-bold block text-[#232323]">Select Supplier</label>
                            <select onChange={handleChange} name='supplier' className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.supplier ? 'border-red-500' : 'border-[#DFEAF2]'
                                }`}>
                                <option>Select Supplier</option>
                                {suppliers?.map((item, index) => {
                                    return (
                                        <option key={index} value={item.id}>{item.name}</option>
                                    )
                                })}
                            </select>
                            {validationErrors.supplier && <p className="text-red-500 text-sm mt-1">{validationErrors.supplier}</p>}
                        </div>
                        <div>
                            <label className="font-bold block text-[#232323]">
                                Warehouse Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                onChange={handleChange}
                                id="name"
                                name="name"
                                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.name ? 'border-red-500' : 'border-[#DFEAF2]'
                                    }`}
                                placeholder="Charlene Store House"
                            />
                            {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
                        </div>

                        <div>
                            <label className="font-bold block text-[#232323]">
                                Warehouse GST Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                onChange={handleChange}
                                name="gst_number"
                                id="gst_number"
                                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.gst_number ? 'border-red-500' : 'border-[#DFEAF2]'
                                    }`}
                                placeholder="GST289571412"
                            />
                            {validationErrors.gst_number && <p className="text-red-500 text-sm mt-1">{validationErrors.gst_number}</p>}
                        </div>

                        <div>
                            <label className="font-bold block text-[#232323]">
                                Contact Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                onChange={handleChange}
                                name="contact_name"
                                id="contact_name"
                                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.contact_name ? 'border-red-500' : 'border-[#DFEAF2]'
                                    }`}
                                placeholder="Charlene Reed"
                            />
                            {validationErrors.contact_name && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_name}</p>}
                        </div>


                    </div>
                    <div>
                        <label className="font-bold block text-[#232323]">
                            Contact No <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            onChange={handleChange}
                            name="contact_number"
                            id="contact_number"
                            className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.contact_number ? 'border-red-500' : 'border-[#DFEAF2]'
                                }`}
                            placeholder="+9876543210"
                        />
                        {validationErrors.contact_number && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_number}</p>}
                    </div>
                    <div className="mt-3">
                        <label className="font-bold block text-[#232323]">
                            Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="address_line_1"
                            onChange={handleChange}
                            id="address_line_1"
                            className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.address_line_1 ? 'border-red-500' : 'border-[#DFEAF2]'
                                }`}
                            placeholder="San Jose, California, USA"
                        />
                        {validationErrors.address_line_1 && <p className="text-red-500 text-sm mt-1">{validationErrors.address_line_1}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 grid-cols-1 gap-3 mt-3">
                        <div>
                            <label className="font-bold block text-[#232323]">Address Line 2</label>
                            <input
                                type="text"
                                onChange={handleChange}
                                name="address_line_2"
                                id="address_line_2"
                                className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold"
                                placeholder="San Jose, California, USA"
                            />
                        </div>

                        <div>
                            <label className="font-bold block text-[#232323]">
                                Postal Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                onChange={handleChange}
                                name="postal_code"
                                id="postal_code"
                                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.postal_code ? 'border-red-500' : 'border-[#DFEAF2]'
                                    }`}
                                placeholder="45962"
                            />
                            {validationErrors.postal_code && <p className="text-red-500 text-sm mt-1">{validationErrors.postal_code}</p>}
                        </div>

                        <Select
                            name="country"
                            id="country"
                            options={countryOptions}
                            value={countryOptions.find(option => option.value === formData.country) || null}
                            onChange={(selectedOption) =>
                                handleChange({ target: { name: 'country', value: selectedOption.value } })
                            }
                            isLoading={loadingCountry}
                            className="mt-2"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderColor: validationErrors.country ? 'red' : '#DFEAF2',
                                    boxShadow: 'none',
                                    padding: '2px',
                                    fontWeight: 'bold',
                                    color: '#718EBF',
                                }),
                            }}
                        />


                        <Select
                            name="state"
                            id="state"
                            options={stateOptions}
                            value={stateOptions.find(option => option.value === formData.state) || null}
                            onChange={(selectedOption) =>
                                handleChange({ target: { name: 'state', value: selectedOption.value } })
                            }
                            isLoading={loadingState}
                            className="mt-2"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderColor: validationErrors.state ? 'red' : '#DFEAF2',
                                    boxShadow: 'none',
                                    padding: '2px',
                                    fontWeight: 'bold',
                                    color: '#718EBF',
                                }),
                            }}
                        />

                    </div>

                    <Select
                        name="city"
                        id="city"
                        options={cityOptions}
                        value={cityOptions.find(option => option.value === formData.city) || null}
                        onChange={(selectedOption) =>
                            handleChange({ target: { name: 'city', value: selectedOption.value } })
                        }
                        isLoading={loadingCity}
                        className="mt-2"
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: validationErrors.city ? 'red' : '#DFEAF2',
                                boxShadow: 'none',
                                padding: '2px',
                                fontWeight: 'bold',
                                color: '#718EBF',
                            }),
                        }}
                    />



                    <div className="flex flex-wrap gap-3 mt-5">
                        <button type="submit" className="bg-orange-500 text-white md:px-15 rounded-md p-3 px-4">Save</button>
                        <button
                            type="button"
                            className="bg-gray-500 text-white md:px-15 rounded-md p-3 px-4"
                            onClick={() => router.back()}>
                            Cancel
                        </button>
                    </div>
                </div>

            </form>
        </section>
    );
}
