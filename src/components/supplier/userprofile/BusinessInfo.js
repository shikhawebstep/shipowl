'use client';

import { useContext, useState, useCallback } from 'react';
import { ProfileContext } from './ProfileContext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Image from 'next/image';
import Select from 'react-select';
import { useImageURL } from "@/components/ImageURLContext";
const BusinessInfo = () => {
  const { fetchImages } = useImageURL();
  const { formData, businessErrors, validateBusiness, setBusinessErrors, files, setFiles, setFormData, stateData, cityData, setCityData, setStateData, setActiveTab, countryData } = useContext(ProfileContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country/${id}/states`,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/state/${id}/cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${suppliertoken}`,
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
  const handleImageDelete = async (index, type) => {
    setLoading(true);

    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
    if (dropshipperData?.project?.active_panel !== "supplier") {
      localStorage.removeItem("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = dropshipperData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
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

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/${formData.id}/company/${formData.companyid}/image/${index}?type=${type}`;
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
          text: `The image has been deleted successfully!`,
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
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

    const supplierData = JSON.parse(localStorage.getItem("shippingData"));
    if (!supplierData?.project?.active_panel === "supplier") {
      localStorage.clear("shippingData");
      router.push("/supplier/auth/login");
      return;
    }

    const token = supplierData?.security?.token;
    if (!token) {
      router.push("/supplier/auth/login");
      return;
    }

    try {
      Swal.fire({
        title: 'Updating Supplier...',
        text: 'Please wait while we save your Supplier.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/supplier/profile/update`;
      const form = new FormData();

      // Step 1: Append files from files state
      const fileKeys = [
        'panCardImage',
        'gstDocument',
        'companyPanCardImage',
        'additionalDocumentUpload',
        'documentImage',
        'aadharCardImage',
        'profilePicture'
      ];

      fileKeys.forEach((key) => {
        const fileValue = files[key];

        // Skip if already present as a URL in formData (old image not changed)
        if (formData[key] && typeof formData[key] === 'string' && formData[key].startsWith('http')) {
          return;
        }

        if (Array.isArray(fileValue)) {
          fileValue.forEach((file) => {
            if (file instanceof File) form.append(key, file, file.name);
          });
        } else if (fileValue instanceof File) {
          form.append(key, fileValue, fileValue.name);
        }
      });

      // Step 2: Append all other fields from formData
      for (const key in formData) {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          // Only append non-file values
          if (!fileKeys.includes(key)) {
            if (typeof value === 'object') {
              form.append(key, JSON.stringify(value));
            } else {
              form.append(key, value);
            }
          } else {
            // For file keys, if a URL (string) exists, keep it
            if (typeof value === 'string' && value.startsWith('http')) {
              form.append(key, value); // retain previous uploaded file URL
            }
          }
        }
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
          router.push("/supplier/profile");
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
      <div className="grid lg:grid-cols-3 py-5 gap-4">
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
      </div>


      {/* Business Type, Client Entry Type */}
      <div className="grid lg:grid-cols-2 gap-4">
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
            { label: 'Company Pan Card Name', name: 'companyPanCardName' }
          ].map(({ label, name, type = 'text' }) => (
            <div key={name}>
              {renderLabel(label, name)}
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                className={inputClasses(name)}
              />
              {renderError(name)}
            </div>
          ))}

          {/* Document Uploads: GST & PAN */}
          {[
            { label: 'Upload GST Document', name: 'gstDocument' },
            { label: 'Upload Company PAN Card Image', name: 'companyPanCardImage' }
          ].map(({ label, name }) => (
            <div key={name} className="w-full overflow-auto">
              <div className="mb-4">
                {renderLabel(label, name)}
                <input
                  type="file"
                  name={name}
                  multiple
                  accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
                  onChange={handleChange}
                  className={inputClasses(name)}
                />
                {renderError(name)}
              </div>

              {/* File Preview */}
              {formData?.[name]?.length > 0 && (
                <div className="flex overflow-x-auto gap-4 p-2 ms-2">
                  {(formData[name] || '').split(',').map((file, index) => {
                    const fileUrl = fetchImages(file);
                    const extension = file.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);

                    return (
                      <div key={index} className="relative min-w-[250px] max-w-[300px]">
                        {/* Delete Button */}
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                          onClick={() => {
                            Swal.fire({
                              title: 'Are you sure?',
                              text: 'Do you want to delete this file?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#d33',
                              cancelButtonColor: '#3085d6',
                              confirmButtonText: 'Yes, delete it!',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleImageDelete(index, name);
                              }
                            });
                          }}
                        >
                          ✕
                        </button>

                        {/* Preview */}
                        {isImage ? (
                          <Image
                            src={fileUrl}
                            alt={`Document ${index + 1}`}
                            width={500}
                            height={500}
                            className="object-cover rounded p-2"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-40 border border-gray-300 rounded-xl p-4 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => window.open(fileUrl, '_blank')}
                              className="text-blue-600 underline font-medium"
                            >
                              View Document
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
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
        {/* Separate file input for "Upload GST Document" */}

      </div>

      {/* PAN and Aadhar Upload */}
      <div className="grid md:grid-cols-2 py-5 gap-3">
        {[
          { label: 'Upload PAN card image', name: 'panCardImage' },
          { label: 'Upload Aadhar card image', name: 'aadharCardImage' }
        ].map(({ label, name }) => (
          <div key={name} className="w-full overflow-auto">
            {renderLabel(label, name)}
            <input
              type="file"
              name={name}
              multiple
              accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
              onChange={handleChange}
              className={inputClasses(name)}
            />

            {formData?.[name]?.length > 0 && (
              <div className="py-6 w-full">
                <div className="mt-2 flex overflow-x-auto gap-4 p-2 ms-2">
                  {(formData[name] || '').split(',').map((file, index) => {
                    const fileUrl = fetchImages(file);
                    const ext = file.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);

                    return (
                      <div key={index} className="relative min-w-[250px] max-w-[300px]">
                        {/* ✕ Delete Button */}
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                          onClick={() => {
                            Swal.fire({
                              title: 'Are you sure?',
                              text: 'Do you want to delete this file?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#d33',
                              cancelButtonColor: '#3085d6',
                              confirmButtonText: 'Yes, delete it!',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleImageDelete(index, name);
                              }
                            });
                          }}
                        >
                          ✕
                        </button>

                        {/* Preview */}
                        {isImage ? (
                          <Image
                            src={fileUrl}
                            alt={`Image ${index + 1}`}
                            width={500}
                            height={500}
                            className="object-cover rounded p-2"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-40 border border-gray-300 rounded-xl p-4 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => window.open(fileUrl, "_blank")}
                              className="text-blue-600 underline font-medium"
                            >
                              View Document
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {renderError(name)}
          </div>
        ))}
      </div>



      {/* Additional Documents */}
      <h3 className="font-semibold text-[#FF702C] underline text-sm pt-5">
        Additional Supporting Document
      </h3>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 pt-3">
        {/* Other fields */}
        {[
          { label: 'Document ID', name: 'documentId' },
          { label: 'Name of document', name: 'documentName' }
        ].map(({ label, name, type = 'text' }) => (
          <div key={name}>
            {renderLabel(label, name)}
            <input
              type={type}
              name={name}
              {...(type === 'file' ? { multiple: true, onChange: handleChange } : { value: formData[name] || '', onChange: handleChange })}
              className={inputClasses(name)}
            />
          </div>
        ))}

        {[
          {
            label: 'Additional Document Upload',
            name: 'additionalDocumentUpload',
          },
          {
            label: 'Document Image',
            name: 'documentImage',
          },
        ].map(({ label, name }) => (
          <div key={name} className="w-full overflow-auto">
            {renderLabel(label, name)}
            <input
              type="file"
              name={name}
              multiple
              accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
              onChange={handleChange}
              className={inputClasses(name)}
            />

            {formData?.[name]?.length > 0 && (
              <div className="mt-4 flex overflow-x-auto gap-4 p-2 ms-2">
                {formData[name]?.split(',').map((file, index) => {
                  const fileUrl = fetchImages(file);
                  const ext = file.split('.').pop()?.toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);

                  return (
                    <div key={index} className="relative min-w-[250px] max-w-[300px]">
                      {/* Delete button */}
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                        onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: 'Do you want to delete this file?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Yes, delete it!',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleImageDelete(index, name);
                            }
                          });
                        }}
                      >
                        ✕
                      </button>

                      {/* Preview content */}
                      {isImage ? (
                        <Image
                          src={fileUrl}
                          alt={`Image ${index + 1}`}
                          width={500}
                          height={500}
                          className="object-cover rounded p-2"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-40 border border-gray-300 rounded-xl p-4 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => window.open(fileUrl, "_blank")}
                            className="text-blue-600 underline font-medium"
                          >
                            View Document
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

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