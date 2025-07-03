// contexts/ImageURLContext.js
'use client';
import React, { createContext, useContext } from 'react';

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

    return `https://sleeping-owl-we0m.onrender.com/api/images/tmp/${imagePath}`;
  }

  return (
    <ImageURLContext.Provider value={{ fetchImages }}>
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
