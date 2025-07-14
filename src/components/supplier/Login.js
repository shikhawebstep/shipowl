"use client";
import { useRouter } from 'next/navigation'; // ✅ Correct import for Next.js 13
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/app/images/logo.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Swal from "sweetalert2";
import { useSupplier } from './middleware/SupplierMiddleWareContext';

export default function Login() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { verifySupplierAuth } = useSupplier();
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const [formErrors, setFormErrors] = useState({});
    useEffect(() => {
        const checkAuth = async () => {
            const supplierData = JSON.parse(localStorage.getItem("shippingData"));
            const token = supplierData?.security?.token;

            if (supplierData?.project?.active_panel !== "supplier") {
                localStorage.removeItem("shippingData");
                router.push("/supplier/auth/login");
                return;
            }

            if (token && await verifySupplierAuth()) {
                router.push("/supplier");
            }
        };

        checkAuth();
    }, []);

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            errors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
            errors.email = "Please enter a valid email address.";
        }
        if (!password) {
            errors.password = "Password is required";
        }



        else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
        }

        return errors
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();

        if (Object.keys(validationError).length > 0) {
            setFormErrors(validationError);
            return;
        }

        setFormErrors({});
        setLoading(true);

        // 🌀 Show loading alert
        Swal.fire({
            title: "Logging in...",
            text: "Please wait while we verify your credentials.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: errorMessage.message || errorMessage.error || "An error occurred",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Login failed");
            }

            const result = await response.json();
            const { token, admin } = result;

            if (admin) {
                const shippingData = {
                    project: {
                        name: "Shipping OWL",
                        environment: "production",
                        active_panel: "supplier",
                    },
                    supplier: {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        companyName: admin.companyName,
                    },
                    session: {
                        is_authenticated: true,
                        last_active_at: new Date().toISOString(),
                    },
                    security: {
                        token: token,
                    },
                };

                localStorage.setItem("shippingData", JSON.stringify(shippingData));

                if (admin.role === "supplier_staff" && Array.isArray(result.assignedPermissions)) {
                    localStorage.setItem("supplierPermissions", JSON.stringify(result.assignedPermissions));
                } else {
                    localStorage.removeItem("supplierPermissions");
                }
            } else {
                console.error("No admin object found in response.");
            }


            // ✅ Show success alert before redirect
            await Swal.fire({
                icon: "success",
                title: "Login Successful",
                text: "Welcome to your supplier dashboard!",
                showConfirmButton: true,
            });

            router.push("/supplier");

        } catch (error) {
            console.error("Error:", error);
            if (!Swal.isVisible()) {
                Swal.fire({
                    icon: "error",
                    title: "Login Error",
                    text: error.message || "Something went wrong. Please try again.",
                });
            }
            setError(error.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="md:flex h-screen w-full ">
            {/* Left Section */}
            <div className="md:w-1/2 relative md:p-0 p-6 md:flex md:flex-col justify-center rounded-md md:rounded-0 items-center px-3 bg-white lg:px-12">
                <div className="w-full max-w-sm">
                    <div className="lg:absolute top-7">
                        <Link href="/supplier" className="text-[#A3AED0] text-sm mb-6 inline-block">
                            ← Back to dashboard
                        </Link>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-bold mb-2 text-[#2B3674]">Sign In</h2>
                    <p className="text-[#A3AED0] mb-6 mt-6 md:mt-0">Enter your email and password to sign in!</p>

                    <form className="space-y-4" onSubmit={handleSubmit}>

                        <div>
                            <label className="block text-sm font-medium text-[#2B3674]">
                                Email<span className="text-[#F98F5C]">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="mail@shipowl.com"
                                value={email}
                                onChange={handleEmailChange}
                                className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? "border-red-500" : "border-[#E0E5F2]"
                                    } text-[#A3AED0]`}
                            />
                            {formErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                            )}
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-[#2B3674]">
                                Password <span className="text-[#F98F5C]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${formErrors.password ? "border-red-500" : "border-[#E0E5F2]"
                                        } text-[#A3AED0]`}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-3 flex items-center text-[#A3AED0] hover:text-blue-500"
                                >
                                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                                </button>
                            </div>
                            {formErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                            )}
                        </div>


                        <div className="flex justify-between items-center">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="form-checkbox text-[#2B3674]" />
                                <span className="text-sm text-[#2B3674]">Keep me logged in</span>
                            </label>
                            <Link href="/supplier/auth/password/forget" className="text-sm text-[#F98F5C] hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#F98F5C] text-white py-3 rounded-lg hover:bg-orange-600"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="text-start text-sm text-[#2B3674] mt-4">
                        Not registered yet?{" "}
                        <Link href="/supplier/auth/register" className="text-[#F98F5C] hover:underline">
                            Create an Account
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="md:w-1/2 hidden md:flex justify-center items-center bg-gradient-to-br from-[#001e42] to-[#461638] text-white rounded-bl-[170px]">
                <div className="text-center">
                    <div className="flex justify-center items-center max-w[400px]">
                        <Image src={logo} alt="ShipOwl Logo" className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
