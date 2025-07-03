"use client"

import { useContext, useEffect, useState } from 'react'
import { BrandContext } from './BrandContext'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSupplier } from '../middleware/SupplierMiddleWareContext'

export default function Create() {
    const router = useRouter();
    const { formData, setFormData } = useContext(BrandContext);
    const [validationErrors, setValidationErrors] = useState({});
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { verifySupplierAuth } = useSupplier();

    useEffect(() => {
        verifySupplierAuth();
    }, [verifySupplierAuth]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? true : false) : value
        }));
    };


    const validate = () => {
        const errors = {};

        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Brand name is required.';
        }
        if (!formData.description || formData.description.trim() === '') {
            errors.description = 'Brand description is required.';
        }
        if (!files || files.length === 0) {
            errors.image = 'At least one brand image is required.';
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
        if (dropshipperData?.project?.active_panel !== "supplier") {
            localStorage.clear("shippingData");
            router.push("/supplier/auth/login");
            return;
        }
    
        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/supplier/auth/login");
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
                title: 'Creating Brand...',
                text: 'Please wait while we save your brand.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
    
            const form = new FormData();
            form.append('name', formData.name);
            form.append('description', formData.description);
            form.append('status', formData.status);
    
            if (files.length > 0) {
                files.forEach((file) => {
                    form.append('image', file); // use 'images[]' if backend expects an array
                });
            }
    
            const url = "/api/admin/brand";
    
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
                    title: "Brand Created",
                    text: `The brand has been created successfully!`,
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        setFormData({ name: '', description: '', image: '' });
                        setFiles([]); // Reset file input state
                        router.push("/supplier/brand/list");
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
        <section className="add-warehouse xl:w-8/12">
            <div className="bg-white rounded-2xl p-5">
                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                        <div>
                            <label htmlFor="name" className="font-bold block text-[#232323]">
                                Brand Name <span className='text-red-500 text-lg'>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData?.name || ''}
                                id="name"
                                onChange={handleChange}
                                className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold  ${validationErrors.name ? "border-red-500" : "border-[#E0E5F2]"
                                    } `} />
                            {validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="font-bold block text-[#232323]">
                                Brand Description <span className='text-red-500 text-lg'>*</span>
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description || ''}
                                id="description"
                                onChange={handleChange}
                                className={`text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold  ${validationErrors.description ? "border-red-500" : "border-[#E0E5F2]"
                                    } `}
                            />
                            {validationErrors.description && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                            )}
                        </div>
                    </div>

                    <div className='mt-2'>
                        <label htmlFor="image" className="font-bold block text-[#232323]">
                            Brand Image <span className='text-red-500 text-lg'>*</span>
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

                        <label className="flex mt-2 items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name='status'
                                className="sr-only"
                                checked={formData.status || ''}
                                onChange={handleChange}
                            />
                            <div
                                className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${formData.status ? "bg-orange-500" : ""
                                    }`}
                            >
                                <div
                                    className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${formData.status ? "translate-x-5" : ""
                                        }`}
                                ></div>
                            </div>
                            <span className="ms-2 text-sm text-gray-600">
                                Status
                            </span>
                        </label>
                        {validationErrors.status && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.status}</p>
                        )}
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
