"use client"

import { useState } from 'react';
import { FiMail, FiPhone, FiBriefcase, FiMapPin, FiUser, FiX } from 'react-icons/fi';

export default function Profile() {
    const [admin, setAdmin] = useState({
        name: 'Rajeev Kapoor',
        email: 'rajeev@dropshiphub.com',
        phone: '+91 9876543210',
        role: 'Super Admin',
        company: 'Dropship Hub Pvt. Ltd.',
        location: 'New Delhi, India',
    });

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(admin);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        setAdmin(formData);
        setShowModal(false);
    };

    return (
        <div className=" pt-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                        Admin Profile
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Manage your account information and preferences
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl font-bold shadow">
                            <FiUser size={36} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800">{admin.name}</h2>
                            <p className="text-sm text-gray-500">{admin.role}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                        {[
                            {
                                label: 'Email',
                                value: admin.email,
                                icon: <FiMail size={20} />,
                                color: 'bg-orange-100 text-orange-600',
                            },
                            {
                                label: 'Phone',
                                value: admin.phone,
                                icon: <FiPhone size={20} />,
                                color: 'bg-green-100 text-green-600',
                            },
                            {
                                label: 'Company',
                                value: admin.company,
                                icon: <FiBriefcase size={20} />,
                                color: 'bg-yellow-100 text-yellow-600',
                            },
                            {
                                label: 'Location',
                                value: admin.location,
                                icon: <FiMapPin size={20} />,
                                color: 'bg-pink-100 text-pink-600',
                            },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl shadow-sm bg-white"
                            >
                                <div className={`p-2 rounded-full ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">{item.label}</p>
                                    <p className="font-semibold">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Action */}
                    <div className="mt-8 text-right">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-orange-600 text-white px-6 py-2 text-sm rounded-lg shadow hover:bg-orange-700 transition"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Model */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowModal(false)}
                        >
                            <FiX size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Profile</h2>

                        <div className="space-y-4">
                            {['name', 'email', 'phone', 'company', 'location'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-600 capitalize mb-1">
                                        {field}
                                    </label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            ))}

                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={handleSave}
                                className="bg-orange-600 text-white px-5 py-2 text-sm rounded hover:bg-orange-700 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
