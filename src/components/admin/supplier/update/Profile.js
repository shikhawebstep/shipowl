"use client";

import { useContext, useCallback, useEffect, useState } from "react";
import ProfileEdit from './ProfileEdit'
import BusinessInfo from './BusinessInfo';
import { ProfileEditContext } from "./ProfileEditContext";
import { useRouter, useSearchParams } from 'next/navigation';
import { HashLoader } from 'react-spinners';
import Swal from "sweetalert2";
export default function Profile() {

  const { activeTab, validateBusiness, validate, fetchCountry, formData, setActiveTab, setFormData, setCityData, setStateData } = useContext(ProfileEditContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);


  const id = searchParams.get("id");

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${id}`, {
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
          title: "Something went wrong!",
          text: errorMessage.message || "Your session has expired. Please log in again.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const suppliers = result?.supplier || {};
      const companyDetail = suppliers?.companyDetail || {};
   

      setFormData({
        name: suppliers.name || "",
        id: suppliers.id || "",
        username: suppliers.username || "",
        email: suppliers.email || "",
        currentAddress: suppliers.currentAddress || "",
        permanentAddress: suppliers.permanentAddress || "",
        permanentCity: suppliers.permanentCityId || "",
        permanentState: suppliers.permanentStateId || "",
        permanentPostalCode: suppliers.permanentPostalCode || "",
        permanentCountry: suppliers.permanentCountryId || "",
        profilePicture: suppliers.profilePicture || "",
        companyName: companyDetail.companyName || "",
        brandName: companyDetail.brandName || "",
        billingAddress: companyDetail.billingAddress || "",
        billingPincode: companyDetail.billingPincode || "",
        billingState: companyDetail.billingStateId || "",
        billingCountry: companyDetail.billingCountryId || "",
        billingCity: companyDetail.billingCityId || "",
        clientEntryType: companyDetail.clientEntryType || "",
        gstNumber: companyDetail.gstNumber || "",
        companyPanNumber: companyDetail.companyPanNumber || "",
        aadharNumber: companyDetail.aadharNumber || "",
        gstDocument: companyDetail.gstDocument || "",
        panCardHolderName: companyDetail.panCardHolderName || "",
        aadharCardHolderName: companyDetail.aadharCardHolderName || "",
        panCardImage: companyDetail.panCardImage || "",
        aadharCardImage: companyDetail.aadharCardImage || "",
        companyPanCardName: companyDetail.companyPanCardName || "",
        companyPanCardImage: companyDetail.companyPanCardImage || "",
        additionalDocumentUpload: companyDetail.additionalDocumentUpload || "",
        documentId: companyDetail.documentId || "",
        documentName: companyDetail.documentName || "",
        documentImage: companyDetail.documentImage || "",
        companyid: companyDetail.id || "",
      });

         if (activeTab == "profile-edit") {
        await fetchCountry();
        if (suppliers.permanentCountryId) {
          await fetchState(suppliers.permanentCountryId);
        }
        if (suppliers.permanentStateId) {
          await fetchCity(suppliers.permanentStateId);
        }
      }

      if (activeTab == "business-info") {
        await fetchCountry();
        if (companyDetail.billingCountryId) {
          await fetchState(companyDetail.billingCountryId);
        }
        if (companyDetail.billingStateId) {
          await fetchCity(companyDetail.billingStateId);
        }
      }


    } catch (error) {
      console.error("Error fetching supplier:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id, setFormData]);

  const fetchCity = useCallback(async (id) => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${formData?.permanentState || id}/cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admintoken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text: result.message || result.error || "Your session has expired. Please log in again.",
        });
        throw new Error(result.message || result.error || "Something Wrong!");
      }

      setCityData(result?.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);
  const fetchState = useCallback(async (id) => {
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
        `/api/location/country/${formData?.permanentCountry || id}/states`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admintoken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: result.message || result.error || "Your session has expired. Please log in again.",
        });
        throw new Error(result.message || result.error || "Something Wrong!");
      }

      setStateData(result?.states || []);
    } catch (error) {
      console.error("Error fetching states:", error); // <- corrected message: "states" instead of "cities"
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (id) fetchSupplier();
  }, [fetchSupplier, id]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }
  const tabs = [
    { id: "profile-edit", label: "Personal Information" },
    { id: "business-info", label: "Business Information" },
  ];
  const handleTabClick = async (tabId) => {
    if (activeTab === 'profile-edit') {
      const isValid = await validate();
      if (!isValid) return;
    }

    if (activeTab === 'business-info') {

      const isValid = await validateBusiness();
      if (!isValid) return;
    }

    setActiveTab(tabId);
  };


  return (
    <div className="">
      <div className={`flex border-b bg-white pt-5 xl:gap-8 overflow-auto px-4 rounded-tl-2xl rounded-tr-2xl  border-[#F4F5F7] ${activeTab == "profile-edit" ? "xl:w-10/12" : "w-full"}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 text-lg whitespace-nowrap font-medium ${activeTab === tab.id
              ? 'border-b-3 border-orange-500 text-orange-500'
              : 'text-[#718EBF]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="">
        {activeTab === "profile-edit" && <ProfileEdit />}
        {activeTab === "business-info" && <BusinessInfo />}
      </div>

    </div>
  )
}
