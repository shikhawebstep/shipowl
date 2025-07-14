'use client';

import React, { useState ,useCallback } from 'react';
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
            <h2 className="md:text-2xl text-center pb-4 font-semibold mb-4">Submitted Complaints</h2>
            <div className="overflow-x-auto relative main-outer-wrapper w-full">
                <table className="md:w-full w-auto display main-tables" id="subuserAdmin">
                    <thead>
                        <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
                            <th className="p-2 whitespace-nowrap px-5  text-left uppercase">#</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">AWB Numbers</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">Description</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">Gallery</th>
                            <th className="p-2 whitespace-nowrap px-5 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map((item, idx) => (
                            <tr key={item.id} className="border-b capitalize border-[#E9EDF7] text-[#2B3674] font-semibold">

                                <td className="p-2 whitespace-nowrap text-left px-5">{idx + 1}</td>
                                <td className="p-2 whitespace-nowrap px-5 text-center">
                                    {parseArray(item.awbs).join(', ')}
                                </td>
                                <td className="p-2 whitespace-nowrap px-5 space-x-2 text-center">
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
                                <td className='p-2 whitespace-nowrap px-5 text-center'>
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
