'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import { ProfileEditContext } from './ProfileEditContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Select from 'react-select';
import { useImageURL } from "@/components/ImageURLContext";
const BusinessInfo = () => {
  const { formData, businessErrors, validateBusiness, setBusinessErrors, setFiles, files, setFormData, stateData, cityData, setCityData, setStateData, setActiveTab, countryData } = useContext(ProfileEditContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { fetchImages } = useImageURL();
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Handle file input (multiple files)
    if (files) {
      setFiles((prev) => ({
        ...prev,
        [name]: Array.from(files), // Store files as an array
      }));
    } else {
      // Handle text input (single value)
      setFormData((prev) => ({
        ...prev,
        [name]: value, // Store value for text-based inputs
      }));
    }

    // Optional: Fetch states and cities based on country and state selections
    if (name === "billingCountry" && value) {
      fetchState(value); // fetch states based on country selection
    }

    if (name === "billingState" && value) {
      fetchCity(value); // fetch cities based on state selection
    }

    // Clear the field-specific error message
    setBusinessErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '', // Reset error for the field
    }));
  };

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
          text: result.message || result.error || "Network Error.",
        });
        throw new Error(result.message || result.error || "Something Wrong!");
      }

      setStateData(result?.states || []);
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
          title: "Something went wrong!",
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

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const handleImageDelete = async (index, type) => {
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Deleting Image...',
        text: 'Please wait while we remove the image.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${formData.id}/company/${formData.companyid}/image/${index}?type=${type}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        Swal.close();
        const errorMessage = await response.json();
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: errorMessage.message || errorMessage.error || "An error occurred",
        });
        throw new Error(errorMessage.message || errorMessage.error || "Submission failed");
      }

      const result = await response.json();
      Swal.close();

      if (result) {
        Swal.fire({
          icon: "success",
          title: "Image Deleted",
          text: "The image has been deleted successfully!",
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            window.location.reload(); // 🔄 Refresh the page
          }
        });
      }

    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateBusiness()) return;

    setLoading(true);
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    if (!adminData?.project?.active_panel === "admin") {
      localStorage.removeItem("shippingData");
      router.push("/admin/auth/login");
      return;
    }

    const token = adminData?.security?.token;
    if (!token) {
      router.push("/admin/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Updating Supplier...',
        text: 'Please wait while we save your Supplier.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/supplier/${id}`;
      const form = new FormData();

      // Append all basic formData (excluding files)
      for (const key in formData) {
        const value = formData[key];

        if (value === null || value === undefined || value === '') continue;

        const isFileKey = [
          'panCardImage',
          'companyPanCardImage',
          'gstDocument',
          'additionalDocumentUpload',
          'documentImage',
          'aadharCardImage',
          'profilePicture'
        ].includes(key);

        if (!isFileKey) {
          if (Array.isArray(value) || typeof value === 'object') {
            form.append(key, JSON.stringify(value));
          } else {
            form.append(key, value);
          }
        }
      }

      // Append files from the files object
      const fileKeys = [
        'panCardImage',
        'companyPanCardImage',
        'gstDocument',
        'additionalDocumentUpload',
        'documentImage',
        'aadharCardImage',
        'profilePicture'
      ];

      fileKeys.forEach((key) => {
        if (files[key] && Array.isArray(files[key])) {
          files[key].forEach(file => {
            form.append(key, file, file.name);
          });
        }
      });

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: result.message || result.error || "An error occurred",
        });

        if (result.error && typeof result.error === 'object') {
          const entries = Object.entries(result.error);
          let focused = false;

          entries.forEach(([key, message]) => {
            setErrors((prev) => ({
              ...prev,
              [key]: message,
            }));

            if (!focused) {
              const tab = getTabByFieldName(key);
              if (tab) setActiveTab(tab);

              setTimeout(() => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) input.focus();
              }, 300);

              focused = true;
            }
          });
        }

        throw new Error(result.message || result.error || "Submission failed");
      }

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Supplier updated",
        text: `The supplier has been updated successfully!`,
        showConfirmButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          setFormData({});
          setActiveTab("profile-edit")
          router.push("/admin/supplier/list");

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
      setAccountErrors({});
    } finally {
      setLoading(false);
    }
  };



  const labelClasses = (field) => "block text-[#232323] font-bold mb-1";
  const inputClasses = (field) =>
    `w-full p-3 border rounded-lg font-bold ${businessErrors[field] ? 'border-red-500' : 'border-[#DFEAF2]'} text-[#718EBF]`;

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


  const requiredFields2 = {
    ...(hasGST && {
      gstNumber: true,
      gstDocument: true,
      companyPanNumber: true,
      companyPanCardName: true,
      companyPanCardImage: true,
    }),
    ...(hasAadhar && {
      aadharNumber: true,
      panCardHolderName: true,
      aadharCardHolderName: true,
      panCardImage: true,
      aadharCardImage: true,
    }),
    companyName: true,
    brandName: true,
    billingAddress: true,
    billingPincode: true,
    billingCountry: true,
    billingState: true,
    billingCity: true,
    clientEntryType: true,
  };

  const renderLabel = (label, field) => (
    <label className={labelClasses(field)}>
      {label}
      {requiredFields2[field] && <span className="text-red-500 ml-1">*</span>}
    </label>
  );


  const renderError = (field) =>
    businessErrors[field] && <p className="text-red-500 text-sm mt-1">{businessErrors[field]}</p>;
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

  return (
    <form onSubmit={handleSubmit} className="bg-white lg:p-10 p-3 rounded-tl-none rounded-tr-none rounded-2xl">
      <div className="grid lg:grid-cols-2 py-5 gap-4">
        {/* Company Name, Brand Name, Short Brand Name */}
        <div>
          {renderLabel('Registered Company Name', 'companyName')}
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={inputClasses('companyName')}
          />
          {renderError('companyName')}
        </div>

        <div>
          {renderLabel('Brand Name', 'brandName')}
          <input
            type="text"
            name="brandName"
            value={formData.brandName}
            onChange={handleChange}
            className={inputClasses('brandName')}
          />
          {renderError('brandName')}
        </div>


      </div>

      {/* Billing Address */}


      {/* Pincode, State, City */}
      <div className="grid lg:grid-cols-3 py-5 gap-4">
        <div>
          {renderLabel('Company Billing Address', 'billingAddress')}
          <input
            type="text"
            name="billingAddress"
            value={formData.billingAddress}
            onChange={handleChange}
            className={inputClasses('billingAddress')}
          />
          {renderError('billingAddress')}
        </div>
        <div>
          {renderLabel('Form of Client’s Entity', 'clientEntryType')}
          <select
            name="clientEntryType"
            value={formData.clientEntryType}
            onChange={handleChange}
            className={inputClasses('clientEntryType')}
          >
            <option value="">Select</option>
            <option value="Private Limited (Pvt Ltd)">Private Limited (Pvt Ltd)</option>
            <option value="Public Limited (Ltd)">Public Limited (Ltd)</option>
            <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
            <option value="One Person Company (OPC)">One Person Company (OPC)</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Joint Venture">Joint Venture</option>
            <option value="Branch Office">Branch Office</option>
            <option value="Subsidiary Company">Subsidiary Company</option>
            <option value="Government Owned">Government Owned</option>
            <option value="Non-Profit / Section 8 Company">Non-Profit / Section 8 Company</option>
            <option value="Trust">Trust</option>
            <option value="Co-operative Society">Co-operative Society</option>
            <option value="Unlimited Company">Unlimited Company</option>
            <option value="Foreign Company">Foreign Company</option>
            <option value="Holding Company">Holding Company</option>
            <option value="Franchise">Franchise</option>
            <option value="Startup">Startup</option>
            <option value="Other">Other</option>
          </select>
          {renderError('clientEntryType')}
        </div>
        <div>
          {renderLabel('Pincode', 'billingPincode')}
          <input
            type="text"
            name="billingPincode"
            value={formData.billingPincode}
            onChange={handleChange}
            className={inputClasses('billingPincode')}
          />
          {renderError('billingPincode')}
        </div>

        <div>
          {renderLabel('Country', 'billingCountry')}

          <Select
            name="billingCountry"
            value={countryOptions.find(opt => opt.value === formData.billingCountry) || null}
            onChange={(selected) => handleChange({ target: { name: "billingCountry", value: selected?.value } })}
            options={countryOptions}
            placeholder="Select Country"

          />
          {renderError('billingCountry')}
        </div>

        <div>
          {renderLabel('State', 'billingState')}
          <Select
            name="billingState"
            value={stateOptions.find(opt => opt.value === formData.billingState) || null}
            onChange={(selected) => handleChange({ target: { name: "billingState", value: selected?.value } })}
            options={stateOptions}

            placeholder="Select State"
          />
          {renderError('billingState')}
        </div>


        <div>
          {renderLabel('City', 'billingCity')}

          <Select
            name="billingCity"
            value={cityOptions.find(opt => opt.value === formData.billingCity) || null}
            onChange={(selected) => handleChange({ target: { name: "billingCity", value: selected?.value } })}
            options={cityOptions}
            placeholder="Select City"

          />
          {renderError('billingCity')}
        </div>



      </div>

      {/* KYC Documents */}
      <div className="mt-6">
        <h3 className="font-semibold text-[#FF702C] py-5 underline text-sm">
          KYC Details – Provide minimum of 2 documents
        </h3>
        <div className="grid lg:grid-cols-3 gap-4 mt-2">
          {[
            { label: 'GST Number', name: 'gstNumber' },
            { label: 'Company PAN Card ID', name: 'companyPanNumber' },
            { label: 'Company Pan Card Name', name: 'companyPanCardName' },
          ].map(({ label, name, type = 'text' }) => (
            <div key={name}>
              {renderLabel(label, name)}
              <input
                type={type}
                name={name}
                {...(type === 'file' ? { multiple: true, onChange: handleChange } : { value: formData[name], onChange: handleChange })}
                className={inputClasses(name)}
              />
              {renderError(name)}
            </div>
          ))}
        </div>

        {/* Separate file input for "Upload GST Document" */}
        <div className="mt-6">
          <div className="mb-4">
            {renderLabel('Upload GST Document', 'gstDocument')}
            <input
              type="file"
              name="gstDocument"
              multiple
              onChange={handleChange}
              className={inputClasses('gstDocument')}
            />
            {renderError('gstDocument')}
          </div>

          {/* File preview for GST Document */}
          {formData?.gstDocument?.length > 0 && (
            <Swiper
              key={formData.id}
              modules={[Navigation]}
              slidesPerView={2}
              loop={formData.gstDocument?.split(',').length > 1}
              navigation={true}
              className="mySwiper w-full lg:w-[300px] md:w-[200px]  ms-2 md:h-[200px] h-[60px]"
            >
              {formData.gstDocument?.split(',').map((img, index) => (
                <SwiperSlide key={index} className="relative gap-3">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {

                          handleImageDelete(index, 'gstDocument'); // Call your delete function
                        }
                      });
                    }}
                  >
                    ✕
                  </button>

                  {/* Image */}
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={500}
                    height={500}
                    className="me-3 p-2 object-cover h-full w-full rounded"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
        <div className="mt-6">
          <div className="mb-4">
            {renderLabel('Upload company PanCard Image ', 'companyPanCardImage')}
            <input
              type="file"
              name="companyPanCardImage"
              multiple
              onChange={handleChange}
              className={inputClasses('companyPanCardImage')}
            />
            {renderError('companyPanCardImage')}
          </div>

          {/* File preview for GST Document */}
          {formData?.companyPanCardImage?.length > 0 && (
            <Swiper
              key={formData.id}
              modules={[Navigation]}
              slidesPerView={2}
              loop={formData.companyPanCardImage?.split(',').length > 1}
              navigation={true}
              className="mySwiper w-full lg:w-[300px] md:w-[200px]  ms-2 md:h-[200px] "
            >
              {formData.companyPanCardImage?.split(',').map((img, index) => (
                <SwiperSlide key={index} className="relative gap-3">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {

                          handleImageDelete(index, 'companyPanCardImage'); // Call your delete function
                        }
                      });
                    }}
                  >
                    ✕
                  </button>

                  {/* Image */}
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={500}
                    height={500}
                    className="me-3 p-2 object-cover h-full w-full rounded"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-2">
        {[
          { label: 'Aadhar Card ID', name: 'aadharNumber' },
          { label: 'Name on PAN Card', name: 'panCardHolderName' },
          { label: 'Name Aadhar Card ID', name: 'aadharCardHolderName' },
        ].map(({ label, name, type = 'text' }) => (
          <div key={name}>
            {renderLabel(label, name)}
            <input
              type={type}
              name={name}
              {...(type === 'file' ? { multiple: true, onChange: handleChange } : { value: formData[name], onChange: handleChange })}
              className={inputClasses(name)}
            />
            {renderError(name)}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 py-5 gap-3 w-full overflow-auto">
        {/* PAN Card Image Upload */}
        <div className='w-full '>
          <div className="py-6">
            {renderLabel('Upload PAN card image', 'panCardImage')}
            <input
              type="file"
              name="panCardImage"
              multiple
              onChange={handleChange}
              className={inputClasses('panCardImage')}
            />
            {renderError('panCardImage')}
          </div>

          {formData.panCardImage?.length > 0 && (
            <div className="flex gap-3 overflow-auto py-2 w-full">
              {(formData.panCardImage || '').split(',').map((img, index) => (
                <div key={index} className="relative min-w-[200px]">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleImageDelete(index, 'panCardImage');
                        }
                      });
                    }}
                  >
                    ✕
                  </button>
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="p-2 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aadhar Card Image Upload */}
        <div className="py-6">
          <div className="mt-2">
            {renderLabel('Upload Aadhar card image', 'aadharCardImage')}
            <input
              type="file"
              name="aadharCardImage"
              multiple
              onChange={handleChange}
              className={inputClasses('aadharCardImage')}
            />
            {renderError('aadharCardImage')}
          </div>

          {formData?.aadharCardImage?.length > 0 && (
            <div className="flex gap-3 overflow-auto py-2 w-full">
              {(formData.aadharCardImage || '').split(',').map((img, index) => (
                <div key={index} className="relative min-w-[200px]">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleImageDelete(index, 'aadharCardImage');
                        }
                      });
                    }}
                  >
                    ✕
                  </button>
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="p-2 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Additional Documents */}
      <h3 className="font-semibold text-[#FF702C] underline text-sm pt-5">
        Additional Supporting Document
      </h3>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 pt-3 w-full overflow-auto">
        {/* Other fields */}
        {[
          { label: 'Document ID', name: 'documentId' },
          { label: 'Name of document', name: 'documentName' }
        ].map(({ label, name, type = 'text' }) => (
          <div key={name} className=' w-full overflow -auto'>
            {renderLabel(label, name)}
            <input
              type={type}
              name={name}
              {...(type === 'file'
                ? { multiple: true, onChange: handleChange }
                : { value: formData[name] || '', onChange: handleChange })}
              className={inputClasses(name)}
            />
          </div>
        ))}

        {/* Additional Document Upload */}
        <div className="py-6 w-full overflow -auto">
          {renderLabel('Document to upload', 'additionalDocumentUpload')}
          <input
            type="file"
            name="additionalDocumentUpload"
            multiple
            onChange={handleChange}
            className={inputClasses('additionalDocumentUpload')}
          />

          {formData?.additionalDocumentUpload?.length > 0 && (
            <div className="flex gap-3 overflow-auto py-2 w-full">
              {formData.additionalDocumentUpload.split(',').map((img, index) => (
                <div key={index} className="relative min-w-[200px]">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleImageDelete(index, 'additionalDocumentUpload');
                        }
                      });
                    }}
                  >
                    ✕
                  </button>
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="p-2 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Image Upload */}
        <div className="py-6 w-full overflow -auto">
          {renderLabel('Document Image', 'documentImage')}
          <input
            type="file"
            name="documentImage"
            multiple
            onChange={handleChange}
            className={inputClasses('documentImage')}
          />

          {formData?.documentImage?.length > 0 && (
            <div className="flex gap-3 overflow-auto py-2 w-full">
              {formData.documentImage.split(',').map((img, index) => (
                <div key={index} className="relative min-w-[200px]">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: `Do you want to delete this image?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleImageDelete(index, 'documentImage');
                        }
                      });
                    }}
                  >
                    ✕
                  </button>
                  <Image
                    src={fetchImages(img)}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="p-2 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="py-5">
        <button type="submit" className="px-5 p-2 bg-[#FF702C] text-white py-3 rounded-xl">
          Submit
        </button>
      </div>
    </form>


  );
};

export default BusinessInfo;