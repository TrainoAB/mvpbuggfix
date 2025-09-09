'use client';
import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import {
  DEBUG,
  DEVELOPMENT_MODE,
  baseUrl,
  getCategories,
  encryptData,
  getCookie,
  setCookie,
} from '@/app/functions/functions';

import { useRouter } from 'next/navigation';

// Create a context
const TrainoContext = createContext();

// Create a provider component
export const TrainoContextProvider = ({ children }) => {
  const router = useRouter();
  // Define your context variables here
  const [traincategories, setTraincategories] = useState([]);
  const [showTerms, setShowTerms] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // State to store mobile status
  const [fetchCategories, setFetchCategories] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Alert modal

  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);

  const mapRef = useRef(null);

  // TODO: Replace this API_KEY with encryptionpassword or make
  // it a server function to get password for encrypt and decrypt functions
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Modal function
  const showAlertModal = (message) => {
    setModalMessage(message); // Set the modal message
    setIsModalOpen(true); // Open the modal
  };

  const openModal = (message) => {
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage('');
  };

  const togglePasswordVis = (e) => {
    e.preventDefault();
    if (e.type === 'click') {
      setShowPassword((p) => !p);
    }
  };
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      // Override the default alert function with the custom alert
      window.alert = showAlertModal;
    }
  }, []);

  const handleEncrypt = async (data) => {
    const encrypted = await encryptData(data, API_KEY); // TODO: Change API_KEY to encryptionPassword
    setEncryptedData(data);
    setCookie('enudata', JSON.stringify(data), 365);
  };

  const handleDecrypt = async () => {
    const storedData = JSON.parse(getCookie('enudata'));
    if (storedData) {
      // const decrypted = await decryptData(storedData, API_KEY); // TODO: Change API_KEY to encryptionPassword
      setDecryptedData(storedData);
      userData.current = storedData;
    }
  };

  // Get categories
  useEffect(() => {
    const fetchCategoriesAsync = async () => {
      if (!fetchCategories) {
        try {
          const data = await getCategories(setTraincategories);
          DEBUG && console.log('Categories loaded');
          setFetchCategories(true);
        } catch (error) {
          console.error('Error loading categories:', error);
        }
      }
    };

    fetchCategoriesAsync();
  }, [fetchCategories]);

  // Check if the code is running on the client-side
  useEffect(() => {
    console.log('DEBUG ', DEBUG);
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []); // Run only once on component mount

  // Return the context provider with the variables as context values
  return (
    <TrainoContext.Provider
      value={{
        DEBUG,
        API_KEY, // TODO: Change to encryptionPassword
        DEVELOPMENT_MODE,
        baseUrl,
        setDecryptedData,
        setEncryptedData,
        encryptedData,
        decryptedData,
        isKeyboardOpen,
        setIsKeyboardOpen,
        isMobile,
        mapRef,
        traincategories,
        showTerms,
        setShowTerms,
        setTraincategories,

        isModalOpen,
        modalMessage,
        openModal: showAlertModal,
        closeModal,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        togglePasswordVis,

        // Add more context variables here as needed
      }}
    >
      {children}
    </TrainoContext.Provider>
  );
};

// Custom hook to use the context
export const useTrainoContext = () => {
  return useContext(TrainoContext);
};
