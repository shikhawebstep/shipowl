'use client';

import { useState, createContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export const ProductContextEdit = createContext();

const ProductProviderEdit = ({ children }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("product-details");
  const [errors, setErrors] = useState({});
  const [shippingErrors, setShippingErrors] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [isEdit, setIsEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});

  const [formData, setFormData] = useState({
    category: '',
    name: '',
    main_sku: '',
    description: '',
    tags: [],
    brand: '',
    origin_country: '',
    shipping_country: '',
    video_url: '',
    list_as: '',
    gallery:'',
    variants: [
      {
        color: '',
        sku: '',
        product_link: '',
        name: '',
        model: '',
        suggested_price: 0,
      },
    ],
    shipping_time: '24 Hours',
    weight: '',
    package_length: '',
    package_width: '',
    package_height: '',
    chargeable_weight: '',
    package_weight_image: 0,
    package_length_image: 0,
    package_width_image: 0,
    package_height_image: 0,
    product_detail_video: 0,
    hsn_code: '',
    tax_rate: '',
    isVisibleToAll: true,
    isVarientExists: '',
    supplierIds: '',
    status: true,
  });

  const fetchCategory = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem('shippingData'));

    if (adminData?.project?.active_panel !== 'admin') {
      localStorage.removeItem('shippingData');
      router.push('/admin/auth/login');
      return;
    }

    const admintoken = adminData?.security?.token;
    if (!admintoken) {
      router.push('/admin/auth/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/category`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admintoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Something Wrong!',
          text:
            errorMessage.error ||
            errorMessage.message ||
            'Your session has expired. Please log in again.',
        });
        throw new Error(errorMessage.message || errorMessage.error || 'Something Wrong!');
      }

      const result = await response.json();
      if (result?.categories) {
        setCategoryData(result.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [router]);

  const fetchBrand = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem('shippingData'));

    if (adminData?.project?.active_panel !== 'admin') {
      localStorage.removeItem('shippingData');
      router.push('/admin/auth/login');
      return;
    }

    const admintoken = adminData?.security?.token;
    if (!admintoken) {
      router.push('/admin/auth/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/brand`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admintoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Something Wrong!',
          text:
            errorMessage.error ||
            errorMessage.message ||
            'Your session has expired. Please log in again.',
        });
        throw new Error(errorMessage.message || errorMessage.error || 'Something Wrong!');
      }

      const result = await response.json();
      if (result?.brands) {
        setBrandData(result.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  }, [router]);

  const fileFields = [
    { label: 'Package Weight Image', key: 'package_weight_image' },
    { label: 'Package Length Image', key: 'package_length_image' },
    { label: 'Package Width Image', key: 'package_width_image' },
    { label: 'Package Height Image', key: 'package_height_image' },
   
  ];
  const videoFields =[
     { label: 'Upload Product Details Video', key: 'product_detail_video' },
  ]
  const fetchCountry = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem('shippingData'));



    const admintoken = adminData?.security?.token;
    if (!admintoken) {
      router.push('/admin/auth/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/location/country`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admintoken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Something Wrong!',
          text:
            errorMessage.error ||
            errorMessage.message ||
            'Your session has expired. Please log in again.',
        });
        throw new Error(errorMessage.message || errorMessage.error || 'Something Wrong!');
      }

      const result = await response.json();
      if (result?.countries) {
        setCountryData(result.countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fieldLabels = {
    category: 'Product Category',
    name: 'Product Name',
    main_sku: 'Product Main SKU',
    description: 'Description',
    tags: 'Product Tags',
    brand: 'Brand',
    origin_country: 'Country of Origin',
    shipping_country: 'Shipping Country',
    video: 'Product Video URL',
    list_as: 'List As',
  };
  const validateForm2 = () => {
    const newErrors = {};

    const requiredFields = [
      'shipping_time',
      'weight',
      'package_length',
      'package_width',
      'package_height',
    ];

    // Validate simple fields
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });



    setShippingErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const validateFields = () => {
    const requiredFields = [
      'category',
      'name',
      'main_sku',
      'description',
      'brand',
      'tags',
      'origin_country',
      'shipping_country',
      'list_as',
      'isVisibleToAll',
    ];

    // ✅ Push to requiredFields, not validateFields
    if (!formData.isVisibleToAll) {
      requiredFields.push('supplierIds');
    }

    const newErrors = {};
    requiredFields.forEach((field) => {
      const value = formData[field];

      // Check for undefined, null, empty string, or empty array
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        newErrors[field] = `${fieldLabels[field]} is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ProductContextEdit.Provider
      value={{
        formData,
        setFormData,
        fileFields,
        videoFields,
        categoryData,
        setCategoryData,
        brandData,
        setBrandData,
        countryData,
        setCountryData,
        isEdit,
        validateForm2,
        setIsEdit,
        fetchCategory,
        fetchBrand,
        fetchCountry,
        loading,
        activeTab, errors, setErrors, shippingErrors, setShippingErrors,
        validateFields,     // ✅ Added
        setActiveTab,
        files, setFiles  // ✅ Added
      }}
    >
      {children}
    </ProductContextEdit.Provider>

  );
};

export { ProductProviderEdit };
