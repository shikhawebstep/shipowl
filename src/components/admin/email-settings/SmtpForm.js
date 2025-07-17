'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import HashLoader from "react-spinners/HashLoader";
import Swal from 'sweetalert2';

export default function SmtpForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(null);
    const [formData, setFormData] = useState({
        smtp_host: "",
        smtp_secure: '',
        smtp_port: 465,
        smtp_username: "",
        smtp_password: "",
        from_email: "",
        from_name: "",
    })



    const fetchSubuser = useCallback(async () => {
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config/smtp`,
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
                        errorMessage.message || errorMessage.error || "Network Error.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const emails = result?.smtp || {};

            setFormData({
                smtp_host: emails.smtp_host || "",
                smtp_secure: emails.smtp_secure || "",
                smtp_port: emails.smtp_port || "",
                smtp_username: emails.smtp_username || "",
                smtp_password: emails.smtp_password || "",
                from_email: emails.from_email || "",
                from_name: emails.from_name || "",
            })

        } catch (error) {
            console.error("Error fetching subuser:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSubuser();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const token = adminData?.security?.token;

        const data = new FormData();
        data.append("smtp_host", "smtp.gmail.com");
        data.append("smtp_secure", formData.smtp_secure); // Boolean: true/false
        data.append("smtp_port", formData.smtp_port);     // e.g., 465, 587, etc.
        data.append("smtp_username", formData.smtp_username); // e.g., rohitwebstep@gmail.com
        data.append("smtp_password", formData.smtp_password); // e.g., app password
        data.append("from_email", formData.from_email);       // e.g., sender's email
        data.append("from_name", formData.from_name);         // e.g., ShipOwl

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config/smtp`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // ⚠️ Do not set Content-Type when using FormData — the browser sets it with boundary
                },
                body: data,
            });


            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to Update admin");

            Swal.fire("Success", "SMTP Updated Successfuly!", "success");

        } catch (err) {
            Swal.fire("Error", err.message, "error");
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
        <>
            <h2 className="text-2xl font-bold text-center my-4">SMTP Configure Form</h2>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">SMTP Host</label>
                            <input
                                type="text"
                                placeholder="smtp.gmail.com"
                                value={formData.smtp_host}
                                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            />
                        </div>

                        {/* SMTP Secure */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">SMTP Secure</label>
                            <select
                                value={formData.smtp_secure}
                                onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.value === 'true' })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>

                        {/* SMTP Port */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">SMTP Port</label>
                            <select
                                value={formData.smtp_port}
                                onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value, 10) })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            >
                                <option value={465}>465</option>
                                <option value={587}>587</option>
                                <option value={940}>940</option>
                            </select>
                        </div>



                        {/* SMTP Username */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">SMTP Username</label>
                            <input
                                type="email"
                                placeholder="your-smtp-email@example.com"
                                value={formData.smtp_username}
                                onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            />
                        </div>

                        {/* SMTP Password */}
                        <div className='col-span-2'>
                            <label className="block mb-1 font-medium text-gray-700">SMTP Password</label>
                            <input
                                type="password"
                                placeholder="SMTP App Password"
                                value={formData.smtp_password}
                                onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            />
                        </div>

                        {/* From Email */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">From Email</label>
                            <input
                                type="email"
                                placeholder="noreply@example.com"
                                value={formData.from_email}
                                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            />
                        </div>

                        {/* From Name */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">From Name</label>
                            <input
                                type="text"
                                placeholder="ShipOwl"
                                value={formData.from_name}
                                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                                className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
