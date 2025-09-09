'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie } from '@/app/functions/functions';
import Loader from '@/app/components/Loader';

const PasswordChecker = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname

  // Define pages that do not require a password here
  const EXCLUDED_PAGES = ['/developmentlogin']; // Add pages to exclude

  // Bara sätt isLoading till false direkt - ingen password check
  useEffect(() => {
    setIsLoading(false); // Skip all password logic
  }, []);

  /* useEffect(() => {
    const checkPassword = () => {
      // Skip password check if the current path is in the excluded list
      if (EXCLUDED_PAGES.includes(pathname)) {
        setIsLoading(false); // No password check needed for this route
        return;
      }

      // Perform the password check for protected routes
      const password = getCookie('password');
      if (!password) {
        router.push('/developmentlogin'); // Redirect if no password
      } else {
        setIsLoading(false); // Hide loading state if password is present
      }
    };

    checkPassword();
  }, [pathname, router]); */

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader />
      </div>
    ); // Show loading state
  }

  return <>{children}</>; // Render children if password is set or not required
};

export default PasswordChecker;
