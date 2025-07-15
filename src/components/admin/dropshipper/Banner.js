"use client"

import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useAdmin } from '../middleware/AdminMiddleWareContext';

export default function Banner() {
    const router = useRouter();
    const [validationErrors, setValidationErrors] = useState({});
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { verifyAdminAuth } = useAdmin();
    const [formData, setFormData] = useState({
        productUrl: '',
        image: "",
        status: '',
    });


    useEffect(() => {
        verifyAdminAuth();
    }, [verifyAdminAuth]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? true : false) : value
        }));
    };


    const validate = () => {
        const errors = {};

        if (!formData.productUrl || formData.productUrl.trim() === '') {
            errors.productUrl = 'Product Url is required.';
        }

        if (!files || files.length === 0) {
            errors.image = 'At least one Banner image is required.';
        }

        return errors;
    };


    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };



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

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        setValidationErrors({});

        try {
            Swal.fire({
                title: 'Creating Banner...',
                text: 'Please wait while we save your Banner.',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            form.append('url', formData.productUrl);
            form.append('status', String(formData.status));

            if (files.length > 0) {
                files.forEach((file) => {
                    form.append('image', file);
                });
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/Banner`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: form,
            });

            const contentType = response.headers.get("content-type");
            const result = contentType?.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(result?.message || result?.error || "Upload failed.");
            }

            Swal.close();
            Swal.fire({
                icon: "success",
                title: "Banner Created",
                text: `The Banner has been created successfully!`,
                showConfirmButton: true,
            }).then((res) => {
                if (res.isConfirmed) {
                    setFormData({ productUrl: '', image: '', status: false });
                    setFiles([]);
                    router.push("/admin/Banner/list");
                }
            });

        } catch (error) {
            console.error("Error:", error);
            Swal.close();

            // Show error message
            Swal.fire({
                icon: "error",
                title: "Submission Error",
                text: error.message || "Something went wrong. Please try again.",
            });

            // Handle field-specific errors if available
            if (error?.response?.error && typeof error.response.error === 'object') {
                const entries = Object.entries(error.response.error);
                let focused = false;

                entries.forEach(([key, message]) => {
                    setValidationErrors((prev) => ({
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

            setError(error.message || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };




    return (
        <section className=" xl:w-8/12">
            <div className="bg-white rounded-2xl p-5">
                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-3">


                        <div className=''>
                            <label htmlFor="image" className="font-bold block text-[#232323]">
                                Banner Image <span className='text-red-500 text-lg'>*</span>
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                name="image"
                                multiple
                                id="image"
                                className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold  ${validationErrors.image ? "border-red-500" : "border-[#E0E5F2]"
                                    } `} />

                            {validationErrors.image && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.image}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="productUrl" className="font-bold block text-[#232323]">
                                Product Url<span className='text-red-500 text-lg'>*</span>
                            </label>
                            <input
                                type="text"
                                name="productUrl"
                                value={formData?.productUrl || ''}
                                id="name"
                                onChange={handleChange}
                                className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold  ${validationErrors.productUrl ? "border-red-500" : "border-[#E0E5F2]"
                                    } `} />
                            {validationErrors.productUrl && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.productUrl}</p>
                            )}
                        </div>
                        <div className="mt-2 col-span-2">
                            <label htmlFor="status" className="font-bold block text-[#232323]">
                                Status
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    name="status"
                                    id="status"
                                    checked={formData.status}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <label htmlFor="status" className="text-sm text-[#718EBF]">
                                    Active
                                </label>
                            </div>
                        </div>

                    </div>
                    <div className="flex flex-wrap gap-3 mt-5">
                        <button type="submit" className="bg-orange-500 text-white md:px-15 rounded-md p-3 px-4">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="bg-gray-500 text-white md:px-15 rounded-md p-3 px-4" onClick={() => router.back()}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
