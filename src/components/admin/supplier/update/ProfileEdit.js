'use client';
import { useContext, useState, useCallback } from 'react';
import { ProfileEditContext } from './ProfileEditContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Pencil } from 'lucide-react';
import Select from 'react-select';
import { useImageURL } from "@/components/ImageURLContext";
const ProfileEdit = () => {
  const router = useRouter();
  const {fetchImages} = useImageURL();
  const [loading, setLoading] = useState(false);
  const { formData, validate, errors, setErrors, setFormData, stateData, cityData, setCityData, setStateData, setActiveTab, countryData } = useContext(ProfileEditContext);
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


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedFormData = { ...formData };

    if (files?.length) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      updatedFormData[name] = file;
    } else {
      updatedFormData[name] = value;

      // Fetch states/cities AFTER updating the form data
      if (name === "permanentCountry") {
        fetchState(value); // <-- Use `value` directly
      }
      if (name === "permanentState") {
        fetchCity(value);  // <-- Use `value` directly
      }
    }

    setFormData(updatedFormData);

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };


  const countryOptions = countryData.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const stateOptions = stateData?.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  const cityOptions = cityData?.map((city) => ({
    value: city.id,
    label: city.name,
  }));
  const handleSubmit = () => {
    if (validate()) {
      setActiveTab('business-info');
    }
  };



  const inputClasses = (field) =>
    `w-full p-3 border rounded-lg font-bold ${errors[field] ? 'border-red-500 text-red-500' : 'border-[#DFEAF2] text-[#718EBF]'
    }`;

  const labelClasses = (field) =>
    `block font-bold mb-1 ${errors[field] ? 'text-red-500' : 'text-[#232323]'}`;

  const handleCancel = () => {
    setErrors({});
  };

  return (
    <div className='md:flex gap-4 xl:w-10/12 py-10 bg-white rounded-tl-none rounded-tr-none p-3 xl:p-10 rounded-2xl'>
      <div className='md:w-2/12'>
        <div className="relative">
          <Image
             src={fetchImages(formData.profilePicture) || previewUrl}
            alt="Profile image"
            height={50}
            width={50}
            className="w-full h-full max-w-[100px] object-cover rounded-full"
          />


          {/* Hidden input */}
          <input
            type="file"
            id="upload"
            name="profilePicture"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          {/* Edit Icon */}
          <label
            htmlFor="upload"
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer"
          >
            <Pencil size={18} className="text-gray-600" />
          </label>
        </div>

      </div>

      <div className="md:w-10/12">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {/* Basic Inputs */}
          {[
            { label: 'Your Name', name: 'name', type: 'text' },
            { label: 'User Name', name: 'username', type: 'text' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Present Address', name: 'currentAddress', type: 'text' },
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
              {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
              )}
            </div>
          ))}
          <div className="relative">
            <label className={labelClasses('permanentCountry')}>
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Select
                name="permanentCountry"
                value={countryOptions.find(opt => opt.value === formData.permanentCountry) || null}
                onChange={(selected) => handleChange({ target: { name: "permanentCountry", value: selected?.value } })}
                options={countryOptions}
                placeholder="Select Country"

              />
              {loading && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {errors.permanentCountry && (
              <p className="text-red-500 text-sm mt-1">{errors.permanentCountry}</p>
            )}
          </div>

          {/* State Select */}
          <div className="relative">
            <label className={labelClasses('permanentState')}>
              State <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Select
                name="permanentState"
                value={stateOptions.find(opt => opt.value === formData.permanentState) || null}
                onChange={(selected) => handleChange({ target: { name: "permanentState", value: selected?.value } })}
                options={stateOptions}
                placeholder="Select State"

              />
              {loading && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {errors.permanentState && (
              <p className="text-red-500 text-sm mt-1">{errors.permanentState}</p>
            )}
          </div>

          {/* City Select */}


        </div>
        
          <div className="relative">
            <label className={labelClasses('permanentCity')}>
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Select
                name="permanentCity"
                value={cityOptions.find(opt => opt.value === formData.permanentCity) || null}
                onChange={(selected) => handleChange({ target: { name: "permanentCity", value: selected?.value } })}
                options={cityOptions}
                placeholder="Select City"

              />
              {loading && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {errors.permanentCity && (
              <p className="text-red-500 text-sm mt-1">{errors.permanentCity}</p>
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

export default ProfileEdit;
