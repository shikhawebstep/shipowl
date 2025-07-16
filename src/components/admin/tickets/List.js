'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { Eye, ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { IoFilterSharp } from "react-icons/io5";
import { HashLoader } from 'react-spinners';

export default function ComplaintTable() {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDesc, setShowDesc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const router = useRouter()
    const [awbFilter, setAwbFilter] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    const fetchComplaints = useCallback(async () => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }
        const admintoken = adminData?.security?.token;
        if (!admintoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/raise-ticket`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
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

            setComplaints(result?.data?.tickets || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);



    useEffect(() => {
            if (typeof window !== 'undefined' && complaints.length > 0 && !loading) {
                let table = null;
                Promise.all([
                    import('jquery'),
                    import('datatables.net'),
                    import('datatables.net-dt'),
                    import('datatables.net-buttons'),
                    import('datatables.net-buttons-dt')
                ]).then(([jQuery]) => {
                    window.jQuery = window.$ = jQuery.default;
                    if ($.fn.DataTable.isDataTable('#tickets')) {
                        $('#tickets').DataTable().destroy();
                        $('#tickets').empty();
                    }
                    const isMobile = window.innerWidth <= 768;
                    const pagingType = isMobile ? 'simple' : 'simple_numbers';

                    table = $('#tickets').DataTable({
                        pagingType,
                        language: {
                            paginate: { previous: "<", next: ">" }
                        }
                    });

                    return () => {
                        if (table) {
                            table.destroy();
                            $('#tickets').empty();
                        }
                    };
                }).catch((error) => {
                    console.error('DataTables init error:', error);
                });
            }
    }, [complaints, loading]);

  useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints])

  const handleReview = async (status,id) => {
    Swal.fire({
        title: 'Submitting...',
        text: `Please wait while we ${status === 'accepted' ? 'accept' : 'reject'} the ticket.`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    if (adminData?.project?.active_panel !== "admin") {
        localStorage.removeItem("shippingData");
        Swal.close();
        Swal.fire('Session Expired', 'Please log in again.', 'warning');
        router.push("/admin/auth/login");
        return;
    }

    const admintoken = adminData?.security?.token;
    if (!admintoken) {
        Swal.close();
        Swal.fire('Token Missing', 'Authentication token not found. Please login again.', 'error');
        router.push("/admin/auth/login");
        return;
    }

    try {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${admintoken}`);
    

        const raw = JSON.stringify({
            status: status,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/dropshipper/raise-ticket/${id}/review`,
            requestOptions
        );

        const result = await response.json();

        Swal.close();

        if (response.ok) {
            Swal.fire(
                'Success',
                `Ticket has been ${status === 'accept' ? 'accepted' : 'rejected'} successfully.`,
                'success'
            );
            fetchComplaints();
        } else {
            Swal.fire('Error', result?.message || result?.error || 'Something went wrong.', 'error');
        }

    } catch (error) {
        Swal.close();
        Swal.fire('Error', 'Network or server error occurred.', 'error');
        console.error(error);
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
        <div className="mt-10 bg-white rounded-xl p-4">

            <div className="flex justify-between items-center ">
                <h2 className="md:text-2xl text-center pb-4 font-semibold mb-4">Submitted Complaints</h2>
                <button
                    onClick={() => {
                        setAwbFilter('');
                        setDescriptionFilter('');
                        if (window.$.fn.DataTable.isDataTable('#tickets')) {
                            window.$('#tickets').DataTable().columns().search('').draw();
                        }
                    }}
                    className="text-sm bg-gray-200 hover:bg-gray-300 border px-4 py-2 rounded mb-4"
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
                                if (window.$.fn.DataTable.isDataTable('#tickets')) {
                                    window.$('#tickets').DataTable().column(activeFilter.columnIndex).search('').draw();
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
                            activeFilter.key === 'awb' ? awbFilter :
                                activeFilter.key === 'desc' ? descriptionFilter :
                                    ''
                        }
                        onChange={(e) => {
                            const val = e.target.value;
                            if (activeFilter.key === 'awb') setAwbFilter(val);
                            if (activeFilter.key === 'desc') setDescriptionFilter(val);
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
                                const value =
                                    activeFilter.key === 'awb' ? awbFilter :
                                        activeFilter.key === 'desc' ? descriptionFilter :
                                            '';

                                if (window.$.fn.DataTable.isDataTable('#tickets')) {
                                    window.$('#tickets').DataTable().column(activeFilter.columnIndex).search(value).draw();
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

            <div className="overflow-x-auto relative main-outer-wrapper w-full">
                {
                    complaints.length >0 ?(

                <table className="md:w-full w-auto display main-tables" id="tickets">
                    <thead>
                        <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                            <th className="p-2 whitespace-nowrap px-5  text-left uppercase">#</th>

                            <th className="p-2 whitespace-nowrap px-5 uppercase relative">
                                <button
                                    onClick={(e) =>
                                        setActiveFilter({
                                            key: 'awb',
                                            label: 'AWB Number',
                                            setValue: setAwbFilter,
                                            getValue: () => awbFilter,
                                            columnIndex: 1,
                                            position: e.currentTarget.getBoundingClientRect(),
                                        })
                                    }
                                    className="flex items-center gap-2 uppercase"
                                >
                                    AWB Numbers  <IoFilterSharp />
                                </button>
                            </th>

                            <th className="p-2 whitespace-nowrap px-5 uppercase relative">
                                <button
                                    onClick={(e) =>
                                        setActiveFilter({
                                            key: 'desc',
                                            label: 'Description',
                                            setValue: setDescriptionFilter,
                                            getValue: () => descriptionFilter,
                                            columnIndex: 2,
                                            position: e.currentTarget.getBoundingClientRect(),
                                        })
                                    }
                                    className="flex items-center gap-2 uppercase"
                                >
                                    Description  <IoFilterSharp />
                                </button>
                            </th>

                            <th className="p-2 whitespace-nowrap px-5 text-left uppercase">Gallery</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {complaints.map((item, idx) => {
                            const hasGallery = item.gallery?.split(',').filter(Boolean).length > 0;

                            return (
                                <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">
                                    <td className="p-2 whitespace-nowrap text-left px-5">{idx + 1}</td>

                                    <td className="p-2 whitespace-nowrap px-5 text-left">
                                        {item.ticketOrders.map(order => order.order.awbNumber).join(', ')}
                                    </td>

                                    <td className="p-2 whitespace-nowrap px-5 space-x-2 text-left">
                                        <button
                                            onClick={() => {
                                                setSelectedComplaint(item);
                                                setShowDesc(true);
                                            }}
                                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </button>
                                    </td>

                                    <td className='p-2 whitespace-nowrap px-5 text-left'>
                                        <button
                                            onClick={() => {
                                                setSelectedComplaint(item);
                                                setShowGallery(true);
                                            }}
                                            disabled={!hasGallery}
                                            className={`inline-flex items-center px-3 py-1 text-xs rounded ${hasGallery
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <ImageIcon className="w-4 h-4 mr-1" />
                                            Gallery
                                        </button>
                                    </td>

                                    <td className="p-2 whitespace-nowrap px-5 text-center">
                                        <button
                                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                                            onClick={() => handleReview("accept",item.id)}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="bg-red-500 ms-3 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                            onClick={() => handleReview("reject",item.id)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                    </tbody>
                </table>
                    ):(
                        <p className="text-center font-bold">No Data Found</p>
                    )
                }
            </div>

            {/* Description Modal */}
            {showDesc && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center px-4 justify-center bg-[#00000087] bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
                        <h3 className="text-lg font-semibold mb-3">Complaint Description</h3>
                        <div
                            className="prose max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: selectedComplaint.description }}
                        />
                        <button
                            onClick={() => setShowDesc(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Modal */}
            {showGallery && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#00000087] bg-opacity-50 overflow-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
                        <h3 className="text-lg font-semibold mb-4">Uploaded Proof</h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedComplaint.gallery
                                ?.split(',')
                                .map(url => url.trim())
                                .filter(Boolean)
                                .map((fileUrl, idx) => {
                                    const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(fileUrl);
                                    const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(fileUrl);

                                    return (
                                        <div key={idx} className="border border-gray-200 rounded p-1">
                                            {isImage ? (
                                                <img
                                                    src={fileUrl}
                                                    alt={`proof-${idx}`}
                                                    className="w-full h-auto object-cover rounded"
                                                />
                                            ) : isVideo ? (
                                                <video
                                                    src={fileUrl}
                                                    controls
                                                    className="w-full rounded"
                                                />
                                            ) : (
                                                <p className="text-xs text-gray-500">Unsupported file</p>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        <button
                            onClick={() => setShowGallery(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
