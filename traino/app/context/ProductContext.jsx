'use client';
import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { DEBUG, logout, checkSession, getUserDetails, getCookie } from '@/app/functions/functions';

// Create a context
const ProductContext = createContext();

// Create a provider component
export const ProductContextProvider = ({ children }) => {
  const [bookedBox, setBookedBox] = useState(false);
  const [booked, setBooked] = useState(false);
  const [productObject, setProductObject] = useState({
    product: '',
    duration: 15,
    price: 100,
    hasDescription: false,
    description: '',
    file: '',
    conversation: 0,
    clipcards: [],
    address: '',
    longitude: 0,
    latitude: 0,
    sessions: 0,
  });

  return (
    <ProductContext.Provider value={{ productObject, setProductObject, booked, setBooked, bookedBox, setBookedBox }}>
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook to use the context
export const useProductContext = () => {
  return useContext(ProductContext);
};
