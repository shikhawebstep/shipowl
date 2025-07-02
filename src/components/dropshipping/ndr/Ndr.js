"use client"
import { useState } from 'react';

const ndrList = [
  {
    orderId: 'ORD123456',
    customer: 'Rahul Sharma',
    pincode: '110044',
    reason: 'Customer not available',
    status: 'Pending',
  },
  {
    orderId: 'ORD123457',
    customer: 'Amit Verma',
    pincode: '400072',
    reason: 'Incorrect address',
    status: 'Pending',
  },
  {
    orderId: 'ORD123458',
    customer: 'Sneha Das',
    pincode: '700001',
    reason: 'Refused delivery',
    status: 'Pending',
  },
];

export default function ManageNdrPage() {
  const [ndrData, setNdrData] = useState(ndrList);



  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-6xl">
      <div className="">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage NDRs</h1>

        <div className="overflow-x-auto ">
          <table className="w-full text-sm text-left border">
            <thead className="bg-orange-400 text-white">
              <tr>
                <th className="px-4 py-3 ">Order ID</th>
                <th className="px-4 py-3 border-l">Customer</th>
                <th className="px-4 py-3 border-l">Pincode</th>
                <th className="px-4 py-3 border-l">Reason</th>
                <th className="px-4 py-3 border-l">Status</th>
                <th className="px-4 py-3 border-l">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ndrData.map((ndr, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3 border-l font-medium">{ndr.orderId}</td>
                  <td className="px-4 py-3 border-l">{ndr.customer}</td>
                  <td className="px-4 py-3 border-l">{ndr.pincode}</td>
                  <td className="px-4 py-3 border-l">{ndr.reason}</td>
                  <td className="px-4 py-3 border-l text-blue-600 font-medium">{ndr.status}</td>
                  <td className="px-4 py-3 border-l space-x-2">
                    <button
                      onClick={() => handleAction(index, 'Rescheduled')}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleAction(index, 'Cancelled')}
                      className="px-3 my-2 md:my-0 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(index, 'Retry')}
                      className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
              {ndrData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-6">
                    No NDR records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
