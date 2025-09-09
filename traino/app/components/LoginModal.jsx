// app/components/LoginModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppState } from '@/app/hooks/useAppState';
import PasswordToggle from './Inputs/PasswordToggle';
import Loader from './Loader';
import { GDPRPopup } from './GDPRPopup';
import {
  baseUrl,
  sessionObject,
  checkSession,
  getUserDetails,
  localStorageTimestamp,
  encryptData,
  decryptData,
  getCookie,
  setCookie,
  deleteCookie,
} from '@/app/functions/functions';
import '/app/globals.css';
import './LoginModal.css';
import { set } from 'date-fns';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const {
    API_KEY,
    DEBUG,
    useTranslations,
    language,
    isLoggedin,
    loginUpdate,
    setloginUpdate,
    userData,
    isMobile,
    isKeyboardOpen,
    setIsKeyboardOpen,
    keepLoggedIn,
    setKeepLoggedIn,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    togglePasswordVis,
    setDecryptedData,
    setEncryptedData,
    openModal,
  } = useAppState();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { translate } = useTranslations('login', language);
  const { translate: translateConfirm } = useTranslations('confirmemail', language);
  const { translate: translateGlobal } = useTranslations('global', language);
  const router = useRouter();

  // Encryption and decryption functions
  const handleEncrypt = async (data, API_KEY) => {
    const encrypted = await encryptData(data, API_KEY);
    setEncryptedData(data);
    setCookie('enudata', JSON.stringify(data), 365);
  };

  const handleDecrypt = async () => {
    const storedData = JSON.parse(getCookie('enudata'));
    if (storedData) {
      setDecryptedData(storedData);
      userData.current = storedData;
      DEBUG && console.log('Decrypted User Data:', storedData);
    }
  };

  useEffect(() => {
    console.log('loginUpdate has changed:', loginUpdate);
  }, [loginUpdate]);

  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      setloginUpdate(false);
      setIsTransitioning(true);

      const init = async () => {
        try {
          isLoggedin.current = await checkSession(isLoggedin, router);
          if (isLoggedin.current) {
            DEBUG && console.log('User is logged in');
            const storedEncryptedData = getCookie('enudata');
            if (storedEncryptedData) {
              await handleDecrypt();
              onClose();
            } else {
              const user_id = getCookie('user_id');
              if (user_id) {
                const data = await getUserDetails(user_id);
                DEBUG && console.log('User details fetched:', data);
                await handleEncrypt(data, API_KEY);
                onClose();
              } else {
                console.error('No user_id found in cookies');
              }
            }
          } else {
            DEBUG && console.log('User is not logged in');
          }
        } catch (error) {
          console.error('Error during initialization:', error);
          deleteCookie('user_id');
          deleteCookie('session_id');
          deleteCookie('timestamp');
        }
      };

      init();
    } else {
      setIsTransitioning(false);
    }
  }, [isOpen]);

  const handleLoginClick = async (event) => {
    event.preventDefault();
    const passwordtrim = password.trim();
    DEBUG && console.log('Email: ', email, 'Password: ', passwordtrim);
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/login`,
          method: 'POST',
          body: JSON.stringify({ email, passwordtrim }),
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error('Failed to login');
      }

      const data = await response.json();

      if (data.error) {
        console.error(`Login failed. ${data.error}`);
        DEBUG && console.log(`Credentials: ${email} ${passwordtrim}`);

        // Handle specific case of unverified user
        if (data.error === 'User not verified') {
          openModal(
            <div>
              <p>{translateConfirm('usernotverified', language)}</p>
              <p>{translateConfirm('resendconfirmationtext', language)}</p>
              <Link href="/resend-confirmation" style={{ color: '#007bff', textDecoration: 'underline' }}>
                {translateConfirm('resendconfirmationlink', language)}
              </Link>
            </div>,
          );
        } else {
          openModal(`${translateGlobal('loginfailed', language)} ${data.error}`);
        }

        setLoading(false);
        return;
      }

      if (data.success) {
        const { id, alias, email, session_id } = data;
        setCookie('user_id', id, 365);
        setCookie('session_id', session_id, 365);
        localStorageTimestamp();
        await handleEncrypt(data, API_KEY);

        userData.current = data;
        isLoggedin.current = true;

        DEBUG && console.log('isLoggedin.current', isLoggedin.current);
        DEBUG && console.log('userData.current', userData.current);

        setTimeout(() => {
          setloginUpdate((prev) => !prev);
          DEBUG && console.log('loginUpdate toggled');
        }, 0);

        onLoginSuccess();
        onClose();
      } else {
        setLoading(false);
        openModal(translateGlobal('invalidemailpassword', language));
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      openModal(translateGlobal('networkresponseerror', language));
    }
  };

  const handleInputFocus = () => {
    if (isMobile) {
      setIsKeyboardOpen(true);
    }
  };

  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const handleKeepLoggedIn = (e) => {
    DEBUG && console.log('Keep me logged in');

    setKeepLoggedIn(e.target.checked);
  };

  return (
    <>
      {isOpen && (
        <div id="loginmodal" className={isTransitioning ? 'visible' : ''}>
          <div className="modal-content">
            <div className="btn-closemenu" onClick={onClose}>
              ×
            </div>
            <GDPRPopup />
            <main id="loginmodalmain" className="modal-loginpage">
              <div className="content">
                <h1 className="logo">Traino</h1>
                <form
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                >
                  <div className="input-group">
                    <input
                      type="text"
                      id="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Lösenord"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      // onFocus={handleInputFocus}
                      // onBlur={handleInputBlur}
                    />
                    <PasswordToggle
                      showPassword={showPassword}
                      togglePasswordVis={() => setShowPassword((prev) => !prev)}
                    />
                  </div>
                  <div className="checkboxes">
                    <div className="input-group">
                      <label htmlFor="rememberme" className="rememberme">
                        <input
                          className="hiddencheckbox"
                          type="checkbox"
                          id="rememberme"
                          checked={keepLoggedIn}
                          onChange={handleKeepLoggedIn}
                        />
                        <span className="customcheckbox"></span>
                        {/* Håll mig inloggad */}
                        {translate('keep_me_logged_in', language)}
                      </label>
                    </div>
                  </div>
                  {loading ? (
                    <div className="buttonloader">
                      {/* Loading */}
                      {translate('loading', language)}
                      <Loader />
                    </div>
                  ) : (
                    <button type="button" className="button bigbutton" onClick={handleLoginClick}>
                      {/* Logga in */}
                      {translate('log_in', language)}
                    </button>
                  )}
                  <div className="forgot-container">
                    <Link href="/forgot-password" className="forgotlink">
                      {/* Glömt lösenord? */}
                      {translate('forgot_password', language)}
                    </Link>
                  </div>
                </form>
                <div className="login-bottom">
                  <span>
                    {/* Har du inget konto? */}
                    {translate('no_account', language)}
                  </span>
                  <Link href="/signup">
                    {/* Skapa konto */}
                    {translate('create_account', language)}
                  </Link>
                </div>
              </div>
            </main>
          </div>
          <div className="darkoverlay" onClick={onClose}></div>
        </div>
      )}
    </>
  );
}
