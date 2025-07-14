'use client';

import { useState, createContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const ProfileContext = createContext();

const ProfileProvider = ({ children }) => {
  const [errors, setErrors] = useState({});
  const [businessErrors, setBusinessErrors] = useState({});
  const [activeMainTab, setActiveMainTab] = useState('create-supplier');
  const [activeSubTab, setActiveSubTab] = useState('profile-edit');
  const [loading, setLoading] = useState(false);
  const [countryData, setCountryData] = useState([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    currentAddress: "",
    permanentAddress: "",
    permanentCity: "",
    permanentPostalCode: "",
    permanentCountry: "",
    permanentState: "",
    companyName: "",
    brandName: "",
    billingAddress: "",
    billingPincode: "",
    billingCountry: "",
    billingState: "",
    billingCity: "",
    profilePicture: '',
    clientEntryType: "",
    //COMPANY
    gstNumber: "",
    gstDocument: "",
    companyPanNumber: "",
    companyPanCardName: "",
    companyPanCardImage: "",
    //indivisual
    aadharNumber: "",
    panCardHolderName: "",
    aadharCardHolderName: "",
    panCardImage: "",
    aadharCardImage: "",


    //
    additionalDocumentUpload: "",
    documentId: "",
    documentName: "",
    documentImage: "",

    //
  });

  const requiredFields = {
    companyName: 'Registered Company Name is required',
    brandName: 'Brand Name is required',
    billingAddress: 'Billing Address is required',
    billingPincode: 'Pincode is required',
    billingCountry: 'Country is required',
    billingState: 'State is required',
    billingCity: 'City is required',
    clientEntryType: 'Client Entry Type is required',
  
  };

  const fetchCountry = useCallback(async () => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`, {
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
          text: result.message || result.error || "Network Error.",
        });
        throw new Error(result.message || result.error || "Something Wrong!");
      }

      setCountryData(result?.countries || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Full Name is required';
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.currentAddress) newErrors.currentAddress = 'Present Address is required';
    if (!formData.permanentAddress) newErrors.permanentAddress = 'Permanent Address is required';
    if (!formData.permanentCity) newErrors.permanentCity = 'City is required';
    if (!formData.permanentPostalCode) newErrors.permanentPostalCode = 'Postal Code is required';
    if (!formData.permanentCountry) newErrors.permanentCountry = 'Country is required';
    if (!formData.permanentState) newErrors.permanentState = 'State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBusiness = () => {
    const newErrors = {};

    const alwaysRequiredFields = [
      'companyName',
      'brandName',
      'billingAddress',
      'billingPincode',
      'billingCountry',
      'billingState',
      'billingCity',
      'clientEntryType'
    ];

    alwaysRequiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = requiredFields[field];
      }
    });



    const {
      gstNumber,
      gstDocument,
      companyPanNumber,
      companyPanCardName,
      companyPanCardImage,

      aadharNumber,
      panCardHolderName,
      aadharCardHolderName,
      panCardImage,
      aadharCardImage,
    } = formData;

    const hasGST =
      !!gstNumber?.trim() ||
      !!gstDocument ||
      !!companyPanNumber?.trim() ||
      !!companyPanCardName?.trim() ||
      !!companyPanCardImage;

    const hasAadhar =
      !!aadharNumber?.trim() ||
      !!panCardHolderName?.trim() ||
      !!aadharCardHolderName?.trim() ||
      !!panCardImage ||
      !!aadharCardImage;


    if (hasGST) {
      if (!gstNumber?.trim()) {
        newErrors.gstNumber = requiredFields.gstNumber || 'GST Number is required';
      }
      if (!companyPanCardImage) {
        newErrors.companyPanCardImage = requiredFields.companyPanCardImage || 'PAN Card Holder Name is required';
      }
      if (!gstDocument) {
        newErrors.gstDocument = requiredFields.gstDocument || 'GST Document is required';
      }
      if (!companyPanNumber) {
        newErrors.companyPanNumber = requiredFields.companyPanNumber || 'Company Pan  is required';
      }
      if (!companyPanCardName) {
        newErrors.companyPanCardName = requiredFields.companyPanCardName || 'Company Pancard Name  is required';
      }
    }

    if (hasAadhar) {
      if (!aadharNumber?.trim()) {
        newErrors.aadharNumber = requiredFields.aadharNumber || 'Aadhar Number is required';
      }
     
      if (!aadharCardHolderName?.trim()) {
        newErrors.aadharCardHolderName = requiredFields.aadharCardHolderName || 'Aadhar Card Holder Name is required';
      }
      if (!panCardHolderName?.trim()) {
        newErrors.panCardHolderName = requiredFields.panCardHolderName || 'PAN Card Holder Name is required';
      }
      if (!panCardImage) {
        newErrors.panCardImage = requiredFields.panCardImage || 'PAN Card Image is required';
      }
      if (!aadharCardImage) {
        newErrors.aadharCardImage = requiredFields.aadharCardImage || 'Aadhar Card Image is required';
      }
    }


    setBusinessErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ProfileContext.Provider value={{
      fetchCountry,
      errors,
      activeMainTab,
      setActiveMainTab,
      businessErrors,
      setBusinessErrors,
      validate,
      requiredFields,
      validateBusiness,
      setErrors,
      formData,
      activeSubTab,
      setActiveSubTab,
      countryData,
      setFormData
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export { ProfileProvider, ProfileContext };
