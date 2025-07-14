import { createContext, useState, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const SupplierMiddleWareContext = createContext();

export const useSupplier = () => {
    const context = useContext(SupplierMiddleWareContext);
    if (!context) {
        throw new Error("useAdmin must be used within an SupplierMiddleWareProvider");
    }
    return context;
};

export default function SupplierMiddleWareProvider({ children }) {
    const [supplierApi, setSupplierApi] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [isSupplierStaff, setIsSupplierStaff] = useState(null);
    const [extractedPermissions, setExtractedPermissions] = useState([]);
    const checkSupplierRole = () => {
        try {
            const shippingData = JSON.parse(localStorage.getItem("shippingData"));
            if (shippingData?.supplier?.role === "supplier") {
                setIsSupplierStaff(true);
            }
        } catch (err) {
            console.error("Error reading shippingdata:", err);
            setIsSupplierStaff(false);
        }

        try {
            const rawPermissions = JSON.parse(localStorage.getItem("supplierPermissions")) || [];
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


    const hasPermission = (module, action) => {
        const shouldCheckPermissions = isSupplierStaff && extractedPermissions.length > 0;
        if (!shouldCheckPermissions) return true;
        return extractedPermissions.some(
            (perm) =>
                perm.module === module &&
                perm.action === action &&
                perm.status === true
        );
    };
    const verifySupplierAuth = useCallback(async () => {
        setLoading(true);
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        if (!dropshipperData?.project?.active_panel == "supplier") {
            localStorage.clear("shippingData");
            router.push("/supplier/auth/login");
        }
        const suppliertoken = dropshipperData?.security?.token;
        if (!suppliertoken) {
            router.push("/supplier/auth/login");

        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/auth/verify`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${suppliertoken}`,
                },
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: errorMessage.error || errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message || errorMessage.error || "Something Wrong!");
            }

            const result = await response.json();

            if (result.message !== "Token is valid") {
                Swal.fire({
                    icon: "error",
                    title: "Unauthorized",
                    text: "Invalid token or unauthorized access.",
                });
                router.push("/supplier/auth/login");
                return;
            }


        } catch (error) {
            console.error("Error:", error);
            setError(error.message || "Something went wrong");
            router.push("/supplier/auth/login");
        } finally {
            setLoading(false);
        }
    }, [router]);






    return (
        <SupplierMiddleWareContext.Provider value={{ hasPermission, isSupplierStaff, extractedPermissions, checkSupplierRole, supplierApi, setSupplierApi, verifySupplierAuth, error, loading }}>
            {children}
        </SupplierMiddleWareContext.Provider>
    );
}
