'use client';

import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { HashLoader } from 'react-spinners';
const AccountInfoEdit = () => {
    const [accountErrors, setAccountErrors] = useState([{}]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState(
        {
            accountHolderName: "",
            accountNumber: "",
            bankName: "",
            bankBranch: "",
            accountType: "",
            ifscCode: "",
        },
    );
    const handleChange = (e) => {
        const { name, type, value, checked, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? Array.from(files) : type === 'checkbox' ? checked : value,
        }));
    };
    const fetchdropshipper = useCallback(async () => {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${dropshippertoken}`,
                },
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something went wrong!",
                    text: errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const bankAccounts = result?.dropshipper?.bankAccount || [];

            setFormData({
                accountHolderName: bankAccounts.accountHolderName || "",
                accountNumber: bankAccounts.accountNumber || "",
                bankName: bankAccounts.bankName || "",
                bankBranch: bankAccounts.bankBranch || "",
                accountType: bankAccounts.accountType || "",
                ifscCode: bankAccounts.ifscCode || "",
            });



        } catch (error) {
            console.error("Error fetching dropshipper:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setFormData]);



    const validate = () => {
        const errors = {};

        if (!formData.accountHolderName) {
            errors.accountHolderName = "This field is required";
        }
        if (!formData.accountNumber) {
            errors.accountNumber = "This field is required";
        }
        if (!formData.bankBranch) {
            errors.bankBranch = "This field is required";
        }
        if (!formData.bankName) {
            errors.bankName = "This field is required";
        }
        if (!formData.accountType) {
            errors.accountType = "This field is required";
        }
        if (!formData.ifscCode) {
            errors.ifscCode = "This field is required";
        }

        setAccountErrors(errors);
        return Object.keys(errors).length === 0;
    };




    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const token = dropshipperData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            Swal.fire({
                title: 'Submitting...',
                text: 'Please wait while we save the bank account.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/profile/bank-account/change-request`;
            const form = new FormData();
            // Append all formData key-value pairs
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value);
            });

            // Append files if any
            if (files.cancelledChequeImage?.length > 0) {
                files.cancelledChequeImage.forEach((file) => {
                    form.append('cancelledChequeImage', file);
                });
            }


            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });

            const result = await response.json();

            if (!response.ok) {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: result.message || result.error || "An error occurred",
                });
                throw new Error(result.message || result.error || "Submission failed");
            }

            Swal.close();
            Swal.fire({
                icon: "success",
                title: "Bank Account Updated",
                text: result?.message || "The bank account has been updated successfully!",
                showConfirmButton: true,
            }).then((res) => {
                if (res.isConfirmed) {
                    setFormData({
                        accountHolderName: "",
                        accountNumber: "",
                        bankName: "",
                        bankBranch: "",
                        accountType: "",
                        ifscCode: "",
                        cancelledChequeImage: [],
                    });
                    router.push("/dropshipping/profile");
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchdropshipper();
    }, [fetchdropshipper]);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }

    return (
        <div className="bg-white lg:p-10 p-3  rounded-2xl">
            <div className="grid lg:grid-cols-3 grid-cols-1 gap-4 py-5">
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.accountHolderName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    />
                    {accountErrors.accountHolderName && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.accountHolderName}</p>
                    )}
                </div>

                {/* Account Number */}
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.accountNumber ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    />
                    {accountErrors.accountNumber && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.accountNumber}</p>
                    )}
                </div>

                {/* Bank Name */}
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="bankName"
                        value={formData.bankName || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.bankName ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    />
                    {accountErrors.bankName && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.bankName}</p>
                    )}
                </div>

                {/* Bank Branch */}
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        Bank Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="bankBranch"
                        value={formData.bankBranch || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.bankBranch ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    />
                    {accountErrors.bankBranch && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.bankBranch}</p>
                    )}
                </div>

                {/* IFSC Code */}
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.ifscCode ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    />
                    {accountErrors.ifscCode && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.ifscCode}</p>
                    )}
                </div>

                {/* Account Type */}
                <div>
                    <label className="block text-[#232323] font-bold mb-1">
                        Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="accountType"
                        value={formData.accountType || ''}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg font-bold ${accountErrors.accountType ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                            }`}
                    >
                        <option value="">Select Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Business">Business</option>
                    </select>
                    {accountErrors.accountType && (
                        <p className="text-red-500 text-sm mt-1">{accountErrors.accountType}</p>
                    )}
                </div>


            </div>


            <div className="flex space-x-4 mt-6">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
                <button className="px-4 py-2 bg-gray-400 text-white rounded-lg">Cancel</button>
            </div>

        </div>
    );
};

export default AccountInfoEdit;
