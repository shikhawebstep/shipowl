"use client"
import { useRouter } from 'next/navigation';
import React, { useEffect, useCallback, useState } from 'react'
import Swal from 'sweetalert2';
import HashLoader from "react-spinners/HashLoader";
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { IoFilterSharp } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
export default function UnverifiedSupplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [currentAddressFilter, setCurrentAddressFilter] = useState('');
  const [permanentAddressFilter, setPermanentAddressFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [emailVerificationFilter, setEmailVerificationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

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
        <div className="flex justify-between items-center">
          <h2 className='md:text-3xl text-center py-4 font-bold text-orange-500'>Unverified Suppliers List</h2>
          <button
            onClick={() => {
              setNameFilter('');
              setEmailFilter('');
              setCurrentAddressFilter('');
              setPermanentAddressFilter('');
              setCountryFilter('');
              setStateFilter('');
              setCityFilter('');
              setSelected([])
              setEmailVerificationFilter('');
              if ($.fn.DataTable.isDataTable('#unverifiedSupplierTable')) {
                $('#unverifiedSupplierTable').DataTable().columns().search('').draw();
              }
            }}
            className="text-sm bg-gray-200 text-[#2B3674] hover:bg-gray-300 border border-gray-400 px-4 py-2 rounded-md"
          >
            Clear All Filters
          </button>

        </div>
         {activeFilter && (
              <div
                className="fixed z-50 bg-white border rounded-xl shadow-lg p-4 w-64"
                style={{
                  top: activeFilter.position.bottom + window.scrollY + 5 + 'px',
                  left: activeFilter.position.left + 'px',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">{activeFilter.label}</label>
                  <button
                    onClick={() => {
                      activeFilter.setValue('');
                      setActiveFilter(null);
                      if ($.fn.DataTable.isDataTable('#unverifiedSupplierTable')) {
                        $('#unverifiedSupplierTable').DataTable().column(activeFilter.columnIndex).search('').draw();
                      }
                    }}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <input
                  type="text"
                  value={
                    activeFilter.key === 'name' ? nameFilter :
                      activeFilter.key === 'email' ? emailFilter :
                        activeFilter.key === 'currentAddress' ? currentAddressFilter :
                          activeFilter.key === 'permanentAddress' ? permanentAddressFilter :
                            activeFilter.key === 'country' ? countryFilter :
                              activeFilter.key === 'state' ? stateFilter :
                                activeFilter.key === 'city' ? cityFilter :
                                  activeFilter.key === 'emailVerification' ? emailVerificationFilter : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeFilter.key === 'name') setNameFilter(val);
                    if (activeFilter.key === 'email') setEmailFilter(val);
                    if (activeFilter.key === 'currentAddress') setCurrentAddressFilter(val);
                    if (activeFilter.key === 'permanentAddress') setPermanentAddressFilter(val);
                    if (activeFilter.key === 'country') setCountryFilter(val);
                    if (activeFilter.key === 'state') setStateFilter(val);
                    if (activeFilter.key === 'city') setCityFilter(val);
                    if (activeFilter.key === 'emailVerification') setEmailVerificationFilter(val);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  placeholder={`Enter ${activeFilter.label}`}
                />

                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setActiveFilter(null)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const filterValue =
                        activeFilter.key === 'name' ? nameFilter :
                        activeFilter.key === 'email' ? emailFilter :
                        activeFilter.key === 'currentAddress' ? currentAddressFilter :
                        activeFilter.key === 'permanentAddress' ? permanentAddressFilter :
                        activeFilter.key === 'country' ? countryFilter :
                        activeFilter.key === 'state' ? stateFilter :
                        activeFilter.key === 'city' ? cityFilter :
                        activeFilter.key === 'emailVerification' ? emailVerificationFilter : '';

                      if ($.fn.DataTable.isDataTable('#unverifiedSupplierTable')) {
                        $('#unverifiedSupplierTable').DataTable().column(activeFilter.columnIndex).search(filterValue).draw();
                      }
                      setActiveFilter(null);
                    }}
                    className="text-sm bg-[#F98F5C] text-white px-3 py-1 rounded hover:bg-[#e27c4d]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

        {suppliers.length > 0 ? (
          <div className="overflow-x-auto w-full relative main-outer-wrapper">

           

            <table className="display main-tables w-full" id="unverifiedSupplierTable">


              <thead>
                <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">Sr.</th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'name',
                          label: 'Name',
                          setValue: setNameFilter,
                          getValue: () => nameFilter,
                          columnIndex: 1,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Name <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'email',
                          label: 'Email',
                          setValue: setEmailFilter,
                          getValue: () => emailFilter,
                          columnIndex: 2,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Email <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'currentAddress',
                          label: 'Current Address',
                          setValue: setCurrentAddressFilter,
                          getValue: () => currentAddressFilter,
                          columnIndex: 3,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Current Address <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'permanentAddress',
                          label: 'Permanent Address',
                          setValue: setPermanentAddressFilter,
                          getValue: () => permanentAddressFilter,
                          columnIndex: 4,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Permanent Address <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'country',
                          label: 'Country',
                          setValue: setCountryFilter,
                          getValue: () => countryFilter,
                          columnIndex: 5,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Country <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'state',
                          label: 'State',
                          setValue: setStateFilter,
                          getValue: () => stateFilter,
                          columnIndex: 6,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      State <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'city',
                          label: 'City',
                          setValue: setCityFilter,
                          getValue: () => cityFilter,
                          columnIndex: 7,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      City <IoFilterSharp />
                    </button>
                  </th>

                  <th className="p-3 px-4 text-left uppercase whitespace-nowrap">
                    <button
                      onClick={(e) =>
                        setActiveFilter({
                          key: 'emailVerification',
                          label: 'Email Verification',
                          setValue: setEmailVerificationFilter,
                          getValue: () => emailVerificationFilter,
                          columnIndex: 8,
                          position: e.currentTarget.getBoundingClientRect(),
                        })
                      }
                      className="flex items-center gap-1"
                    >
                      Email Verification <IoFilterSharp />
                    </button>
                  </th>

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
