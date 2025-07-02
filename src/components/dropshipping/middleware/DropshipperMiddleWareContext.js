import { createContext, useState, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const DropshipperMiddleWareContext = createContext();

export const useDropshipper = () => {
    const context = useContext(DropshipperMiddleWareContext);
    if (!context) {
        throw new Error("useAdmin must be used within an DropshipperMiddleWareProvider");
    }
    return context;
};

export default function DropshipperMiddleWareProvider({ children }) {
    const [dropShipperApi, setDropShipperApi] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [isDropshipperStaff, setIsDropshipperStaff] = useState(null);
    const [extractedPermissions, setExtractedPermissions] = useState([]);
    const checkDropshipperRole = () => {
        try {
            const shippingData = JSON.parse(localStorage.getItem("shippingData"));
          
            if (shippingData?.admin?.role === "dropshipper_staff") {
                setIsDropshipperStaff(true);
            }
        } catch (err) {
            console.error("Error reading shippingdata:", err);
            setIsDropshipperStaff(false);
        }

        try {
            const rawPermissions = JSON.parse(localStorage.getItem("dropshipperPermissions")) || [];
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
        const shouldCheckPermissions = isDropshipperStaff && extractedPermissions.length > 0;
        if (!shouldCheckPermissions) return true;
        return extractedPermissions.some(
            (perm) =>
                perm.module === module &&
                perm.action === action &&
                perm.status === true
        );
    };


    const verifyDropShipperAuth = useCallback(async () => {
        setLoading(true);
        const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
        const dropshipper_token = dropshipperData?.security?.token;

        // ✅ Corrected the condition for active panel
        if (dropshipperData?.project?.active_panel !== "dropshipper") {
            localStorage.removeItem("shippingData"); // Correct way to remove item
            router.push("/dropshipping/auth/login");
            return; // Stop further execution
        }

        if (!dropshipper_token) {
            router.push("/dropshipping/auth/login");
            return; // Stop further execution
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/auth/verify`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${dropshipper_token}`,
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
                router.push("/dropshipping/auth/login");
                return;
            }


        } catch (error) {
            console.error("Error:", error);
            setError(error.message || "Something went wrong");
            router.push("/dropshipping/auth/login");
        } finally {
            setLoading(false);
        }
    }, [router, setLoading]);


    return (
        <DropshipperMiddleWareContext.Provider value={{ checkDropshipperRole, isDropshipperStaff, hasPermission, dropShipperApi, extractedPermissions, setDropShipperApi, verifyDropShipperAuth, error, loading }}>
            {children}
        </DropshipperMiddleWareContext.Provider>
    );
}
