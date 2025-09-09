'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/app/components/LoginModal/LoginModal';
import { useAppState } from '@/app/hooks/useAppState';

import './page.css';

export default function LoginModalTestPage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { usedData, isLoggedin, loginUpdate, userData } = useAppState();
  const [loginStatus, setLoginStatus] = useState(false);

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  const handleLoginSuccess = () => {
    alert('Login successful!');
    setIsLoginOpen(false);
    // router.push('/profile');
  };

  useEffect(() => {
    if (isLoggedin.current && userData.current) {
      // router.push('/profile');
      setLoginStatus(true);
    }
  }, [loginUpdate]);

  useEffect(() => {
    console.log('loginUpdate Status:', loginUpdate);
  }, [loginUpdate]);

  return (
    <div id="loginmodaltestpage">
      <div className="modalcontainer">
        {!loginStatus && (
          <input className="button" type="button" value="Open Login Modal" onClick={() => setIsLoginOpen(true)} />
        )}
        {loginStatus && (
          <input
            className="button"
            type="button"
            value="Open Login Modal"
            onClick={() => alert('You are already logged in')}
          />
        )}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={handleLoginClose}
          onLoginSuccess={handleLoginSuccess}
          loginModalType="modal"
        />
      </div>
    </div>
  );
}
