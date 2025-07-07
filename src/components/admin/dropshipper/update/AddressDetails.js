'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { DropshipperProfileContext } from '../DropshipperProfileContext';
import { ProfileContext } from '../../supplier/ProfileContext';
import Select from 'react-select';

const AccountDetails = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { formData, setFormData, setActiveTab, stateData, setStateData, cityData, validateAddress, errorsAddress, setErrorsAddress, setCityData } = useContext(DropshipperProfileContext);

  const { fetchCountry, countryData } = useContext(ProfileContext);

  const [previewUrl, setPreviewUrl] = useState(null);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`, {
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}/states`,
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
  const countryOptions = countryData.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const stateOptions = stateData.map((state) => ({
    value: state.id,
    label: state.name,
  }));
  const cityOptions = cityData.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedFormData = { ...formData };

    if (files?.length) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      updatedFormData[name] = file; // Set the file in formData
    } else {
      updatedFormData[name] = value;
      if (name === "profilePicture") {
        setPreviewUrl(null); // Remove preview if profilePicture is not selected
      }
    }

    setFormData(updatedFormData); // Update the form data with the new file or value

    if (name === "permanentCountry" && value) {
      fetchState(value);
    }
    if (name === "permanentState" && value) {
      fetchCity(value);
    }

    if (errorsAddress[name]) {
      setErrorsAddress({ ...errorsAddress, [name]: '' });
    }
  };

  const handleSubmit = () => {
    if (validateAddress()) {
      setActiveTab('payment_billing');
    }
  };

  useEffect(() => {
    fetchCountry();
  }, [fetchCountry]);

  const inputClasses = (field) =>
    `w-full p-3 border rounded-lg font-bold ${errorsAddress[field] ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
    }`;

  const labelClasses = (field) =>
    `block font-bold mb-1 ${errorsAddress[field] ? 'text-red-500' : 'text-[#232323]'}`;

  const handleCancel = () => {
    setErrorsAddress({});
  };

  return (
    <div className=' py-10 bg-white rounded-tl-none rounded-tr-none p-3 xl:p-10 rounded-2xl'>


      <div className="">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {/* Basic Inputs */}
          {[
            { label: 'Permanent Address', name: 'permanentAddress', type: 'text' },
            { label: 'Postal Code', name: 'permanentPostalCode', type: 'number' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className={labelClasses(name)}>
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                className={inputClasses(name)}
              />
              {errorsAddress[name] && (
                <p className="text-red-500 text-sm mt-1">{errorsAddress[name]}</p>
              )}
            </div>
          ))}

          {/* Country Select */}
          <div>
            <label className={labelClasses('permanentCountry')}>
              Country <span className="text-red-500">*</span>
            </label>
            <Select
              name="permanentCountry"
              options={countryOptions}
              value={countryOptions.find((c) => c.value === formData.permanentCountry) || null}
              onChange={(selected) => {
                handleChange({ target: { name: 'permanentCountry', value: selected?.value } });
              }}
              classNamePrefix="react-select"
              className="react-select-container"
              isSearchable
              placeholder="Select Country"
            />
            {errorsAddress.permanentCountry && (
              <p className="text-red-500 text-sm mt-1">{errorsAddress.permanentCountry}</p>
            )}
          </div>

          <div>
            <label className={labelClasses('permanentState')}>
              State <span className="text-red-500">*</span>
            </label>
            <Select
              name="permanentState"
              options={stateOptions}
              value={stateOptions.find((s) => s.value === formData.permanentState) || null}
              onChange={(selected) => {
                handleChange({ target: { name: 'permanentState', value: selected?.value } });
              }}
              classNamePrefix="react-select"
              className="react-select-container"
              isSearchable
              placeholder="Select State"
            />
            {errorsAddress.permanentState && (
              <p className="text-red-500 text-sm mt-1">{errorsAddress.permanentState}</p>
            )}
          </div>


        </div>
        <div>
          <label className={labelClasses('permanentCity')}>
            City <span className="text-red-500">*</span>
          </label>
          <Select
            name="permanentCity"
            options={cityOptions}
            value={cityOptions.find((c) => c.value === formData.permanentCity) || null}
            onChange={(selected) =>
              handleChange({ target: { name: 'permanentCity', value: selected?.value } })
            }
            classNamePrefix="react-select"
            className="react-select-container"
            isSearchable
            placeholder="Select City"
          />
          {errorsAddress.permanentCity && (
            <p className="text-red-500 text-sm mt-1">{errorsAddress.permanentCity}</p>
          )}
        </div>
        {/* Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
