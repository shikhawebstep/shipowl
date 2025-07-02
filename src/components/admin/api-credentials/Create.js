"use client";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function Create() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    website: "",
    contactEmail: "",
    contactNumber: "",
    status: "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit data to backend
  };

  return (
    <div className="md:w-10/12  p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Add API Credentials</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
          <div>
            <label className="block font-medium">Api</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2"
            />
          </div>

          <div>
            <label className="block font-medium">Api Key</label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2"
            />
          </div>

        </div>
        <div>
          <label className="block font-medium">Api Description</label>
          <textarea name="" className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 " rows={3} id=""></textarea>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white px-15 rounded-md p-3">
            Save
          </button>
          <button type="button" className="bg-gray-500 text-white px-15 rounded-md p-3" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
