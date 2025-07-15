"use client"
import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { useSupplier } from '../middleware/SupplierMiddleWareContext'
import { useSearchParams } from 'next/navigation'
import { HashLoader } from 'react-spinners'

export default function Update() {
  const [formData, setFormData] = useState({
    name: '',
    gst_number: '',
    contact_name: '',
    contact_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',

    postal_code: ''
  });
  const [countryData, setCountryData] = useState([]);
  const [allData, setAllData] = useState([]);

  const [stateData, setStateData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { verifySupplierAuth } = useSupplier();
  const router = useRouter();

  useEffect(() => {
    verifySupplierAuth();
  }, [verifySupplierAuth]);

  const fetchCity = useCallback(async (id) => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${suppliertoken}`,
          },
        }
      );

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
    }
  }, [router]);

  const fetchState = useCallback(async (value) => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${value}/states`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${suppliertoken}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Network Error.",
        });
        throw new Error(
          errorMessage.message || errorMessage.error || "Something Wrong!"
        );
      }

      const result = await response.json();
      if (result) {
        setStateData(result?.states || []);
      }
    } catch (error) {
      console.error("Error fetching state:", error);
    } finally {
    }
  }, [router, setStateData]);

  const fetchcountry = useCallback(async () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${suppliertoken}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text:
            errorMessage.error ||
            errorMessage.message ||
            "Network Error.",
        });
        throw new Error(
          errorMessage.message || errorMessage.error || "Something Wrong!"
        );
      }

      const result = await response.json();
      if (result) {
        setCountryData(result?.countries || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [router, setCountryData,]);



  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Warehouse name is required.';
    if (!formData.gst_number.trim()) errors.gst_number = 'GST number is required.';
    if (!formData.contact_name.trim()) errors.contact_name = 'Contact name is required.';
    if (!formData.contact_number.trim()) errors.contact_number = 'Contact number is required.';
    if (!formData.address_line_1.trim()) errors.address_line_1 = 'Address Line 1 is required.';
    if (!formData.city.trim()) errors.city = 'City is required.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (!formData.postal_code.trim()) errors.postal_code = 'Postal code is required.';
    if (!formData.country.trim()) errors.country = 'Country code is required.';
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name == "country") {
      fetchState(value)
    }
    if (name == "state") {
      fetchCity(value)
    }
  };

  const fetchwarehouse = useCallback(async () => {
    const supplierData = JSON.parse(localStorage.getItem("shippingData"));

    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const suppliertoken = supplierData?.security?.token;
    if (!suppliertoken) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${suppliertoken}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text: errorMessage.message || errorMessage.error || "Network Error.",
        });
        throw new Error(errorMessage.message);
      }

      const result = await response.json();
      const warehouse = result?.warehouse || {};

      setFormData({
        name: warehouse.name || '',
        gst_number: warehouse.gst_number || '',
        contact_name: warehouse.contact_name || '',
        contact_number: warehouse.contact_number || '',
        address_line_1: warehouse.address_line_1 || '',
        address_line_2: warehouse.address_line_2 || '',
        city: warehouse.cityId || '',
        state: warehouse.stateId || '',
        country: warehouse.countryId || '',
        postal_code: warehouse.postal_code || ''
      });
      fetchState(warehouse?.countryId);
      fetchCity(warehouse?.stateId);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
    } finally {
      setLoading(false);
    }
  }, [router, id]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const supplierData = JSON.parse(localStorage.getItem("shippingData"));
    if (supplierData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = supplierData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    setValidationErrors({});

    try {
      Swal.fire({
        title: 'Updating Warehouse...',
        text: 'Please wait while we save your warehouse.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/warehouse/${id}`;
      const form = new FormData();
      for (const key in formData) {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form,
      });

      if (!response.ok) {
        Swal.close();
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: errorMessage.message || "An error occurred",
        });
        throw new Error(errorMessage.message || "Update failed");
      }

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Warehouse Updated",
        text: `The warehouse has been updated successfully!`,
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setFormData({
            name: '',
            gst_number: '',
            contact_name: '',
            contact_number: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: ''
          });
          router.push("/supplier/warehouse");
        }
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
      setError(error.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchwarehouse();
      await fetchcountry();
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <HashLoader size={60} color="#F97316" loading={true} />
      </div>
    );
  }

  return (
    <section className="add-warehouse xl:w-8/12">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl p-5">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            <div>
              <label className="font-bold block text-[#232323]">
                Warehouse Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                onChange={handleChange}
                value={formData?.name}
                id="name"
                name="name"
                placeholder="Charlene Store House"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.name ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
              />
              {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
            </div>

            <div>
              <label className="font-bold block text-[#232323]">
                Warehouse GST Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.gst_number}
                onChange={handleChange}
                name="gst_number"
                id="gst_number"
                placeholder="GST289571412"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.gst_number ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
              />
              {validationErrors.gst_number && <p className="text-red-500 text-sm mt-1">{validationErrors.gst_number}</p>}
            </div>

            <div>
              <label className="font-bold block text-[#232323]">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.contact_name}
                onChange={handleChange}
                name="contact_name"
                id="contact_name"
                placeholder="Charlene Reed"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.contact_name ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
              />
              {validationErrors.contact_name && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_name}</p>}
            </div>

            <div>
              <label className="font-bold block text-[#232323]">
                Contact No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.contact_number}
                onChange={handleChange}
                name="contact_number"
                id="contact_number"
                placeholder="+9876543210"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.contact_number ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
              />
              {validationErrors.contact_number && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_number}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="font-bold block text-[#232323]">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address_line_1"
              value={formData?.address_line_1}
              onChange={handleChange}
              id="address_line_1"
              placeholder="San Jose, California, USA"
              className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.address_line_1 ? 'border-red-500' : 'border-[#DFEAF2]'
                }`}
            />
            {validationErrors.address_line_1 && <p className="text-red-500 text-sm mt-1">{validationErrors.address_line_1}</p>}
          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-3 mt-3">
            <div>
              <label className="font-bold block text-[#232323]">Address Line 2</label>
              <input
                type="text"
                value={formData?.address_line_2}
                onChange={handleChange}
                name="address_line_2"
                id="address_line_2"
                placeholder="San Jose, California, USA"
                className="text-[#718EBF] border w-full border-[#DFEAF2] rounded-md p-3 mt-2 font-bold"
              />
            </div>
            <div>
              <label className="font-bold block text-[#232323]">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                onChange={handleChange}
                name="country"
                id="country"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.country ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
                value={formData.country}
                placeholder="California"
              >
                {countryData?.map((item, index) => {
                  return (
                    <option value={item.id} key={index}>{item.name}</option>
                  )
                })}
              </select>
              {validationErrors.country && <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>}
            </div>


            <div>
              <label className="font-bold block text-[#232323]">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData?.postal_code}
                onChange={handleChange}
                name="postal_code"
                id="postal_code"
                placeholder="45962"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.postal_code ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
              />
              {validationErrors.postal_code && <p className="text-red-500 text-sm mt-1">{validationErrors.postal_code}</p>}
            </div>

            <div>
              <label className="font-bold block text-[#232323]">
                State <span className="text-red-500">*</span>
              </label>
              <select
                onChange={handleChange}
                name="state"
                id="state"
                className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.state ? 'border-red-500' : 'border-[#DFEAF2]'
                  }`}
                value={formData.state}
                placeholder="California"
              >
                {stateData?.map((item, index) => {
                  return (
                    <option value={item.id} key={index}>{item.name}</option>
                  )
                })}
              </select>
              {validationErrors.state && <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>}
            </div>
          </div>

          <div>
            <label className="font-bold block text-[#232323]">
              City <span className="text-red-500">*</span>
            </label>

            <select
              onChange={handleChange}
              name="city"
              id="city"
              value={formData.city}
              className={`text-[#718EBF] border w-full rounded-md p-3 mt-2 font-bold ${validationErrors.city ? 'border-red-500' : 'border-[#DFEAF2]'
                }`}>
              {cityData?.map((item, index) => {
                return (
                  <option value={item.id} key={index}>{item.name}</option>
                )
              })}
            </select>
            {validationErrors.city && <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button type="submit" className="bg-orange-500 text-white md:px-15 px-5 rounded-md p-3">
              Update
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white md:px-15 px-5 rounded-md p-3"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

    </section>
  );
}
