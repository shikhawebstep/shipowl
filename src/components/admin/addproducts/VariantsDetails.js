'use client';

import { useContext, useState } from 'react';
import { Plus, Minus, ImageIcon } from 'lucide-react';
import { ProductContext } from './ProductContext';

export default function VariantDetails() {
  const { formData, setFormData, setActiveTabs } = useContext(ProductContext);
  const [error, setError] = useState({});
  const numericFields = ['suggested_price'];

  const handleChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = numericFields.includes(field)
      ? value === '' ? '' : Number(value)
      : value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleIsVariantExistsChange = (e) => {
    const value = e.target.value;

    let updatedVariants = [];

    if (value === 'yes') {
      const newVariant = {
        color: '',
        sku: '',
        product_link: '',
        name: '', suggested_price: '',
        image: null,
      };

      if (formData.list_as === 'both') {
        updatedVariants = [
          { ...newVariant, model: 'Shipowl' },
          { ...newVariant, model: 'Selfship' },
        ];
      } else {
        updatedVariants = [{ ...newVariant, model: formData.list_as }];
      }
    }
    if (value === 'no') {
      const newVariant = {
        product_link: '',
        suggested_price: '',
        sku: '',
        image: null,
      };

      if (formData.list_as === 'both') {
        updatedVariants = [
          { ...newVariant, model: 'Shipowl' },
          { ...newVariant, model: 'Selfship' },
        ];
      } else {
        updatedVariants = [{ ...newVariant, model: formData.list_as }];
      }
    }

    setFormData({
      ...formData,
      isVarientExists: value,
      variants: updatedVariants,
    });
  };




  const handleFileChange = (event, index) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      const imageKey = `variant_images_${index}`;
      setFormData((prev) => ({
        ...prev,
        [imageKey]: [...(prev[imageKey] || []), ...selectedFiles],
      }));
    }
  };

  const addVariant = () => {
    const newVariant = {
      color: '',
      sku: '',
      product_link: '',
      name: '',
      suggested_price: '',
      image: null,
    };

    let updatedVariants = [...formData.variants];
    if (formData.list_as === 'both') {
      updatedVariants = [...updatedVariants, { ...newVariant, model: 'Shipowl' }, { ...newVariant, model: 'Selfship' }];
    } else {
      updatedVariants = [...updatedVariants, { ...newVariant, model: formData.list_as }];
    }

    setFormData({ ...formData, variants: updatedVariants });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };
  const validate = () => {
    const errors = {};
    if (!formData.isVarientExists) {
      errors.isVarientExists = "This Field Is Required";
    }
    setError(errors);
    return Object.keys(errors).length === 0; // ✅ returns true if no errors
  };


  const handleSubmit = () => {
    if (validate()) {
      setActiveTabs('shipping-details');
    }
  };

  const showAddButton = formData.isVarientExists === 'yes';

  return (
    <div className="mt-4 p-6 rounded-xl bg-white">
      <div className="md:flex mb-6 justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#2B3674] mb-4">Variant Details</h2>
        <button className="bg-[#4318FF] text-white px-4 py-2 rounded-md mt-4" onClick={handleSubmit}>
          Next
        </button>
      </div>

      <div>
        <label className='block' htmlFor="isVarientExists">
          Is Variant Exists <span className='text-red-500'>*</span>
        </label>
        <select
          className="w-full border border-[#DFEAF2] p-3 rounded-md text-[#718EBF] font-bold mt-2 outline-0"
          name="isVarientExists"
          id="isVarientExists"
          value={formData.isVarientExists || ''}
          onChange={handleIsVariantExistsChange}
        >
          <option value="">Please Select Option</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {error.isVarientExists && <span className='text-red-500'>{error.isVarientExists}  </span>}
      </div>

      <>
        {showAddButton && (
          <div className="flex justify-end md:hidden mt-4">
            <button className="bg-green-500 text-white p-2 rounded-lg" onClick={addVariant}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}


        <div className={`mt-5 lg:grid  hidden overflow-auto grid-cols-1 gap-6 items-center justify-between border-b border-[#E9EDF7] pb-2 mb-4 text-gray-600 font-semibold ${!showAddButton ? 'lg:grid-cols-5' : 'lg:grid-cols-8'}`}>
          {formData.isVarientExists && (
            <span className="text-[#A3AED0] whitespace-nowrap">Model</span>

          )}

          {showAddButton && (
            <>
              <span className="text-[#A3AED0] whitespace-nowrap">Variant Name</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Color</span>
            </>
          )}
          {formData.isVarientExists && (
            <>
              <span className="text-[#A3AED0] whitespace-nowrap">SKU</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Suggested Price</span>
              <span className="text-[#A3AED0] whitespace-nowrap">Product Link</span>
              <span className="text-[#A3AED0] whitespace-nowrap text-right">Images</span>
            </>
          )}
          {showAddButton && (
            <div className="flex justify-end">
              <button className="bg-green-500 text-white p-2 rounded-lg" onClick={addVariant}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {formData.isVarientExists && (
          <div className='border p-3 rounded-md border-gray-500'>
            {
              Array.isArray(formData.variants) &&
              formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className={`md:grid p-3 rounded-md border  mt-5 border-dotted overflow-auto md:grid-cols-2 gap-6 justify-between mb-4 border-b border-[#E9EDF7] pb-4  ${!showAddButton ? 'lg:grid-cols-5' : 'lg:grid-cols-8'}`}
                >
                  {formData.isVarientExists && (
                    <div>
                      <input type="text" value={variant.model} name="model" id="model" readOnly />
                    </div>
                  )}

                  {formData.isVarientExists === 'yes' && (
                    <>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Variant Name</span>
                        <input
                          type="text"
                          placeholder="name"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.name}
                          onChange={(e) => handleChange(index, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Color</span>
                        <select
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2]"
                          value={variant.color}
                          onChange={(e) => handleChange(index, 'color', e.target.value)}
                        >
                          <option value="">Select Color</option>
                          <option value="Red">Red</option>
                          <option value="Blue">Blue</option>
                          <option value="Green">Green</option>
                        </select>
                      </div>


                    </>
                  )}

                  {formData.isVarientExists && (
                    <>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">SKU</span>
                        <input
                          type="text"
                          placeholder="SKU"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.sku}
                          onChange={(e) => handleChange(index, 'sku', e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Suggested Price</span>
                        <input
                          type="number"
                          placeholder="suggested_price"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2] mb-2"
                          value={variant.suggested_price}
                          onChange={(e) => handleChange(index, 'suggested_price', e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-orange-500 font-semibold lg:hidden block">Product Link</span>
                        <input
                          type="text"
                          placeholder="Link"
                          className="border p-2 rounded-xl text-[#718EBF] font-bold w-full border-[#DFEAF2]"
                          value={variant.product_link || ''}
                          onChange={(e) => handleChange(index, 'product_link', e.target.value)}
                        />
                      </div>

                      <div className="md:flex justify-end">
                        <span className="text-orange-500 font-semibold lg:hidden block">Images</span>
                        <div className="relative overflow-auto border border-[#DFEAF2] rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                          {(() => {
                            const imageKey = `variant_images_${index}`;
                            const files = formData[imageKey] || [];
                            return files.length > 0 ? (
                              <span className="text-[10px] text-center text-gray-600">
                                {files.map((file, i) => file.name || `File ${i + 1}`).join(', ')}
                              </span>
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400 overflow-auto" />
                            );
                          })()}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => handleFileChange(e, index)}
                          />
                        </div>
                      </div>

                    </>
                  )}

                  {showAddButton && (
                    <div className="flex items-start justify-end gap-2">
                      <button className="bg-red-500 text-white p-2 rounded" onClick={() => removeVariant(index)}>
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

        )}
      </>
    </div>
  );
}
