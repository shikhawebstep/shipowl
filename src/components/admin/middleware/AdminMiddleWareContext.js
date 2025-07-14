import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const AdminMiddleWareContext = createContext();

export const useAdmin = () => {
    const context = useContext(AdminMiddleWareContext);
    if (!context) {
        throw new Error("useAdmin must be used within an AdminMiddleWareProvider");
    }
    return context;
};

export default function AdminMiddleWareProvider({ children }) {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [openSubMenus, setOpenSubMenus] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [isAdminStaff, setIsAdminStaff] = useState(null);
    const [extractedPermissions, setExtractedPermissions] = useState([]);
     const checkAdminRole = () => {
        try {
            const shippingData = JSON.parse(localStorage.getItem("shippingData"));
            if (shippingData?.admin?.role === "admin_staff") {
                setIsAdminStaff(true);
            }
        } catch (err) {
            console.error("Error reading shippingdata:", err);
            setIsAdminStaff(false);
        }

        try {
            const rawPermissions = JSON.parse(localStorage.getItem("permissions")) || [];
            const permissions = [];
            rawPermissions.forEach((perm) => {
                if (perm.permission) {
                    permissions.push({
                        panel: perm.permission.panel,
                        module: perm.permission.module,
                        action: perm.permission.action,
                        status: perm.permission.status,
                    });
                }
            });
            setExtractedPermissions(permissions);
        } catch (err) {
            console.error("Error parsing permissions:", err);
        }
    }


    const verifyAdminAuth = useCallback(async () => {
        setLoading(true);
        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData"); // Correct way to remove a specific item
            router.push("/admin/auth/login");        // Redirect to login
        }

        const admin_token = adminData?.security?.token;
        if (!admin_token) return; // Early exit if no token

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/auth/verify`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${admin_token}`,
                },
            });

            const result = await response.json();

            if (!result.status) {
                localStorage.clear("shippingData");
                Swal.fire({
                    icon: "error",
                    title: "Unauthorized",
                    text: result.message || "Invalid token or unauthorized access.",
                });
                router.push("/admin/auth/login");
                return;
            }

            return true;

        } catch (error) {
            console.error("Error:", error);
            setError(error.message || "Something went wrong");
            router.push("/admin/auth/login");
        } finally {
            setLoading(false);
        }
    }, [router]);

   
  
    const fetchSupplier = useCallback(async () => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));

        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData");
            router.push("/admin/auth/login");
            return;
        }

        const admintoken = adminData?.security?.token;
        if (!admintoken) {
            router.push("/admin/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${admintoken}`,
                },
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: errorMessage.error || errorMessage.message || "Network Error.",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
            }

            const result = await response.json();
            if (result) {
                setSuppliers(result?.suppliers || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router, setSuppliers]);



    return (
        <AdminMiddleWareContext.Provider value={{ isAdminStaff, checkAdminRole, setIsAdminStaff, extractedPermissions, setExtractedPermissions, openSubMenus, fetchSupplier, suppliers, setSuppliers, setOpenSubMenus, verifyAdminAuth, error, loading }}>
            {children}
        </AdminMiddleWareContext.Provider>
    );
}
