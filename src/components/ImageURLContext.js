// contexts/ImageURLContext.js
'use client';
import React, { createContext, useContext } from 'react';

const ImageURLContext = createContext();

export const ImageURLProvider = ({ children }) => {
  function fetchImages(rawUrl) {
    const url = rawUrl.trim();
    if (!url || typeof url !== 'string') {
      return 'https://placehold.co/400';
    }

    // If it's already a valid absolute URL (http or https), return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If the URL contains 'tmp', transform it
    const splitPart = url.split('tmp');

    if (splitPart.length < 2) {
      return 'https://placehold.co/400';
    }

    let imagePath = splitPart[1].replace(/^\/+/, ''); // remove leading slashes

    const finalURL = `https://sleeping-owl-we0m.onrender.com/api/images/tmp/${imagePath}`;
    return finalURL;
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
