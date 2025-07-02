"use client";

import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiBell,
  FiSettings,
  FiToggleRight,
} from "react-icons/fi";

export default function Setting() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className=" pt-10">
      <div className="max-w-4xl bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiSettings className="text-indigo-600" /> Admin Settings
        </h1>

        {/* Account Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SettingItem label="Name" value="Rajeev Kapoor" icon={<FiUser />} />
            <SettingItem label="Email" value="rajeev@dropshiphub.com" icon={<FiMail />} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Preferences */}
          <div className="mb-8 w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Preferences</h2>
            <div className=" gap-6">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <FiBell size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-600">Notifications</p>
                  <p className="text-gray-800 text-sm">Receive system alerts</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`ml-auto transition ${notifications
                    ? "text-green-500"
                    : "text-gray-400"
                    }`}
                >
                  <FiToggleRight size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Security</h2>
            <div className=" gap-6">
              <SettingItem
                label="Password"
                value="••••••••"
                icon={<FiLock />}
                actionText="Change"
                onActionClick={() => alert("Password Change Model")}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const SettingItem = ({ label, value, icon, actionText, onActionClick }) => (
  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">{icon}</div>
    <div className="flex-1">
      <p className="font-medium text-sm text-gray-600">{label}</p>
      <p className="text-gray-800 text-sm">{value}</p>
    </div>
    {actionText && (
      <button
        onClick={onActionClick}
        className="text-sm text-indigo-600 hover:underline font-medium"
      >
        {actionText}
      </button>
    )}
  </div>
);
