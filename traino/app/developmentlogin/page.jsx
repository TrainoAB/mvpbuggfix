'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from '@/app/functions/functions'; // Ensure this sets cookies properly
import { useAppState } from '@/app/hooks/useAppState';
import './page.css';

export default function DevelopmentLogin() {
  const { DEBUG, baseUrl } = useAppState();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to check if password is already stored
    const checkPassword = () => {
      const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');
        acc[name] = value;
        return acc;
      }, {});

      if (cookies.password) {
        router.push('/login');
      } else {
        setIsLoading(false); // Allow user to enter password if not set
      }
    };

    checkPassword();
  }, [router]);

  const handleSetPassword = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/developmentlogin?password=${password}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setCookie('password', password, 365); // Ensure this sets cookies correctly
        router.push('/login'); // Redirect to the home page or wherever you want
      } else {
        alert('Password is incorrect. Please try again.');
      }
    } catch (error) {
      DEBUG && console.error('Error checking password:', error);
      alert('There was an error processing your request. Please try again.');
    }
  };

  if (isLoading) {
    // Show a loading state while checking for the password
    return <div>Loading...</div>;
  }

  return (
    <div id="developmentlogin">
      <div className="login">
        <h1>Password</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        <button className="button" onClick={handleSetPassword}>
          Enter
        </button>
      </div>
    </div>
  );
}
