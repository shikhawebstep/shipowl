// contexts/ImageURLContext.js
'use client';
import React, { createContext, useContext } from 'react';
import Swal from 'sweetalert2';
const ImageURLContext = createContext();

export const ImageURLProvider = ({ children }) => {
  function fetchImages(rawUrl) {
    if (!rawUrl) {
      return 'https://placehold.co/400';
    }

    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const splitPart = url.split('tmp');

    if (splitPart.length < 2) {
      return 'https://placehold.co/400';
    }

    let imagePath = splitPart[1].replace(/^\/+/, ''); // remove leading slashes

    return `${process.env.NEXT_PUBLIC_API_BASE_URL}api/images/tmp/${imagePath}`;
  }
  const getProductDescription = async (productId, setDescription) => {
    try {
      Swal.fire({

        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const myHeaders = new Headers();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/product/${productId}/description`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch description");
      }

      const result = await response.json(); // ✅ FIXED

      setDescription(result.product?.description); // ✅ Now works

      Swal.close();

    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Something went wrong",
      });
      console.error("Fetch Error:", error);
    }
  };

  const handleBulkDelete = async ({
    selected,
    apiEndpoint,
    setSelected,
    setLoading,
  }) => {
    if (!selected || selected.length === 0) {
      Swal.fire("No Product selected", "Please select at least one item.", "info");
      return;
    }

    try {
      Swal.fire({
        title: "Deleting selected items...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const raw = JSON.stringify({
        ids: selected.join(","),
      });

      const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));
      if (dropshipperData?.project?.active_panel !== "admin") {
        localStorage.removeItem("shippingData");
        router.push("/admin/auth/login");
        return;
      }

      const token = dropshipperData?.security?.token;
      const response = await fetch(apiEndpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: raw,
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: errorMessage.message || "An error occurred",
        });
        return;
      }

      Swal.close();
      Swal.fire("Deleted!", "Selected items deleted successfully.", "success");

      setSelected?.([]);
      setLoading?.(false);

    } catch (error) {
      Swal.close();
      Swal.fire("Error", error.message || "Something went wrong.", "error");
    }
  };


  return (
    <ImageURLContext.Provider value={{ fetchImages, getProductDescription, handleBulkDelete }}>
      {children}
    </ImageURLContext.Provider>
  );
};

// Custom hook
export const useImageURL = () => {
  const context = useContext(ImageURLContext);
  if (!context) {
    throw new Error("useImageURL must be used within an ImageURLProvider");
  }
  return context;
};
