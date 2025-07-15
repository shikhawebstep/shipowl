"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
export default function Create() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [showBulkForm, setShowBulkForm] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);

  const [formData, setFormData] = useState({
    pincode: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));


    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };



 
  const validate = () => {
    const newErrors = {};
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    if (dropshipperData?.project?.active_panel !== "admin" || !token) {
      localStorage.removeItem("shippingData");;
      router.push("/admin/auth/login");
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      Swal.fire({ title: "Creating Good Pincodes...", allowOutsideClick: false, didOpen: Swal.showLoading });
      const formdata = new FormData();
      formdata.append("pincode", formData.pincode);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/good-pincode`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formdata,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || result.error || "Creation failed");

      Swal.fire("Good Pincodes Created", " Good Pincodes has been created successfully!", "success").then(() => {
        setFormData({state: "", country: "", city: "", pincode: "" });
        router.push("/admin/good-pincodes/list");
      });
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

const handleBulkSubmit = async (e) => {
  e.preventDefault();

  if (!bulkFile) {
    Swal.fire("Please select a file before uploading", "", "warning");
    return;
  }

  setLoading(true);
  const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
  const token = dropshipperData?.security?.token;

  if (dropshipperData?.project?.active_panel !== "admin" || !token) {
    localStorage.removeItem("shippingData");;
    router.push("/admin/auth/login");
    return;
  }

  try {
    Swal.fire({ title: "Uploading Bulk Pincodes...", allowOutsideClick: false, didOpen: Swal.showLoading });

    const formdata = new FormData();
    formdata.append("goodPincodes", bulkFile);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/good-pincode/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formdata,
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.message ||result.error || "Bulk upload failed");

    Swal.fire("Success", "Bulk good Pincodes uploaded successfully!", "success").then(() => {
      setBulkFile(null);
      setShowBulkForm(false);
      router.push("/admin/good-pincodes/list");
    });
  } catch (err) {
    Swal.fire("Error", err.message || "Something went wrong.", "error");
  } finally {
    setLoading(false);
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
    <div className="md:w-10/12 p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Add Good Pincodes</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
       
          <div>
            <label className="font-bold block text-[#232323]">Pincode<span className="text-red-500">*</span></label>
            <input
              type="number"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3"
            />
            {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button type="submit" className="bg-orange-500 text-white md:px-10 rounded-md p-3 px-3">Save</button>
          <button type="button" className="bg-gray-500 text-white md:px-10 rounded-md p-3 px-3" onClick={() => router.back()}>Cancel</button>
          <button type="button" className="bg-blue-600 text-white md:px-10 rounded-md p-3 px-3" onClick={() => setShowBulkForm(prev => !prev)}>Bulk Upload</button>
        </div>
      </form>

      {showBulkForm && (
        <form onSubmit={handleBulkSubmit} className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium mb-2">Bulk Upload CSV/Excel</h3>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setBulkFile(e.target.files[0])}
            className="border w-full border-[#DFEAF2] rounded-md p-3 mt-2"
          />
          <div className="mt-3">
            <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded-md">Upload File</button>
          </div>
        </form>
      )}
    </div>
  );
}
