// contexts/AdminActionContext.js
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useCallback } from "react";
import Swal from "sweetalert2";


export const AdminActionContext = createContext();

export const AdminActionProvider = ({ children }) => {
  const router = useRouter();
  const getAuthToken = () => {
    const adminData = JSON.parse(localStorage.getItem('shippingData'));
    if (adminData?.project?.active_panel !== 'admin') {
      localStorage.removeItem('shippingData');
      router.push('/admin/auth/login');
      return null;
    }
    const token = adminData?.security?.token;
    if (!token) {
      router.push('/admin/auth/login');
    }
    return token;
  };

  return (
    <AdminActionContext.Provider value={{ getAuthToken }}>
      {children}
    </AdminActionContext.Provider>
  );
};

export const useAdminActions = (baseEndpoint, resultKey = "data") => {
  const context = useContext(AdminActionContext);
  if (!context) {
    throw new Error("useAdminActions must be used within an AdminActionProvider");
  }

  const { getAuthToken } = context;

  const fetchAll = useCallback(async (setData, setLoading) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/${baseEndpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error);
      setData(result?.[resultKey] || []);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, resultKey, getAuthToken]);

  const fetchTrashed = useCallback(async (setData, setLoading) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/${baseEndpoint}/trashed`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error);
      setData(result?.[resultKey] || []);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, resultKey, getAuthToken]);

  const softDelete = useCallback(async (id, refetchFn) => {
    const token = getAuthToken();
    if (!token) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This item will be moved to trash. You can restore it later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, move to trash!",
      cancelButtonText: "Cancel",
    });



    if (!confirm.isConfirmed) return;

    try {
      Swal.showLoading();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/${baseEndpoint}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error);
      Swal.fire("Deleted!", result.message || "Item trashed", "success");
      if (refetchFn) await refetchFn();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  }, [baseEndpoint, getAuthToken]);

  const restore = useCallback(async (id, refetchFn) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      // Show loading alert
      Swal.fire({
        title: "Restoring...",
        text: "Please wait while the item is being restored.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/${baseEndpoint}/${id}/restore`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error);

      Swal.close(); // Close the loading alert

      // Show success message
      Swal.fire("Restored!", "Item restored successfully.", "success");

      if (refetchFn) await refetchFn();

    } catch (error) {
      Swal.close(); // Ensure loading is closed on error
      Swal.fire("Error", error.message, "error");
    }
  }, [baseEndpoint, getAuthToken]);

  const destroy = useCallback(async (id, refetchFn) => {
    const token = getAuthToken();
    if (!token) return;

    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the item.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete permanently!",
    });

    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/${baseEndpoint}/${id}/destroy`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.close();

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      Swal.fire({ icon: "success", title: "Deleted!", text: result.message });
      if (refetchFn) await refetchFn();
    } catch (error) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }, [baseEndpoint, getAuthToken]);

  return { fetchAll, fetchTrashed, softDelete, restore, destroy };
};
