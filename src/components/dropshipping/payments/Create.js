"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropshipper } from "../middleware/DropshipperMiddleWareContext";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
export default function Create() {
    const router = useRouter();
        const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        date: "",
        transactionId: "",
        cycle: "",
        amount: "",
        status: "",
    });
    const { verifyDropShipperAuth } = useDropshipper();

    useEffect(()=>{
        verifyDropShipperAuth();
    },[verifyDropShipperAuth]);

    const [formErrors, setFormErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: "" })); // clear error on change
    };

    const validate = () => {
        const errors = {};
        if (!formData.date) errors.date = "Payment date is required.";
        if (!formData.transactionId) errors.transactionId = "Transaction ID is required.";
        if (!formData.amount) errors.amount = "Amount is required.";
        if (!formData.cycle) errors.cycle = "Payment Cycle is required.";
        if (!formData.status) errors.status = "Status is required.";
        return errors;
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <HashLoader size={60} color="#F97316" loading={true} />
            </div>
        );
    }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    const token = dropshipperData?.security?.token;

    if (dropshipperData?.project?.active_panel !== "dropshipper" || !token) {
      localStorage.clear();
      router.push("/dropshipping/auth/login");
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      Swal.fire({ title: "Creating Payments...", allowOutsideClick: false, didOpen: Swal.showLoading });
      const formdata = new FormData();
      formdata.append("date", formData.date);
      formdata.append("transactionId", formData.transactionId);
      formdata.append("cycle", formData.cycle);
      formdata.append("amount", formData.amount);
      formdata.append("status", formData.status);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formdata,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || result.error|| "Creation failed");

      Swal.fire("Payment Created", " Payment has been created successfully!", "success").then(() => {
        setFormData({state: "", country: "", city: "", pincode: "" });
        router.push("/dropshipping/payments");
      });
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

    const inputBaseStyle = "border w-full rounded-md p-2 mt-2";
    const errorStyle = "border-red-500";
    const labelStyle = "block font-medium";
    const errorTextStyle = "text-red-500 text-sm mt-1";

    return (
        <div className="bg-white lg:w-9/12 mt-10 rounded-2xl md:p-8 shadow-md p-4">
            <h2 className="text-2xl font-bold text-[#2B3674] mb-6">Create Payment</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-2">
                    {/* Payment Date */}
                    <div>
                        <label className={labelStyle}>
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date || ''}
                            onChange={handleChange}
                            className={`${inputBaseStyle} text-[#718EBF] border-[#DFEAF2] ${formErrors.date ? errorStyle : ""}`}
                            
                        />
                        {formErrors.date && <p className={errorTextStyle}>{formErrors.date}</p>}
                    </div>

                    {/* Transaction ID */}
                    <div>
                        <label className={labelStyle}>
                            Transaction ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="transactionId"
                            value={formData.transactionId || ''}
                            onChange={handleChange}
                            placeholder="TXN000123"
                            className={`${inputBaseStyle} text-[#718EBF] border-[#DFEAF2] ${formErrors.transactionId ? errorStyle : ""}`}
                            
                        />
                        {formErrors.transactionId && <p className={errorTextStyle}>{formErrors.transactionId}</p>}
                    </div>

                    {/* Payment Cycle */}
                    <div>
                        <label className={labelStyle}>Payment Cycle <span className="text-red-500">*</span></label>
                        <select
                            name="cycle"
                            value={formData.cycle || ''}
                            onChange={handleChange}
                            className={`${inputBaseStyle} text-[#718EBF] border-[#DFEAF2] ${formErrors.amount ? errorStyle : ""}`}
                        >
                            <option value="Weekly">Weekly</option>
                            <option value="Biweekly">Biweekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                        {formErrors.cycle && <p className={errorTextStyle}>{formErrors.cycle}</p>}

                    </div>

                    {/* Amount */}
                    <div>
                        <label className={labelStyle}>
                            Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount || ''}
                            onChange={handleChange}
                            min="0"
                            placeholder="5000"
                            className={`${inputBaseStyle} text-[#718EBF] border-[#DFEAF2] ${formErrors.amount ? errorStyle : ""}`}
                            
                        />
                        {formErrors.amount && <p className={errorTextStyle}>{formErrors.amount}</p>}
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className={labelStyle}>Status <span className="text-red-500">*</span></label>
                    <select
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        className={`${inputBaseStyle} text-[#718EBF] border-[#DFEAF2] ${formErrors.amount ? errorStyle : ""}`}
                        >
                        <option value="Success">Success</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                    </select>
                    {formErrors.status && <p className={errorTextStyle}>{formErrors.status}</p>}

                </div>

                {/* Submit */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-[#3367d6]"
                    >
                        Create Payment
                    </button>
                </div>
            </form>
        </div>
    );
}
