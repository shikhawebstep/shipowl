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




  return (
    <ImageURLContext.Provider value={{ fetchImages, getProductDescription }}>
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
