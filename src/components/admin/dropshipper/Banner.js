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
        image: ""
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
                title: 'Creating Banner...',
                text: 'Please wait while we save your Banner.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            form.append('productUrl', formData.productUrl);

            if (files.length > 0) {
                files.forEach((file) => {
                    form.append('image', file); // use 'images[]' if backend expects an array
                });
            }

            const url = "/api/admin/Banner";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: form,
            });

            const result = await response.json(); // Parse the result here

            if (!response.ok) {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Creation Failed",
                    text: result.message || result.error || "An error occurred",
                });

                if (result.error && typeof result.error === 'object') {
                    const entries = Object.entries(result.error);
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
            } else {
                Swal.close();

                Swal.fire({
                    icon: "success",
                    title: "Banner Created",
                    text: `The Banner has been created successfully!`,
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        setFormData({ productUrl: '', image: '' });
                        setFiles([]); // Reset file input state
                        router.push("/admin/Banner/list");
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
                    </div>
                    <div className="flex flex-wrap gap-3 mt-5">
                        <button type="submit" className="bg-orange-500 text-white px-15 rounded-md p-3">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="bg-gray-500 text-white px-15 rounded-md p-3" onClick={() => router.back()}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
