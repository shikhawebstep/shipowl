"use client"
import { useRouter } from 'next/navigation';
import React, { useEffect, useCallback, useState } from 'react'
import Swal from 'sweetalert2';
import HashLoader from "react-spinners/HashLoader";
import 'datatables.net-dt/css/dataTables.dataTables.css';

import { FaCheck } from "react-icons/fa";
export default function UnverifiedSupplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const [selected, setSelected] = useState([]);

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const fetchSupplier = useCallback(async () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/admin/auth/login");
      return;
    }
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier?type=notVerified`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text: errorMessage.error || errorMessage.message || "Network Error.",
        });
        throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
      }

      const result = await response.json();
      if (result) {
        setSuppliers(result?.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [router, setSuppliers]);


  useEffect(() => {
    fetchSupplier();
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && suppliers.length > 0 && !loading) {
      let table = null;

      Promise.all([
        import("jquery"),
        import("datatables.net"),
        import("datatables.net-dt"),
        import("datatables.net-buttons"),
        import("datatables.net-buttons-dt")
      ])
        .then(([jQuery]) => {
          window.jQuery = window.$ = jQuery.default;

          if ($.fn.DataTable.isDataTable("#unverifiedSupplierTable")) {
            $("#unverifiedSupplierTable").DataTable().destroy();
            // Remove the empty() call here
          }


          const isMobile = window.innerWidth <= 768;
          const pagingType = isMobile ? 'simple' : 'simple_numbers';

          table = $('#unverifiedSupplierTable').DataTable({
            pagingType,
            language: {
              paginate: {
                previous: "<",
                next: ">"
              }
            }
          });

          return () => {
            if (table) {
              table.destroy();
            }
          };
        })
        .catch((error) => {
          console.error("Failed to load DataTables dependencies:", error);
        });
    }
  }, [loading]);
  const handleOnboard = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to onboard this supplier?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, onboard',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        fetchSupplierOnboard(id); // Run verification
      }
    });
  };

  const fetchSupplierOnboard = useCallback(async (id) => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/admin/auth/login");
      return;
    }


    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${id}/verify?status=true`;

    try {
      // Show loading modal
      Swal.fire({
        title: 'Onboarding Supplier...',
        text: 'Please wait while we verify the supplier.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        const message =
          result?.message ||
          result?.error?.message ||
          (typeof result?.error === "string" && result.error) ||
          "Something went wrong.";

        await Swal.fire({
          icon: "error",
          title: "Onboarding Failed",
          text: message,
          showConfirmButton: true,
        });

        throw new Error(message);
      }

      // Success message
      Swal.close(); // Close loader
      await Swal.fire({
        icon: "success",
        title: "Supplier Onboarded",
        text: "The supplier has been successfully verified!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Optional: refresh the list
      fetchSupplier?.();

    } catch (error) {
      console.error("Error onboarding supplier:", error);
      await Swal.fire({
        icon: "error",
        title: "Something Went Wrong!",
        text: error.message || "An unexpected error occurred.",
        showConfirmButton: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <HashLoader color="orange" size={50} />
      </div>
    );
  }


  return (
    <>
      <div className='bg-white p-4 rounded-md'>
        <h2 className='md:text-3xl text-center py-4 font-bold text-orange-500'>Unverified Suppliers List</h2>
        {suppliers.length > 0 ? (
          <div className="overflow-x-auto w-full relative main-outer-wrapper">
            <table className="display main-tables w-full" id="unverifiedSupplierTable">
              <thead>
                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Sr.</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Name</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Email</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Current Address</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Permanent Address</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Country</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">State</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">City</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Email Verification</th>
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((item, index) => {
                  return (
                    <tr key={item.id} className="bg-transparent border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer mr-2">
                            <input
                              type="checkbox"
                              checked={selected.includes(item.id)}
                              onChange={() => handleCheckboxChange(item.id)}
                              className="peer hidden"
                            />
                            <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0 peer-checked:text-white">
                              <FaCheck className="peer-checked:block text-white w-3 h-3" />
                            </div>
                          </label>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-3 capitalize text-left whitespace-nowrap">{item.name.toLowerCase()}</td>

                      <td className="p-3 capitalize text-left whitespace-nowrap">{item.email}</td>

                      <td className="p-3 capitalize text-left">{item.currentAddress || '-'}</td>
                      <td className="p-3 capitalize text-left">{item.permanentAddress || '-'}</td>
                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        {item.permanentCountry?.name || '-'}
                      </td>
                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        {item.permanentState?.name || '-'}
                      </td>
                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        {item.permanentCity?.name || '-'}
                      </td>
                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        {!item.isEmailVerified || !item.emailVerifiedAt ? (
                          <span className="text-red-500">mail not verified</span>
                        ) : (
                          <span className="text-green-600">mail verified</span>
                        )}
                      </td>

                      <td className="p-3 capitalize text-left whitespace-nowrap">
                        <button
                          disabled={!item.isEmailVerified}
                          onClick={() => handleOnboard(item.id)}
                          className={`p-2 px-4 rounded-md text-white ${item.isEmailVerified ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        >
                          Onboard
                        </button>
                      </td>

                    </tr>

                  );
                })}
              </tbody>
            </table>

          </div>
        ) : (
          <div className="text-center text-lg text-gray-500">No suppliers available</div>
        )
        }
      </div>

    </>
  )
}
