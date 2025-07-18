"use client";
import { useRouter } from 'next/navigation'; // ✅ Correct import for Next.js 13

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/app/images/logo.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Swal from "sweetalert2";
import { useAdmin } from './middleware/AdminMiddleWareContext';

export default function Login() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { verifyAdminAuth } = useAdmin();
    const [rememberMe, setRememberMe] = useState(false);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const handleRememberMeChange = () => {
        setRememberMe((prev) => !prev);
    };

    useEffect(() => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const token = adminData?.security?.token;

        const savedEmail = localStorage.getItem("email");
        const savedPassword = localStorage.getItem("password");

        if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }


        if (!adminData?.project?.active_panel == "admin") {
            localStorage.removeItem("shippingData");
            router.push("/admin/auth/login");
        }

        if (token && verifyAdminAuth()) {
            router.push("/admin");
        }

    }, [verifyAdminAuth, router])


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // 🌀 Show loading Swal
        Swal.fire({
            title: "Logging in...",
            text: "Please wait while we log you in.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                await Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: result.message || result.error || "An error occurred",
                });
                throw new Error(result.message || result.error || "Login failed");
            }

            const { token, admin, assignedPermissions } = result;

            if (!token || !admin) {
                throw new Error("Invalid login response. Missing token or admin data.");
            }

            // ✅ Store session in localStorage
            const shippingData = {
                project: {
                    name: "ShipOwl",
                    environment: "production",
                    active_panel: "admin",
                },
                admin,
                session: {
                    is_authenticated: true,
                    last_active_at: new Date().toISOString(),
                },
                security: {
                    token,
                },
            };

            if (admin.role === "admin_staff" && Array.isArray(assignedPermissions)) {
                localStorage.setItem("permissions", JSON.stringify(assignedPermissions));
            } else {
                localStorage.removeItem("permissions");
            }

            localStorage.setItem("shippingData", JSON.stringify(shippingData));

            if (rememberMe) {
                localStorage.setItem("email", email);
                localStorage.setItem("password", password);
            } else {
                localStorage.removeItem("email");
                localStorage.removeItem("password");
            }

            // ✅ Show success alert
            await Swal.fire({
                icon: "success",
                title: "Login Successful",
                text: "Welcome to Admin Dashboard!",
                timer: 1500,
                showConfirmButton: true,
            });

            // ✅ Redirect
            router.push("/admin");

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
        <div className="md:flex h-screen w-full">
            {/* Left Section */}
            <div className="md:w-1/2 relative md:flex md:flex-col justify-center items-center md:px-3 p-4 rounded-md bg-white lg:px-12">
                <div className="w-full max-w-sm">
                    <div className="md:absolute top-7">
                        <Link href="/admin" className="text-[#A3AED0] text-sm mb-6 inline-block">
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
                                required
                                className="w-full px-4 py-2 mt-1 border border-[#E0E5F2] text-[#A3AED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                                    required
                                    className="w-full px-4 py-2 mt-1 border border-[#E0E5F2] text-[#A3AED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                {/* Eye Icon Button */}
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-3 flex items-center text-[#A3AED0] hover:text-blue-500"
                                >
                                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={handleRememberMeChange}
                                    className="form-checkbox text-[#2B3674]" />
                                <span className="text-sm text-[#2B3674]">Keep me logged in</span>
                            </label>
                            <Link href="/admin/auth/password/forget" className="text-sm text-[#F98F5C] hover:underline">
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
                        <Link href="/" className="text-[#F98F5C] hover:underline">
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
