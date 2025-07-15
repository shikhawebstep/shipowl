'use client';

import React, { useState, useEffect ,useCallback } from 'react';
import { Eye, ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
export default function ComplaintTable() {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDesc, setShowDesc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    // const [complaints,setComplaints] = useState([]);
    const router = useRouter()
    const [awbFilter, setAwbFilter] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    const fetchComplaints = useCallback(async () => {
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
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/awb`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${dropshippertoken}`,
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

            setComplaints(result?.awbs || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);
    useEffect(() => {
        if (typeof window !== "undefined" && complaints.length > 0 && !loading) {
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

                    if ($.fn.DataTable.isDataTable("#subuserAdmin")) {
                        $("#subuserAdmin").DataTable().destroy();
                        // Remove the empty() call here
                    }

                    const isMobile = window.innerWidth <= 768;
                    const pagingType = isMobile ? 'simple' : 'simple_numbers';

                    table = $('#subuserAdmin').DataTable({
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

    const parseArray = (val) => {
        try {
            return typeof val === 'string' ? JSON.parse(val) : val;
        } catch {
            return [];
        }
    };

    const complaints = [
        {
            id: 1,
            awbs: ['AWB123456', 'AWB654321'],
            description: '<p>This is a complaint about damaged items.</p>',
            proofFiles: [
                { url: '/sample1.jpg', type: 'image/jpeg' },
                { url: '/sample2.mp4', type: 'video/mp4' }
            ]
        },
        {
            id: 2,
            awbs: ['AWB111222'],
            description: '<p>Delayed shipment issue.</p>',
            proofFiles: []
        }
    ];

    const handleAccept = (id) => {

    };

    const handleReject = (id) => {

    };


    return (
        <div className="mt-10 bg-white rounded-xl p-4">

            <div className="flex justify-between items-center ">
                <h2 className="md:text-2xl text-center pb-4 font-semibold mb-4">Submitted Complaints</h2>
                <button
                    onClick={() => {
                        setAwbFilter('');
                        setDescriptionFilter('');
                        if (window.$.fn.DataTable.isDataTable('#subuserAdmin')) {
                            window.$('#subuserAdmin').DataTable().columns().search('').draw();
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
                                if (window.$.fn.DataTable.isDataTable('#subuserAdmin')) {
                                    window.$('#subuserAdmin').DataTable().column(activeFilter.columnIndex).search('').draw();
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

                                if (window.$.fn.DataTable.isDataTable('#subuserAdmin')) {
                                    window.$('#subuserAdmin').DataTable().column(activeFilter.columnIndex).search(value).draw();
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
                <table className="md:w-full w-auto display main-tables" id="subuserAdmin">
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
                                    AWB Numbers <span className="text-sm">🔍</span>
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
                                    Description <span className="text-sm">🔍</span>
                                </button>
                            </th>

                            <th className="p-2 whitespace-nowrap px-5 uppercase">Gallery</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {complaints.map((item, idx) => (
                            <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">

                                <td className="p-2 whitespace-nowrap text-left px-5">{idx + 1}</td>
                                <td className="p-2 whitespace-nowrap px-5 text-left">
                                    {parseArray(item.awbs).join(', ')}
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
                                        disabled={item.proofFiles?.length === 0}
                                        className={`inline-flex items-center px-3 py-1 text-xs rounded ${item.proofFiles?.length
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
                                        onClick={() => handleAccept(item.id)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="bg-red-500 ms-3 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                        onClick={() => handleReject(item.id)}
                                    >
                                        Reject
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
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
                            {selectedComplaint.proofFiles.map((file, idx) => (
                                <div key={idx} className="border border-gray-200 rounded p-1">
                                    {file.type.startsWith('image') ? (
                                        <img src={file.url} alt={`proof-${idx}`} className="w-full h-auto object-cover rounded" />
                                    ) : (
                                        <video src={file.url} controls className="w-full rounded" />
                                    )}
                                </div>
                            ))}
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
