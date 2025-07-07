"use client"
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
import { useAdmin } from "./middleware/AdminMiddleWareContext";

function Permission() {
  const router = useRouter();
  const [permissions, setPermission] = useState([]);
  const [loading, setLoading] = useState(false);
  const uniquePanels = [...new Set(permissions.map((p) => p.panel))];
  const [selectedPanel, setSelectedPanel] = useState(null);


  const { verifyAdminAuth, isAdminStaff, checkAdminRole, extractedPermissions } = useAdmin();

  const shouldCheckPermissions = isAdminStaff && extractedPermissions.length > 0;


  const canEdit = shouldCheckPermissions
    ? extractedPermissions.some(
      (perm) =>
        perm.module === "Global Permission" &&
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/global-permission`,
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
  const openModal = (panel) => setSelectedPanel(panel);
  const closeModal = () => setSelectedPanel(null);
  const handleSubmit = async () => {
    const payload = permissions.map((p) => ({
      permissionId: p.id,
      status: p.status,
    }));


    try {
      const adminData = JSON.parse(localStorage.getItem("shippingData"));
      const token = adminData?.security?.token;
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const formdata = new FormData();
      formdata.append("permissions", JSON.stringify(payload));

      Swal.fire({
        title: "Updating Permissions...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: formdata,
        redirect: "follow"
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/global-permission`, requestOptions);

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || result.error);

      Swal.close();
      Swal.fire("Success", "Permissions updated successfully", "success");
      fetchPermission();
      closeModal();
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
        <div className=" bg-white p-4 rounded-md max-w-3xl mx-auto mt-6">
          {permissions.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">Panel List</h2>
              <table className="w-full border border-[#E0E5F2]">
                <thead className="bg-gray-100 ">
                  <tr className="border border-[#E0E5F2]">
                    <th className="border border-[#E0E5F2] px-4 py-2 text-left">Panel</th>
                    <th className="border border-[#E0E5F2] px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uniquePanels.map((panel) => (
                    <tr key={panel} className="border border-[#E0E5F2]">
                      <td className="border border-[#E0E5F2] px-4 py-2 font-medium capitalize">{panel}</td>
                      <td className="border border-[#E0E5F2] text-center capitalize px-4 py-2">
                        <button
                          onClick={() => openModal(panel)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Model */}
              {selectedPanel && (
                <div className="fixed px-6 inset-0 bg-[#000000a8] bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-3xl h-[600px] overflow-auto w-full relative">
                    <h3 className="text-lg text-center font-semibold mb-4">
                      Permissions for <span className="capitalize">{selectedPanel}</span>
                    </h3>
                    <table className="w-full border border-[#E0E5F2]  text-sm">
                      <thead className="border border-[#E0E5F2]">
                        <tr>
                          <th className=" border border-[#E0E5F2] text-left px-2 py-1">Module</th>
                          <th className=" border border-[#E0E5F2] text-left px-2 py-1">Action</th>
                          <th className=" border border-[#E0E5F2] px-2 py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions
                          .filter((p) => p.panel === selectedPanel)
                          .map((item) => (
                            <tr key={item.id} className="border border-[#E0E5F2]">
                              <td className=" border border-[#E0E5F2] px-2 py-1 capitalize">{item.module}</td>
                              <td className=" border border-[#E0E5F2] px-2 py-1 capitalize">{item.action}</td>
                              <td className=" border border-[#E0E5F2] px-2 py-1 text-center">
                                <input
                                  type="checkbox"
                                  disabled={!canEdit}
                                  checked={item.status === true}
                                  onChange={(e) => {
                                    const updatedPermissions = permissions.map((perm) =>
                                      perm.id === item.id ? { ...perm, status: e.target.checked } : perm
                                    );
                                    setPermission(updatedPermissions);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>


                    </table>
                    <button
                      onClick={closeModal}
                      className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-xl"
                    >
                      ×
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>

                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center"> Permissions Not Found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Permission;
