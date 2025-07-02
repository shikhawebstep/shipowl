"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function Verify() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect( async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      console.error("No token found in URL");
      setLoading(false);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ token });

    const requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/auth/registration/verify`, requestOptions)
      .then(async (response) => {
        const text = await response.text();
        setLoading(false);

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        Swal.fire({
          title: response.ok ? "Success" : "Error",
          text: data.message || data.error || text,
          icon: response.ok ? "success" : "error",
          confirmButtonText: "OK",
        }).then(() => {
          if (response.ok) {
            router.push("/dropshipping/auth/login");
          }
        });
      })
      .catch((error) => {
        setLoading(false);
        Swal.fire("Error", error.message || "Something went wrong", "error");
      });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-gray-700 text-lg font-medium">
              Verifying your account...
            </p>
          </>
        ) : (
          <p className="text-gray-700 text-lg font-medium">Verification complete.</p>
        )}
      </div>
    </div>
  );
}
