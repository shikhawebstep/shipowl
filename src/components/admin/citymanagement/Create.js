"use client";
import { useRouter } from "next/navigation";
import { useState ,useEffect,useCallback} from "react";
import Select from 'react-select';
import Swal from "sweetalert2";
export default function Create() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    stateId: "",
    countryId: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e,id) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if(name=="countryId"){
      fetchStateList(value)

    }
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

 
  const validate = () => {

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "City name is required.";
    if (!formData.stateId.trim()) newErrors.stateId = "State Id is required.";
    if (!formData.countryId.trim()) newErrors.countryId = "Country Id is required.";
    return newErrors;
  };

 
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
      if (dropshipperData?.project?.active_panel !== "admin") {
        localStorage.clear();
        router.push("/admin/auth/login");
        return;
      }
  
      const token = dropshipperData?.security?.token;
      if (!token) {
        router.push("/admin/auth/login");
        return;
      }
  
      const newErrors = validate();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }
  
      setErrors({});
  
      try {
        Swal.fire({
          title: "Creating city...",
          text: "Please wait while we save your city.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const formdata = new FormData();
        formdata.append("name", formData.name);
        formdata.append("country", formData.countryId);
        formdata.append("state", formData.stateId);
  
        const url = "/api/location/city";
  
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formdata,
        });
  
        if (!response.ok) {
          Swal.close();
          const errorMessage = await response.json();
          Swal.fire({
            icon: "error",
            title: "Creation Failed",
            text: errorMessage.message || errorMessage.error || "An error occurred",
          });
          throw new Error(errorMessage.message || "Submission failed");
        }
  
        Swal.close();
        Swal.fire({
          icon: "success",
          title: "City Created",
          text: "The City has been created successfully!",
          showConfirmButton: true,
        }).then((res) => {
          if (res.isConfirmed) {
            setFormData({
              name: "",
              stateId: "",
              countryId: "",
            });
            router.push("/admin/city/list");
          }
        });
      } catch (error) {
        console.error("Error:", error);
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Submission Error",
          text: error.message ||  error.error || "Something went wrong. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    

  const fetchState = useCallback(async () => {
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
            `/api/location/country`,
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
                text:
                    errorMessage.error ||
                    errorMessage.message ||
                    "Your session has expired. Please log in again.",
            });
            throw new Error(
                errorMessage.message || errorMessage.error || "Something Wrong!"
            );
        }

        const result = await response.json();
        if (result) {
            setStateData(result?.states || []);
            setCountryData(result?.countries || []);
        }
    } catch (error) {
        console.error("Error fetching state:", error);
    } finally {
        setLoading(false);
    }
}, [router, setStateData]);


const fetchStateList = useCallback(async (id) => {
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
          `/api/location/country/${id}/states`,
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
              text:
                  errorMessage.error ||
                  errorMessage.message ||
                  "Your session has expired. Please log in again.",
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
      setLoading(false);
  }
}, [router, setStateData]);


    useEffect(()=>{
      fetchState();
    },[fetchState])

    const countryOptions = countryData.map((country) => ({
      value: country.id,
      label: country.name,
    }));
    const stateOptions = stateData.map((state) => ({
      value: state.id,
      label: state.name,
    }));
          return (
            <div className="p-6 lg:w-10/12 space-y-6">
              <h2 className="text-2xl font-semibold">City Management</h2>
              <form onSubmit={handleSubmit} className="p-4 rounded-md bg-white shadow">
              <div>
            <label className="font-bold block text-[#232323]">Country</label>
            <Select
              name="countryId"
              value={countryOptions.find((option) => option.value === formData.countryId)}
              onChange={(selectedOption) =>
                handleChange({ target: { name: 'countryId', value: selectedOption?.value } })
              }
              options={countryOptions}
              placeholder="Select a country"
              className="mt-1"
              classNamePrefix="react-select"
            />
            {errors.countryId && (
              <p className="text-red-500 text-sm mt-1">{errors.countryId}</p>
            )}
          </div>
          <div className="pt-2">
              <label className="font-bold block text-[#232323]">State</label>
              <Select
              name="stateId"
              value={stateOptions.find((option) => option.value === formData.stateId)}
              onChange={(selectedOption) =>
                handleChange({ target: { name: 'stateId', value: selectedOption?.value } })
              }
              options={stateOptions}
              placeholder="Select a State"
              className="mt-1"
              classNamePrefix="react-select"
            />
              {errors.stateId && (
                <p className="text-red-500 text-sm mt-1">{errors.stateId}</p>
              )}
            </div>
          <div className="pt-2">
              <label className="font-bold block text-[#232323]">City</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border w-full border-[#DFEAF2] rounded-md p-3 mt-1"
              />
               
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          <div>

        

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 rounded-md p-3"
            >
              Save
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-6 rounded-md p-3"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}



