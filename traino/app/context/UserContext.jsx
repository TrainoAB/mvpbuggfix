'use client';
import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { DEBUG, logout, checkSession, getUserDetails, getCookie } from '@/app/functions/functions';

// Create a context
const UserContext = createContext();

import { useRouter } from 'next/navigation';

// Create a provider component
export const UserContextProvider = ({ children, sessionObjectCtx }) => {
  const router = useRouter();
  const [sessionObject, setSessionObject] = useState({
    token: null,
    tokenVersion: 0,
  });
  const initializedRef = useRef(false);

  // Initialize session object from context or fetch new one
  useEffect(() => {
    if (initializedRef.current) return; // Prevent multiple initializations

    const initializeSession = async () => {
      DEBUG && console.log('UserContext: Initializing session with context:', sessionObjectCtx);
      DEBUG && console.log('UserContext: Current sessionObject:', sessionObject);

      if (sessionObjectCtx && sessionObjectCtx.token) {
        setSessionObject({
          token: sessionObjectCtx.token,
          tokenVersion: sessionObjectCtx.tokenVersion,
        });
        DEBUG && console.log('UserContext: Set sessionObject from context');
        initializedRef.current = true;
      } else {
        DEBUG && console.log('UserContext: No token available, fetching new one...');
        // Fetch new session token if none provided
        let retries = 3;
        while (retries > 0) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
            const response = await fetch(`${baseUrl}/api/getsessiontoken`);
            if (response.ok) {
              const newSessionObject = await response.json();
              if (newSessionObject && newSessionObject.token) {
                setSessionObject(newSessionObject);
                DEBUG && console.log('UserContext: Fetched new session token:', newSessionObject);
                initializedRef.current = true;
                break;
              }
            } else {
              console.error('UserContext: Failed to fetch session token, retrying...');
            }
          } catch (error) {
            console.error('UserContext: Error fetching session token:', error);
          }
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }

        if (retries === 0) {
          console.error('UserContext: Failed to fetch session token after multiple attempts');
        }
      }
    };

    initializeSession();
  }, [sessionObjectCtx]);

  const [loginUpdate, setloginUpdate] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [contextDataLoaded, setContextDataLoaded] = useState(false);

  const userID = useRef(null);
  const isLoggedin = useRef(false);
  const userData = useRef(null);
  const [userDataVersion, setUserDataVersion] = useState(0);

  const updateUserData = (newData) => {
    userData.current = newData;
    setUserDataVersion((v) => v + 1); // trigger re-render of any consumers
  };

  const timeoutIdRef = useRef(null);

  // Check session

  useEffect(() => {
    const updateUserData = async () => {
      const enudata = getCookie('enudata');
      if (enudata) {
        // const decrypt = await decryptData(enudata, API_KEY);
        DEBUG && console.log('enudata:', enudata);
        const parsedData = JSON.parse(enudata);
        DEBUG && console.log('Decrypted in Context:', parsedData);
        userData.current = parsedData;
        isLoggedin.current = true;
      } else {
        isLoggedin.current = false;
      }

      DEBUG && console.log('Loggedin:', isLoggedin.current);

      if (!isLoggedin) {
        await checkSession(isLoggedin, router);
        DEBUG && console.log('Session checked');
        const user_id = getCookie('user_id');
        if (user_id !== null) {
          if (isLoggedin.current) {
            await handleDecrypt(); // Attempt to decrypt and set userData.current
            if (!userData.current.id) {
              // If decryption did not provide user data
              try {
                const data = await getUserDetails(user_id);
                userData.current = data;
                await handleEncrypt(data); // Encrypt and store the fetched user details
                DEBUG && console.log('User details fetched and encrypted:', data);
              } catch (error) {
                console.error('Error decrypting or fetching user details:', error);
              }
            }
          } else {
            await handleDecrypt(); // Attempt to decrypt and set userData.current
            if (!userData.current.id) {
              // If decryption did not provide user data
              try {
                const data = await getUserDetails(user_id);
                userData.current = data;
                await handleEncrypt(data, API_KEY); // Encrypt and store the fetched user details
                DEBUG && console.log('User details fetched and encrypted:', data);
              } catch (error) {
                console.error('Error decrypting or fetching user details:', error);
              }
            }
          }
        }
      }
      setContextDataLoaded(true);
      DEBUG && console.log('Update User Data:', userData.current);
    };

    updateUserData();
  }, [isLoggedin]);

  useEffect(() => {
    const handleUserActivity = () => {
      DEBUG && console.log('User activity detected');
      resetTimer();
    };

    const resetTimer = () => {
      clearTimeout(timeoutIdRef.current);

      // 30 minutes in milliseconds
      const timeoutDuration = 30 * 1000 * 60;
      // const timeoutDuration = 5 * 1000

      timeoutIdRef.current = setTimeout(() => {
        if (!keepLoggedIn) {
          DEBUG && console.log('User logging out due to inactivity');
          logout(isLoggedin, userData, router, false);
        }
      }, timeoutDuration);
    };

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    resetTimer();

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearTimeout(timeoutIdRef.current);
    };
  }, [keepLoggedIn]);

  return (
    <UserContext.Provider
      value={{
        sessionObject,
        setSessionObject,
        userID,
        userData,
        isLoggedin,
        loginUpdate,
        setloginUpdate,
        keepLoggedIn,
        setKeepLoggedIn,
        contextDataLoaded,
        setContextDataLoaded,
        userDataVersion,
        updateUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUserContext = () => {
  return useContext(UserContext);
};
