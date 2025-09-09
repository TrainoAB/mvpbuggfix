// app/oldlogin/page.jsx
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
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
import { playSound } from '@/app/components/PlaySound';
import { GDPRPopup } from '@/app/components/GDPRPopup';
import Loader from '@/app/components/Loader';
import PasswordToggle from '@/app/components/Inputs/PasswordToggle';
import Image from 'next/image';

import './page.css';

export default function oldLogin() {
  const {
    API_KEY,
    sessionObject,
    baseUrl,
    DEBUG,
    isLoggedin,
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
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showLoggedin, setShowLoggedin] = useState(() => !!(userData && userData.current && userData.current.id));
  const [hasProfile, setHasProfile] = useState(false);

  const router = useRouter();

  const fetchProfileImages = async () => {
    const profile = await fetch(
      `/api/aws/fetch-imgs?folder=${encodeURIComponent(userData.current.id)}&subfolder=profile`,
    );

    if (profile.ok) {
      setHasProfile(true);
    }

    DEBUG && console.log('Profile:', profile);
  };

  const handleEncrypt = async (data, API_KEY) => {
    const encrypted = await encryptData(data, API_KEY); // TODO: Change API_KEY to a encryptionPassword variable
    setEncryptedData(data);
    setCookie('enudata', JSON.stringify(data), 365);
  };

  const handleDecrypt = async () => {
    const storedData = JSON.parse(getCookie('enudata'));
    if (storedData) {
      // const decrypted = await decryptData(storedData, API_KEY); // TODO: Change API_KEY to a encryptionPassword variable
      setDecryptedData(storedData);
      userData.current = storedData;
      DEBUG && console.log('Decrypted User Data:', storedData);
    }
  };

  useEffect(() => {
    setShowPassword(false);

    if (userData.current) {
      fetchProfileImages();
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        isLoggedin.current = await checkSession(isLoggedin, router);
        if (isLoggedin.current) {
          DEBUG && console.log('User is logged in');
          const storedEncryptedData = getCookie('enudata');
          if (storedEncryptedData) {
            await handleDecrypt();
            router.push('/train');
          } else {
            const user_id = getCookie('user_id');
            if (user_id) {
              const data = await getUserDetails(user_id);
              DEBUG && console.log('User details fetched:', data);
              await handleEncrypt(data, API_KEY);
              router.push('/train');
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
        // Handle error checking session
      }
    };

    init();
  }, []);

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
        alert(`Login failed. ${data.error}`); // Concatenate the error message with the string
        setLoading(false);
        return;
      }

      if (data.success) {
        playSound('success2', '0.5');
        const { id, alias, email, session_id } = data;
        setCookie('user_id', id, 365);
        setCookie('session_id', session_id, 365);

        // Assume localStorageTimestamp() is defined somewhere else
        localStorageTimestamp();

        // Encrypt user data and store it
        await handleEncrypt(data);

        // Set current user data and login status
        userData.current = data;
        isLoggedin.current = true;

        DEBUG && console.log(isLoggedin.current, userData.current);

        // Determine redirect path based on user type
        let path = '/';
        if (userData.current.usertype === 'trainee') {
          path = `/trainee/${userData.current.id}`;
        } else {
          path = `/trainer/@${userData.current.alias}`;
        }

        // Navigate to the appropriate path
        router.push(path);
      } else {
        setLoading(false);
        alert('Invalid username or password');
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      alert('An unexpected error occurred');
    }
  };

  // Function to handle input focus
  const handleInputFocus = () => {
    if (isMobile) {
      // Check if ref is defined
      setIsKeyboardOpen(true);
    }
  };

  // Function to handle input blur
  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const showUserType = (input) => {
    if (input === 'trainee') {
      return 'Lärling';
    } else if (input === 'trainer') {
      return 'Tränare';
    }
  };

  return (
    <>
      <GDPRPopup />
      <main id="loginpage" className={isKeyboardOpen ? 'showkeyboard' : ''}>
        <div className="video">
          <video width="100%" height="100%" autoPlay muted loop playsInline>
            <source src="https://traino.nu/app/assets/bg800.mp4" type="video/mp4" />
            <source src="https://traino.nu/app/assets/bg800.webp" type="video/webp" />
            Your browser does not support the video tag.
          </video>
        </div>
        <Link href="/train" className="btn-back">
          &lt;
        </Link>
        <div className="content">
          <h1 className="logo">Traino</h1>
          {showLoggedin && userData && userData.current.id ? (
            <>
              <h2>Du är inloggad som</h2>
              <Link
                href={
                  userData.current.usertype === 'trainer'
                    ? `/trainer/@${userData.current.alias}`
                    : `/trainee/@${userData.current.id}`
                }
                className="loggedinas"
                onMouseOver={() => playSound('tickclick', '0.5')}
                onClick={() => playSound('popclick', '0.5')}
              >
                <div className="image">
                  {hasProfile && (
                    <Image
                      src={`https://traino.s3.eu-north-1.amazonaws.com/${userData.current.id}/profile/profile-image.webp`}
                      width={60}
                      height={60}
                    />
                  )}
                </div>
                <div>
                  <h4>{`${userData.current.firstname} ${userData.current.lastname}`}</h4>
                  <div className="type">{showUserType(userData.current.usertype)}</div>
                </div>
              </Link>
              <button
                className="button"
                onClick={() => {
                  playSound('trickle', '0.5');
                  setShowLoggedin(false);
                }}
              >
                Välj annat konto
              </button>
            </>
          ) : (
            <>
              <form
                action=""
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              >
                <div className="input-group">
                  <input
                    type="text"
                    id="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
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
                  <PasswordToggle showPassword={showPassword} togglePasswordVis={togglePasswordVis} />
                </div>
                <div className="checkboxes">
                  <div className="input-group">
                    <label htmlFor="rememberme" className="rememberme">
                      <input
                        className="hiddencheckbox"
                        type="checkbox"
                        id="rememberme"
                        checked={keepLoggedIn}
                        onChange={(e) => {
                          playSound('check', '0.5');
                          setKeepLoggedIn(e.target.checked);
                        }}
                      />
                      <span className="customcheckbox"></span>
                      Håll mig inloggad
                    </label>
                  </div>
                </div>
                {loading ? (
                  <div className="buttonloader">
                    Loading
                    <Loader />
                  </div>
                ) : (
                  <>
                    <button type="button" className="button bigbutton" onClick={handleLoginClick}>
                      Logga in
                    </button>
                  </>
                )}

                <Link href="/forgot-password" className="forgotlink">
                  Glömt lösenord?
                </Link>
              </form>
            </>
          )}
          <div className="login-bottom">
            <span>Har du inget konto?</span>
            <Link href="/signup">Skapa konto</Link>
          </div>
        </div>
        <div className="darkoverlay"></div>
      </main>
    </>
  );
}
