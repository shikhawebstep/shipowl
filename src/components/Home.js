"use client"
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Home() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-100">
            <button onClick={()=>router.push('/admin')} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                Admin Dashboard
            </button>
            <button onClick={()=>router.push('/supplier')} className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
                Supplier Dashboard
            </button>
            <button onClick={()=>router.push('/dropshipping')} className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition">
                Dropshipper Dashboard
            </button>
        </div>
    );
}
