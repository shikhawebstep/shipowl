'use client';

import React, { useState, useCallback } from 'react';
import Select from 'react-select';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FileWarning } from "lucide-react";
import Swal from 'sweetalert2';
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
    ssr: false,
});

const awbOptions = [
    { value: 'AWB123456', label: 'AWB123456' },
    { value: 'AWB654321', label: 'AWB654321' },
    { value: 'AWB111222', label: 'AWB111222' },
];

export default function Complaint() {
    const [formData, setFormData] = useState({
        awbs: [],
        proofFiles: [],
        description: '',
    });
    const [awbNumbers, setAwbNumbers] = useState([]);
    const [loading, setLoading] = useState(null);

    const [errors, setErrors] = useState({
        awbs: '',
        proofFiles: '',
        description: '',
    });

    const router = useRouter();

    const fetchAwbNumbers = useCallback(async () => {
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }
        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/awb`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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

            setAwbNumbers(result?.awbs || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleAWBChange = (selectedOptions) => {
        setFormData((prev) => ({
            ...prev,
            awbs: selectedOptions,
        }));
        setErrors((prev) => ({ ...prev, awbs: '' }));
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            proofFiles: Array.from(e.target.files),
        }));
        setErrors((prev) => ({ ...prev, proofFiles: '' }));
    };

    const handleDescriptionChange = (content) => {
        setFormData((prev) => ({
            ...prev,
            description: content,
        }));
        setErrors((prev) => ({ ...prev, description: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let valid = true;
        let newErrors = {
            awbs: '',
            proofFiles: '',
            description: '',
        };

        if (formData.awbs.length === 0) {
            newErrors.awbs = 'Please select at least one AWB number.';
            valid = false;
        }

        if (formData.proofFiles.length === 0) {
            newErrors.proofFiles = 'Please upload at least one image or video.';
            valid = false;
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required.';
            valid = false;
        }

        setErrors(newErrors);
        if (!valid) return;

        Swal.fire({
            title: 'Submitting...',
            text: 'Please wait while we raise your ticket.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            Swal.close();
            Swal.fire('Session Expired', 'Please log in again.', 'warning');
            router.push("/dropshipping/auth/login");
            return;
        }

        const dropshippertoken = dropshipperData?.security?.token;
        if (!dropshippertoken) {
            Swal.close();
            Swal.fire('Token Missing', 'Authentication token not found. Please login again.', 'error');
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            const formdata = new FormData();
            const awbValues = formData.awbs.map(item => item.value).join(',');
            formdata.append("orders", awbValues);
            formdata.append("description", formData.description);
            formdata.append("gallery", file); // If multiple files, loop and append individually.

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/raise-ticket`, {
                method: "POST",
                body: formdata,
                headers: {
                    Authorization: `Bearer ${dropshippertoken}`
                }
            });

            const result = await response.json(); // Assuming server returns JSON

            Swal.close();

            if (response.ok) {
                Swal.fire('Success', 'Your ticket has been raised successfully.', 'success');
                // Optionally reset the form here
            } else {
                Swal.fire('Error', result?.message || result?.error || 'Something went wrong.', 'error');
            }

        } catch (error) {
            Swal.close();
            Swal.fire('Error', 'Network or server error occurred.', 'error');
            console.error(error);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 mt-4 pb-2">
                <FileWarning className="w-6 h-6 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-800">
                    Raise Ticket / Complaint
                </h1>
            </div>

            <p className="text-sm text-gray-600 mb-6">
                Select AWB numbers, upload proof, and describe the issue to submit a complaint.
            </p>

            <form onSubmit={handleSubmit} className="md:w-7/12 p-6 bg-white rounded-lg shadow space-y-6 border border-gray-200">

                <div>
                    <label className="block text-gray-800 font-semibold mb-2 border-l-4 border-blue-500 pl-2">
                        Select AWB Numbers <span className="text-red-500">*</span>
                    </label>
                    <div className={` rounded ${errors.awbs ? 'border-red-500 border' : ''} `}>
                        <Select
                            options={awbOptions}
                            isMulti
                            value={formData.awbs}
                            onChange={handleAWBChange}
                            className="text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>
                    {errors.awbs && <p className="text-red-500 text-sm mt-1">{errors.awbs}</p>}
                </div>

                {formData.awbs.length > 0 && (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200 text-sm text-blue-800">
                        <strong>Selected:</strong> {formData.awbs.map((awb) => awb.label).join(', ')}
                    </div>
                )}

                <div>
                    <label className="block text-gray-800 font-semibold mb-2 border-l-4 border-green-500 pl-2">
                        Upload Proof (Images or Videos) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileChange}
                        className={`block w-full text-sm border rounded p-3  ${errors.proofFiles ? 'border-red-500 ring-red-500' : 'border-gray-300 '}`}
                    />
                    {errors.proofFiles && <p className="text-red-500 text-sm mt-1">{errors.proofFiles}</p>}
                    <div className="grid md:grid-cols-4 gap-4 flex-wrap mt-3">
                        {formData.proofFiles.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                                <div key={idx} className="w-full p-2 relative border border-gray-300 rounded overflow-hidden shadow-sm">
                                    {file.type.startsWith('image') ? (
                                        <img src={url} alt="proof" className="object-cover w-full h-full" />
                                    ) : (
                                        <video src={url} className="w-full h-full" controls />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-gray-800 font-semibold mb-2 border-l-4 border-purple-500 pl-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <div className={`rounded overflow-hidden  ${errors.description ? 'border-red-500 border' : ''} focus-within:ring-1 focus-within:ring-purple-500`}>
                        <Editor
                            apiKey="frnlhul2sjabyse5v4xtgnphkcgjxm316p0r37ojfop0ux83"
                            value={formData.description}
                            onEditorChange={handleDescriptionChange}
                            init={{
                                height: 300,
                                menubar: false,
                                plugins: [
                                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                                    'image', 'link', 'lists', 'media', 'searchreplace', 'table',
                                    'visualblocks', 'wordcount'
                                ],
                                toolbar:
                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
                                    'link image media table | align lineheight | checklist numlist bullist indent outdent | removeformat',
                            }}
                        />
                    </div>
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div className="flex space-x-4 mt-6">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
}
