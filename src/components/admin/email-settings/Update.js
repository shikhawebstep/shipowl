'use client';
import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from "next/navigation";
import HashLoader from "react-spinners/HashLoader";
import Swal from 'sweetalert2';
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
    ssr: false,
});
export default function Update() {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(null);
    const [fromEmailVariables, setFromEmailVariables] = useState({});
    const [toMails, setToMails] = useState([{ name: '', email: '' }]);
    const [ccMails, setCcMails] = useState([{ name: '', email: '' }]);
    const [bccMails, setBccMails] = useState([{ name: '', email: '' }]);
    const [formData, setFormData] = useState({
        subject: "",
    })
    const handleEditorChange = (value) => {
        setDescription(value);
    };

    const handleAddField = (type) => {
        const setter = getSetter(type);
        setter((prev) => [...prev, { name: '', email: '' }]);
    };

    const handleRemoveField = (type, index) => {
        const setter = getSetter(type);
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (type, index, field, value) => {
        const setter = getSetter(type);
        setter((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const searchParams = useSearchParams();
    const id = searchParams.get('id');

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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config/${id}`,
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
                        errorMessage.message || "Network Error.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const emails = result?.emailConfig || {};

            // Prefill fields
            setStatus(emails.status || 'Inactive');
            setDescription(emails.html_template || '');
            setFormData({
                subject: emails.subject || "",
            })
            setFromEmailVariables(emails.variables)
            setToMails(() => {
                const raw = emails.to || emails.toMails || '[]';
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return Array.isArray(parsed) && parsed.length > 0
                        ? parsed.map(({ name = '', email = '' }) => ({ name, email }))
                        : [{ name: '', email: '' }];
                } catch {
                    return [{ name: '', email: '' }];
                }
            });

            setCcMails(() => {
                const raw = emails.cc || emails.ccMails || '[]';
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return Array.isArray(parsed) && parsed.length > 0
                        ? parsed.map(({ name = '', email = '' }) => ({ name, email }))
                        : [{ name: '', email: '' }];
                } catch {
                    return [{ name: '', email: '' }];
                }
            });

            setBccMails(() => {
                const raw = emails.bcc || emails.bccMails || '[]';
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return Array.isArray(parsed) && parsed.length > 0
                        ? parsed.map(({ name = '', email = '' }) => ({ name, email }))
                        : [{ name: '', email: '' }];
                } catch {
                    return [{ name: '', email: '' }];
                }
            });



        } catch (error) {
            console.error("Error fetching subuser:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id]);

    const getSetter = (type) => {
        switch (type) {
            case 'to': return setToMails;
            case 'cc': return setCcMails;
            case 'bcc': return setBccMails;
            default: return () => { };
        }
    };
    useEffect(() => {
        fetchSubuser();
    }, [])


    const handleSubmit = async (e) => {
        e.preventDefault();


        setLoading(true);
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const token = adminData?.security?.token;

        const data = new FormData();

        const safeStringify = (value) => {
            return typeof value === 'string' ? value : JSON.stringify(value);
        };

        data.append("html_template", description);
        data.append("status", status);
        data.append("subject", formData.subject);
        data.append("to", safeStringify(toMails.filter(({ name, email }) => name || email)));
        data.append("cc", safeStringify(ccMails.filter(({ name, email }) => name || email)));
        data.append("bcc", safeStringify(bccMails.filter(({ name, email }) => name || email)));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/email-config/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // ⚠️ Do not set Content-Type when using FormData — the browser sets it with boundary
                },
                body: data,
            });


            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to Update admin");

            Swal.fire("Success", "admin Updated Successfuly!", "success");

            setStatus('Active');
            setToMails([{ name: '', email: '' }]);
            setCcMails([{ name: '', email: '' }]);
            setBccMails([{ name: '', email: '' }]);

            router.push('/admin/email-settings/template')
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };
    const renderDynamicFields = (type, label, data) => (
        <div>
            <label className="block text-[#232323] font-bold mb-1 capitalize">{label}</label>
            {data.map((entry, index) => (
                <div key={index} className="flex gap-2 mb-2">
                    <input
                        type="text"
                        placeholder="Name"
                        value={entry.name}
                        onChange={(e) => handleChange(type, index, 'name', e.target.value)}
                        className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={entry.email}
                        onChange={(e) => handleChange(type, index, 'email', e.target.value)}
                        className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                    />
                    {index > 0 && (
                        <button
                            type="button"
                            onClick={() => handleRemoveField(type, index)}
                            className="text-red-600 font-bold"
                        >
                            &times;
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={() => handleAddField(type)}
                className="text-blue-600 hover:underline"
            >
                + Add {label}
            </button>
        </div>
    );
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
    return (
        <>
            <h2 className="text-2xl font-bold text-center my-4">Email Settings Form</h2>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Description */}
                    <div className="mt-4">
                        <label className="block text-[#232323] font-bold mb-1 capitalize">
                            Description
                        </label>


                        <Editor
                            apiKey="frnlhul2sjabyse5v4xtgnphkcgjxm316p0r37ojfop0ux83"
                            value={description}
                            onEditorChange={(content) => handleEditorChange(content)}
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
                                    'link image media table mergetags | addcomment showcomments | ' +
                                    'spellcheckdialog a11ycheck typography | align lineheight | ' +
                                    'checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                tinycomments_mode: 'embedded',
                                tinycomments_author: 'Author name',
                                mergetags_list: [
                                    { value: 'First.Name', title: 'First Name' },
                                    { value: 'Email', title: 'Email' },
                                ],
                                ai_request: (request, respondWith) =>
                                    respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
                            }}
                        />

                    </div>
                    <div className="mt-8 p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">From Email – Available Variables</h3>
                        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                            {Object.entries(fromEmailVariables).map(([variable, description]) => (
                                <li key={variable}>
                                    <code className="text-orange-600 font-mono">{variable}</code> – {description}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Subject</label>
                        <input
                            type="text"
                            placeholder="Email Subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#232323] font-bold mb-1 capitalize">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* To Mails */}
                    {renderDynamicFields('to', 'To Mails', toMails)}

                    {/* CC Mails */}
                    {renderDynamicFields('cc', 'CC Mails', ccMails)}

                    {/* BCC Mails */}
                    {renderDynamicFields('bcc', 'BCC Mails', bccMails)}


                    {/* Submit */}
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
