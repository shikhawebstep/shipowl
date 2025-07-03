'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter ,useSearchParams} from 'next/navigation';
import img from '@/app/assets/image-badge.png';
import { IoCloseOutline } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import Image from 'next/image';
import Swal from 'sweetalert2';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { HashLoader } from 'react-spinners';
const Update = () => {
    const router = useRouter();
    const [image, setImage] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        expectedPrice: '',
        expectedDailyOrders: '',
        url: '',
        images: [],
        status:'',
        prevImages:[],
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const adminData = JSON.parse(localStorage.getItem("shippingData"));
        if (!adminData?.project?.active_panel === "admin") {
            localStorage.clear("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const token = adminData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setLoading(false);
            return;
        }

        setErrors({});

        try {
            Swal.fire({
                title: 'Creating Product...',
                text: 'Please wait while we save your Product.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const form = new FormData();
            form.append("name", formData.name);
            form.append("category", formData.category);
            form.append("expectedPrice", formData.expectedPrice);
            form.append("expectedDailyOrders", formData.expectedDailyOrders);
            form.append("url", formData.url);
            form.append("status", formData.status);  
            formData.images.forEach((file) => {
                form.append('image', file);
            });

            const url = `/api/product/request/${id}`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: form,
            });

            if (!response.ok) {
                Swal.close();
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Creation Failed",
                    text: errorMessage.message || "An error occurred",
                });
                return;
            }

            const result = await response.json();
            Swal.close();

            if (result) {
                Swal.fire({
                    icon: "success",
                    title: "Product Created",
                    text: "The Product has been created successfully!",
                    showConfirmButton: true,
                }).then((res) => {
                    if (res.isConfirmed) {
                        setFormData({
                            name: '',
                            category: '',
                            expectedPrice: '',
                            expectedDailyOrders: '',
                            url: '',
                            images: [],
                        });
                        setImage(null);
                        router.push("/admin/new-product-request");
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

     const handleImageDelete = async (index) => {
                setLoading(true);
        
                const adminData = JSON.parse(localStorage.getItem("shippingData"));
                if (adminData?.project?.active_panel !== "admin") {
                    localStorage.removeItem("shippingData");
                    router.push("/dropshipping/auth/login");
                    return;
                }
        
                const token = adminData?.security?.token;
                if (!token) {
                    router.push("/dropshipping/auth/login");
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
        
                    const url = `/api/product/request/${id}/image/${index}`;
        
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
                                fetchProducts(); // Refresh formData with updated images
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
const fetchProducts = useCallback(async () => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));

        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const admintoken = adminData?.security?.token;
        if (!admintoken) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `/api/product/request/${id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${admintoken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorMessage = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Something Wrong!",
                    text: errorMessage.message || "Your session has expired. Please log in again.",
                });
                throw new Error(errorMessage.message);
            }

            const result = await response.json();
            const product = result?.productRequest || {};

            setFormData({
                name:product.name ||  '',
                category: product.categoryId || '',
                expectedPrice:product.expectedPrice || '',
                expectedDailyOrders: product.expectedDailyOrders ||'',
                url:product.url || '',
                prevImages: product.image || [],
                status:product.status || '',
                images: []
            });
        } catch (error) {
            console.error("Error fetching category:", error);
        } finally {
            setLoading(false);
        }
    }, [router, id]);


    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.expectedPrice || isNaN(formData.expectedPrice)) newErrors.expectedPrice = 'Valid expected price required';
        if (!formData.expectedDailyOrders) newErrors.expectedDailyOrders = 'Expected daily orders is required';
        if (!formData.url) newErrors.url = 'Product URL is required';
        if (!formData.status) newErrors.status = 'Product Status is required';
        if (formData.images.length === 0) newErrors.images = 'At least one image is required';
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, type, value, checked ,files} = e.target;
    
        if (type === 'file') {
          const fileArray = Array.from(files);
          setFormData(prev => ({ ...prev, images: fileArray }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? true : false) : value
        }));    }
      };
    

    const fetchCategory = useCallback(async () => {
        const adminData = JSON.parse(localStorage.getItem("shippingData"));

        if (adminData?.project?.active_panel !== "admin") {
            localStorage.removeItem("shippingData");
            router.push("/dropshipping/auth/login");
            return;
        }

        const token = adminData?.security?.token;
        if (!token) {
            router.push("/dropshipping/auth/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/admin/category`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (response.ok) {
                setCategoryData(result?.categories || []);
            } else {
                alert(result.message || "Failed to fetch categories.");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);


    useEffect(() => {
        fetchCategory();
        fetchProducts();
    }, [fetchCategory,fetchProducts]);

    return (
        <div className="">
            {loading ? (
  <div className="flex justify-center items-center h-96">
    <HashLoader color="orange" />
  </div>
) : (
            <form onSubmit={handleSubmit} className="w-full lg:w-6/12 py-6">
                <h2 className="md:text-3xl text-xl font-semibold text-[#F98F5C]">Source A Product</h2>
                <div className="border-b-4 w-4/12 border-[#F98F5C] mb-4"></div>

                <div className="bg-white shadow p-4 rounded-xl mb-6">
                    <h3 className="text-lg font-semibold">General Information</h3>
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mt-3">
                        <div>
                            <label className="text-[#777980] block mb-1">Product Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`p-2 bg-[#F9F9FC] rounded w-full border ${errors.name ? 'border-red-500' : 'border-[#E0E2E7]'}`}
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-[#777980] block mb-1">Category Type</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full border p-2 rounded ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select a category type</option>
                                {categoryData.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                        </div>
                        <div>
                            <label className="text-[#777980] block mb-1">Expected Price</label>
                            <input
                                type="text"
                                name="expectedPrice"
                                value={formData.expectedPrice}
                                onChange={handleChange}
                                className={`p-2 bg-[#F9F9FC] rounded w-full border ${errors.expectedPrice ? 'border-red-500' : 'border-[#E0E2E7]'}`}
                            />
                            {errors.expectedPrice && <p className="text-red-500 text-sm mt-1">{errors.expectedPrice}</p>}
                        </div>
                        <div>
                            <label className="text-[#777980] block mb-1">Expected Daily Orders</label>
                            <select
                                name="expectedDailyOrders"
                                value={formData.expectedDailyOrders}
                                onChange={handleChange}
                                className={`p-2 bg-[#F9F9FC] rounded w-full border ${errors.expectedDailyOrders ? 'border-red-500' : 'border-[#E0E2E7]'}`}
                            >
                                <option value="">Select</option>
                                <option value="1-4">1-4</option>
                                <option value="5-30">5-30</option>
                                <option value="31-100">31-100</option>
                                <option value="100+">100+</option>
                            </select>
                            {errors.expectedDailyOrders && <p className="text-red-500 text-sm mt-1">{errors.expectedDailyOrders}</p>}
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#777980] block mb-1">Product URL</label>
                        <input
                            type="text"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            placeholder="Product URL"
                            className={`p-2 bg-[#F9F9FC] rounded w-full border ${errors.url ? 'border-red-500' : 'border-[#E0E2E7]'}`}
                        />
                        {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
                    </div>
                    <div>
          
          <label className="flex mt-2 items-center cursor-pointer">
                              <input
                                  type="checkbox"
                                  name='status'
                                  className="sr-only"
                                  checked={formData.status || ''}
                                  onChange={handleChange}
                              />
                              <div
                                  className={`relative w-10 h-5 bg-gray-300 rounded-full transition ${formData.status ? "bg-orange-500" : ""
                                      }`}
                              >
                                  <div
                                      className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${formData.status ? "translate-x-5" : ""
                                          }`}
                                  ></div>
                              </div>
                              <span className="ms-2 text-sm text-gray-600">
                                  Status
                              </span>
                          </label>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>
                </div>
              

                <div className="bg-white shadow p-4 rounded-xl mb-6">
                    <h3 className="text-lg font-semibold">Product Image</h3>
                    <label className="text-[#777980] block mt-1">Photo</label>
                    <div className={`border-dashed border-2 ${errors.images ? 'border-red-500' : 'border-gray-300'} bg-[#F9F9FC] rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 mt-3`}>
                        {image ? (
                            <Image src={image} alt="Uploaded" width={128} height={128} className="object-cover rounded-xl" />
                        ) : (
                            <>
                                <Image src={img} alt="Image Gallery" className="p-3" />
                                <p className="mt-2">Drag and drop image here, or click add image</p>
                            </>
                        )}
                        <input type="file" multiple className="hidden" id="upload" onChange={handleChange} />
                        <label htmlFor="upload" className="mt-3 px-4 py-2 text-[#F98F5C] bg-[#f98e5c49] rounded-md cursor-pointer">Add Image</label>
                    </div>

                    {formData?.prevImages && typeof formData.prevImages === 'string' && (
  <div className="mt-2">
    <Swiper
      key={formData.id}
      modules={[Navigation]}
      slidesPerView={2}
      loop={formData.prevImages.split(',').length > 1}
      navigation={true}
      className="mySwiper w-full lg:w-[300px] md:w-[200px] w-[60px] ms-2 md:h-[200px] h-[60px]"
    >
      {formData.prevImages.split(',').map((img, index) => (
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
                  handleImageDelete(index);
                }
              });
            }}
          >
            ✕
          </button>

          <Image
            src={`https://placehold.co/600x400?text=${index + 1}` || img.trim()}
            alt={`Image ${index + 1}`}
            width={500}
            height={500}
            className="me-3 p-2 object-cover h-full w-full rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)}

                    {errors.images && <p className="text-red-500 text-sm mt-1 text-center">{errors.images}</p>}
                </div>

                <div className="flex justify-end space-x-4">
                    <button type="button" className="px-4 py-2 border rounded-md flex items-center gap-2"><IoCloseOutline /> Cancel</button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-md flex items-center gap-2"
                        disabled={loading}
                    >
                        <FaPlus /> Submit Request
                    </button>
                </div>
            </form>
)}
        </div>
    );
};

export default Update;
