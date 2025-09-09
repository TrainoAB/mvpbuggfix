// app/login/page.jsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/app/components/LoginModal/LoginModal';
import './page.css';
import { DEBUG } from '../api/secretcontext';

export default function login() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(true);

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  const handleLoginSuccess = (userData) => {
    // Close the modal
    setIsLoginOpen(false);

    let path;

    // Check if trainer needs to set up Stripe account
    if (userData.usertype === 'trainer' && userData.stripe_account === 0) {
      // Redirect new trainers to payments setup page
      path = `/trainer/@${userData.alias}/payments`;
    } else {
      // Determine the profile path based on user type for existing users
      path = userData.usertype === 'trainer' ? `/trainer/@${userData.alias}` : `/trainee/${userData.id}`;
    }

    // Navigate to the appropriate path
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

  return (
    <div className="modalcontainer">
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
        loginModalType="page"
      />
    </div>
  );
}
