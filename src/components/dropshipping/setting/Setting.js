'use client';

import { useState } from 'react';

export default function Settings() {
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [notifyByEmail, setNotifyByEmail] = useState(false);

  return (
    <div className="max-w-4xl px-4 py-8 bg-white  rounded-md">
      <h1 className="text-2xl font-bold mb-6">Dropshipper Settings</h1>

      {/* Profile Info */}
      <section className="mb-5">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" className="input border p-2 rounded-md border-[#eee]" />
          <input type="email" placeholder="Email Address" className="input border p-2 rounded-md border-[#eee]" />
        </div>
        <div className='mt-3'>
          <input type="text" placeholder="Phone Number" className="input border p-2 w-full rounded-md border-[#eee]" />
        </div>

      </section>

      {/* Store Info */}
      <section className="mb-5">
        <h2 className="text-lg font-semibold mb-4">Store Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Store Name" className="input border p-2 rounded-md border-[#eee]" />
          <input type="url" placeholder="Store Website (optional)" className="input border p-2 rounded-md border-[#eee]" />
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={() => setAutoAcceptOrders(!autoAcceptOrders)}
              className="checkbox"
            />
            Auto-accept orders
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={() => setNotifyByEmail(!notifyByEmail)}
              className="checkbox"
            />
            Notify me by email for new orders
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded">
          Save Changes
        </button>
      </div>
    </div>
  );
}
