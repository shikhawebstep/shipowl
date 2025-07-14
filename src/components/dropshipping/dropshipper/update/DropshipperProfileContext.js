'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { useState, createContext, useCallback } from 'react';
const DropshipperProfileContext = createContext();

const DropshipperProfileProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("account_details");
  const [cityData, setCityData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [errorsAddress, setErrorsAddress] = useState({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState({});

  const fetchCountry = useCallback(async () => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
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
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Full Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Mobile Number is required';
    if (!formData.website) newErrors.website = 'Website URL is required';
    if (!formData.referralCode) newErrors.referralCode = 'Referral Code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: null, // or fileInput.files[0]
    name: "",
    email: "",
    phoneNumber: "",
    website: "",
    referralCode: "",
    status: "active",

    permanentAddress: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
    permanentPostalCode: "",

    gstNumber: "",
    gstDocument: null, // or fileInput.files[0]

    panCardHolderName: "",
    aadharCardHolderName: "",
    panCardImage: null, // or fileInput.files[0]
    aadharCardImage: null, // or fileInput.files[0]



  });
  const fetchSupplier = useCallback(async () => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;

    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: errorMessage.message || "Network Error.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const suppliers = result.dropshipper || {};

      const companyDetail = suppliers?.companyDetail || {};
      if (suppliers.permanentCountryId) {
        fetchState(suppliers.permanentCountryId);
      }
      if (suppliers.permanentStateId) {
        fetchCity(suppliers.permanentStateId);
      }
      setFormData({
        profilePicture: suppliers.profilePicture || null,
        name: suppliers.name || "",
        id: suppliers.id || "",
        email: suppliers.email || "",
        phoneNumber: suppliers.phoneNumber || "",
        website: suppliers?.website || "",
        referralCode: suppliers?.referralCode || "",
        status: suppliers?.status || "",

        permanentAddress: suppliers.permanentAddress || "",
        permanentCity: suppliers.permanentCityId || "",
        permanentState: suppliers.permanentStateId || "",
        permanentCountry: suppliers.permanentCountryId || "",
        permanentPostalCode: suppliers.permanentPostalCode || "",

        gstNumber: companyDetail?.gstNumber || "",
        gstDocument: companyDetail?.gstDocument || null,
        companyid: companyDetail?.id || null,


        panCardHolderName: companyDetail?.panCardHolderName || "",
        aadharCardHolderName: companyDetail?.aadharCardHolderName || "",
        panCardImage: companyDetail?.panCardImage || null,
        aadharCardImage: companyDetail?.aadharCardImage || null,

      });




    } catch (error) {
      console.error("Error fetching supplier:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id, setFormData]);

  const fetchCity = useCallback(async (id) => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
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

      setCityData(result?.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);
  const fetchState = useCallback(async (id) => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}/states`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${dropshippertoken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong!",
          text: result.message || result.error || "Network Error.",
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


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    const newErrors = {};
    if (!formData.permanentAddress) newErrors.permanentAddress = 'Permanent Address is required';
    if (!formData.permanentPostalCode) newErrors.permanentPostalCode = 'Postal Code is required';
    if (!formData.permanentCity) newErrors.permanentCity = 'City is required';
    if (!formData.permanentCountry) newErrors.permanentCountry = 'Country is required';
    if (!formData.permanentState) newErrors.permanentState = 'State is required';

    setErrorsAddress(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  return (
    <DropshipperProfileContext.Provider value={{ errors, fetchCountry, countryData, setCountryData, loading, setLoading, setErrors, errorsAddress, setErrorsAddress, validate, validateAddress, activeTab, setActiveTab, formData, setFormData, setStateData, setCityData, cityData, stateData, handleChange, fetchSupplier }}>
      {children}
    </DropshipperProfileContext.Provider>
  );
};

export { DropshipperProfileProvider, DropshipperProfileContext };
