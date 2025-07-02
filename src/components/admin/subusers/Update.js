"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
// import Select from "react-select";
import { HashLoader } from "react-spinners";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import Image from "next/image";
import 'swiper/css/navigation';
import dynamic from 'next/dynamic';
import { useImageURL } from "@/components/ImageURLContext";

const Select = dynamic(() => import('react-select'), { ssr: false });
export default function Update() {
  const { fetchImages } = useImageURL();
  const router = useRouter();
  const [permission, setPermission] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingPermission, setLoadingPermission] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "active",
    profilePicture: null,
    phoneNumber: "",
    permanentAddress: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
    permissions: '',
  });
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const fetchSubuser = useCallback(async () => {
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
      const response = await fetch(
        `/api/admin/staff/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admintoken}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text: errorMessage.message || "Your session has expired. Please log in again.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const users = result?.adminStaff || {};
      setPermission(result?.staffPermissions)
      if (users?.permanentCityId) {
        fetchStateList(users?.permanentCountryId);
      }
      if (users?.permanentStateId) {
        fetchCity(users?.permanentStateId);
      }

      setFormData({
        name: users?.name || "",
        email: users?.email || "",
        status: users?.status || "",
        profilePicture: users?.profilePicture || null,
        phoneNumber: users?.phoneNumber || "",
        permanentAddress: users?.permanentAddress || "",
        permanentCity: users?.permanentCityId || "",
        permanentState: users?.permanentStateId || "",
        permanentCountry: users?.permanentCountryId || "",
        permissions: Array.isArray(users?.adminStaffPermissions)
          ? users.adminStaffPermissions.map(p => p.adminStaffPermissionId).join(',')
          : '', image: users?.profilePicture || '',
      });

    } catch (error) {
      console.error("Error fetching Company:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id]);


  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };


  const handlePermissionChange = (permId) => {
    setFormData((prev) => {
      const currentPermissions = Array.isArray(prev.permissions)
        ? prev.permissions.map(String)
        : (prev.permissions || '').split(',').filter(Boolean);

      // Toggle permission
      const toggledPermissions = currentPermissions.includes(String(permId))
        ? currentPermissions.filter((p) => p !== String(permId))
        : [...currentPermissions, String(permId)];

      // Get allowed permissions from groupedPermissions["Admin"]
      const allowedPermissionIds = Object.values(groupedPermissions?.["Admin"] || {})
        .flat()
        .map((p) => String(p.id));

      // Only keep toggled permissions that are allowed
      const filteredPermissions = toggledPermissions.filter((id) =>
        allowedPermissionIds.includes(id)
      );

      return {
        ...prev,
        permissions: filteredPermissions.join(','),
      };
    });
  };


  const validate = () => {
    const newErrors = {};
    const {
      name,
      email,
      permanentCountry,
      permanentState,
      permanentCity,
      permissions,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!permanentCountry) newErrors.permanentCountry = "Country is required";
    if (!permanentState) newErrors.permanentState = "State is required";
    if (!permanentCity) newErrors.permanentCity = "City is required";
    if (permissions.length === 0) newErrors.permissions = "At least one permission is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Inside handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const adminData = JSON.parse(localStorage.getItem("shippingData"));
  const token = adminData?.security?.token;

  // ✅ Step 1: Clean permissions (copying formData to avoid mutation)
  const cleanedFormData = { ...formData };

  if (cleanedFormData.permissions) {
    const allowedPermissionIds = Object.values(groupedPermissions?.["Admin"] || {})
      .flat()
      .map((p) => String(p.id));

    const currentPermissions = Array.isArray(cleanedFormData.permissions)
      ? cleanedFormData.permissions.map(String)
      : String(cleanedFormData.permissions).split(',').filter(Boolean);

    const filteredPermissions = currentPermissions.filter((id) =>
      allowedPermissionIds.includes(id)
    );

    cleanedFormData.permissions = filteredPermissions.join(',');
  }

  setLoading(true);
  const data = new FormData();

  // ✅ Step 2: Append fields to FormData
  Object.entries(cleanedFormData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (value instanceof File || value instanceof Blob) {
        data.append(key, value);
      } else if (Array.isArray(value) || typeof value === 'object') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value);
      }
    }
  });

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/staff/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to Update admin");

    Swal.fire("Success", "Admin updated successfully!", "success");

    // ✅ Step 3: Reset form
    setFormData({
      name: "",
      email: "",
      status: "",
      profilePicture: null,
      phoneNumber: "",
      permanentAddress: "",
      permanentCity: "",
      permanentState: "",
      permanentCountry: "",
      permissions: [],
    });

    router.push('/admin/sub-user/list');
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  } finally {
    setLoading(false);
  }
};


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




  const fetchCountryAndState = useCallback(() => {
    fetchProtected(
      "/api/location/country",
      setCountryData,
      "countries",
      setLoadingCountries
    );
  }, [fetchProtected]);

  const fetchStateList = useCallback((countryId) => {
    fetchProtected(
      `/api/location/country/${countryId}/states`,
      setStateData,
      "states",
      setLoadingStates
    );
  }, [fetchProtected]);

  const fetchCity = useCallback((stateId) => {
    fetchProtected(
      `/api/location/state/${stateId}/cities`,
      setCityData,
      "cities",
      setLoadingCities
    );
  }, [fetchProtected]);

  useEffect(() => {
    fetchSubuser();

    fetchCountryAndState();
  }, [fetchSubuser])



  const selectOptions = (data) =>
    data.map((item) => ({
      value: item.id || item._id,
      label: item.name,
    }));

  const groupedPermissions = permission.reduce((acc, perm) => {
    if (!acc[perm.panel]) acc[perm.panel] = {};
    if (!acc[perm.panel][perm.module]) acc[perm.panel][perm.module] = [];
    acc[perm.panel][perm.module].push(perm);
    return acc;
  }, {});

  const formFields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Email", name: "email", type: "email", required: true },
    { label: "Phone Number", name: "phoneNumber", type: "text" },
    { label: "Permanent Address", name: "permanentAddress", type: "text" },
  ];
  if (loading || loadingPermission) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="bg-white lg:p-10 p-3  rounded-2xl">
      {/* <h2 className="text-xl font-semibold">Create Subuser</h2> */}
      <div className="mb-2">
        <label className="block text-[#232323] font-bold mb-1">Profile Picture </label>
        <input
          type="file"
          name="profilePicture"
          accept="image/*"
          onChange={handleChange}
          className={`w-full p-3  file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100  border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]
                  }`}
        />
        {formData?.image && (
          <div className="mt-2">
            <Swiper
              key={formData.id}
              modules={[Navigation]}
              slidesPerView={2}
              loop={formData.image?.split(',').length > 1}
              navigation={true}
              className="mySwiper w-full ms-2"
            >
              {formData.image?.split(',').map((img, index) => (
                <SwiperSlide key={index} className="relative gap-3">
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={500}
                    height={500}
                    className="me-3 p-2 object-cover rounded"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

        )}
        {errors.profilePicture && <p className="text-red-500 text-sm">{errors.profilePicture}</p>}
      </div>
      <div className="md:grid grid-cols-2 gap-4">
        {formFields.map(({ label, name, type, required }) => (
          <div key={name}>
            <label className="block text-[#232323] font-bold mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg font-bold ${errors[name] ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
                }`}
            />
            {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        ))}

        {/* Move the Status dropdown outside the loop */}
        <div className="">
          <label className="block text-[#232323] font-bold mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status || ''}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg font-bold border-[#DFEAF2] text-[#718EBF]
                  }`}          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      </div>



      <div className="grid lg:grid-cols-3 md:grid-cols-2gap-4 mt-3">
        {["permanentCountry", "permanentState", "permanentCity"].map((field) => (
          <div key={field} className="relative">
            <label className="block text-[#232323] font-bold mb-1 capitalize">
              {field.replace("permanent", "")} <span className="text-red-500">*</span>
            </label>

            <Select
              isDisabled={
                (field === "permanentCountry" && loadingCountries) ||
                (field === "permanentState" && loadingStates) ||
                (field === "permanentCity" && loadingCities)
              }
              name={field}
              value={selectOptions(
                field === "permanentCountry" ? countryData :
                  field === "permanentState" ? stateData :
                    cityData
              ).find((item) => item.value === formData[field])}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";

                setFormData((prev) => ({ ...prev, [field]: value }));

                if (field === "permanentCountry") {
                  fetchStateList(value); // <-- call with selected country ID
                }
                if (field === "permanentState") {
                  fetchCity(value); // <-- call with selected country ID
                }
              }}

              options={selectOptions(
                field === "permanentCountry" ? countryData :
                  field === "permanentState" ? stateData :
                    cityData
              )}
              isClearable
            />

            {((field === "permanentCountry" && loadingCountries) ||
              (field === "permanentState" && loadingStates) ||
              (field === "permanentCity" && loadingCities)) && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                </div>
              )}

            {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
          </div>

        ))}
      </div>

      <div>
        <label className="block text-[#232323] font-bold mb-1 mt-2">Permissions <span className="text-red-500">*</span></label>
        <div className="space-y-4">
          {groupedPermissions?.Admin && (
            <div className="space-y-4">
              {Object.entries(groupedPermissions.Admin).map(([module, perms]) => (
                <div key={module} className="space-y-2">
                  {/* Module Name and Action List */}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold capitalize">{module}</h4>

                  </div>

                  {/* Permission Checkboxes */}
                  <div className="grid border p-3 border-[#DFEAF2] rounded-md grid-cols-2 lg:grid-cols-4 gap-2 md:grid-cols-3">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(formData.permissions)
                              ? formData.permissions.includes(String(perm.id))
                              : String(formData.permissions || '')
                                .split(',')
                                .includes(String(perm.id))
                          }
                          onChange={() => handlePermissionChange(perm.id)}
                        />


                        <span className="capitalize text-[#232323] font-bold">{perm.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.permissions && <p className="text-red-500 text-sm">{errors.permissions}</p>}
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
