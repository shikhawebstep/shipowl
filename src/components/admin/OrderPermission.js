"use client"
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
import { useAdmin } from "./middleware/AdminMiddleWareContext";
function OrderPermission() {
    const router = useRouter();
    const [permissions, setPermission] = useState([]);
    const [loading, setLoading] = useState(false);
    const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

    const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


    const canEdit = shouldCheckPermissions
        ? extractedPermissions.some(
            (perm) =>
                perm.module === "Supplier Order Permission" &&
                perm.action === "Update" &&
                perm.status === true
        )
        : true;

    const fetchProtected = useCallback(async (url, setter, key, setLoading) => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        const token = adminData?.security?.token;

        if (!token || adminData?.project?.active_panel !== "admin") {
            localStorage.clear();
            router.push("/admin/auth/login");
            return;
        }

        if (setLoading) setLoading(true);

        try {
            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || result.error || `Failed to fetch ${key}`);
            setter(result[key] || []);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            if (setLoading) setLoading(false);
        }
    }, [router]);

    const fetchPermission = useCallback(() => {
        fetchProtected(
            "/api/admin/supplier/order/permission",
            setPermission,
            "permissions",
            setLoading
        );
    }, [fetchProtected]);

    useEffect(() => {
        verifyAdminAuth();
        checkAdminRole();
        fetchPermission();
    }, []);
    const handleSubmit = async () => {
        const payload = permissions.map(({ id, ...rest }) => rest);




        try {
            const adminData = JSON.parse(localStorage.getItem("shippingData"));
            const token = adminData?.security?.token;
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            const formdata = new FormData();
            formdata.append("permissions", JSON.stringify(payload[0]));

            Swal.fire({
                title: "Updating Permissions...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: formdata,
                redirect: "follow"
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/order/permission`, requestOptions);

            const result = await res.json();

            if (!res.ok) throw new Error(result.message || result.error);

            Swal.close();
            Swal.fire("Success", "Permissions updated successfully", "success");
            fetchPermission();
        } catch (err) {
            Swal.close();
            Swal.fire("Error", err.message, "error");
        }
    };
    return (
        <div>
            {loading ? (

                <div className="flex items-center justify-center h-[80vh]">
                    <HashLoader size={60} color="#F97316" loading={true} />
                </div>

            ) : (
                <div>
                    {permissions.length > 0 ? (
                        permissions.map((perm) => (
                            <div key={perm.id} className="mb-6 w-6/12 bg-white rounded-md p-4">
                                <h4 className="font-semibold mb-2">Permission ID: {perm.id}</h4>
                                <table className="w-full border rounded-md border-[#E0E5F2] mb-4">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-4 border-[#E0E5F2] py-2">Permission</th>
                                            <th className="border px-4 border-[#E0E5F2] py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(perm)
                                            .filter(([key]) => key !== "id") // skip id field
                                            .map(([key, value]) => (
                                                <tr key={key}>
                                                    <td className="border border-[#E0E5F2] px-4 py-2 capitalize">{key}</td>
                                                    <td className="border border-[#E0E5F2] px-4 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!canEdit}
                                                            checked={value === true}
                                                            onChange={(e) => {
                                                                // Update only the changed permission field for this permission object
                                                                const updatedPermissions = permissions.map((p) => {
                                                                    if (p.id === perm.id) {
                                                                        return {
                                                                            ...p,
                                                                            [key]: e.target.checked,
                                                                        };
                                                                    }
                                                                    return p;
                                                                });
                                                                setPermission(updatedPermissions);
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                <button
                                    onClick={handleSubmit}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center">No Permissions Found</p>
                    )}


                </div>
            )}
        </div>
    );
}

export default OrderPermission;
