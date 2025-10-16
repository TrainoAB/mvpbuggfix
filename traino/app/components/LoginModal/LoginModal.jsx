'use client';
import { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'next/navigation';
import { GDPRPopup } from '../GDPRPopup';
import { playSound } from '@/app/components/PlaySound';
import Link from 'next/link';
import PasswordToggle from '../Inputs/PasswordToggle';
import Loader from '../Loader';
import Image from 'next/image';

import './LoginPage.css';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, loginModalType = 'modal' }) {
  const {
    API_KEY,
    DEBUG,
    isLoggedin,
    loginUpdate,
    setloginUpdate,
    userData,
    isMobile,
    isKeyboardOpen,
    setIsKeyboardOpen,
    setDecryptedData,
    setEncryptedData,
    useTranslations,
    keepLoggedIn,
    setKeepLoggedIn,
    language,
    openModal,
  } = useAppState();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  const [loginModalId, setloginModalId] = useState('');
  const [showLoggedin, setShowLoggedin] = useState(() => !!(userData && userData.current && userData.current.id));
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  const emailRef = useRef();

  const { translate } = useTranslations('global', language);
  const { translate: translateConfirm } = useTranslations('confirmemail', language);

  useEffect(() => {
    if (loginModalType === 'modal') {
      playSound('swipe');
    }
  }, []);

  const togglePasswordVis = (e) => {
    e.preventDefault();
    if (e.type === 'click') {
      setShowPassword((p) => !p);
    }
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

  const fetchProfileImages = async () => {
    if (userData.current === null) {
      return;
    }

    DEBUG && console.log('Current User Data:', userData.current);

    if (userData.current.thumbnail === 1) {
      const profile = await fetch(
        `/api/aws/fetch-imgs?folder=${encodeURIComponent(userData.current.id)}&subfolder=profile`,
      );

      if (profile.ok) {
        setHasProfile(true);
      }

      DEBUG && console.log('Profile:', profile);
    }
  };

  const showUserType = (input) => {
    if (input === 'trainee') {
      return translate('trainee', language);
    } else if (input === 'trainer') {
      return translate('trainer', language);
    }
  };

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, [emailRef]);

  useEffect(() => {
    if (loginModalType === 'modal') {
      setloginModalId('loginmodal');
    } else if (loginModalType === 'page') {
      setloginModalId('logincomppage');
    } else {
      setloginModalId('loginmodal');
    }
  }, [loginModalType]);

  useEffect(() => {
    if (userData.current) {
      fetchProfileImages(userData.current.id, 'profile');
    }
  }, [userData.current]);

  useEffect(() => {
    setShowLoggedin(!!(userData && userData.current && userData.current.id));
  }, [userData]);

  useEffect(() => {
    let timer;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      // setIsTransitioning(true);
      setShowPassword(false);
      setloginUpdate(false);

      const init = async () => {
        try {
          isLoggedin.current = await checkSession(isLoggedin, router);
          if (isLoggedin.current) {
            DEBUG && console.log('User is logged in');
            const userCookie = getCookie('user');
            if (userCookie) {
              if (loginModalType === 'page') {
                await fetchProfileImages(userData.current.id, 'profile');
                setShowLoggedin(true);
              } else {
                onClose();
              }
            } else {
              const user_id = getCookie('user_id');
              if (user_id) {
                const data = await getUserDetails(user_id);
                DEBUG && console.log('User details fetched:', data);
                await handleEncrypt(data, API_KEY);
                if (loginModalType === 'page') {
                  await fetchProfileImages(userData.current.id, 'profile');
                  setShowLoggedin(true);
                } else {
                  onClose();
                }
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
      // setIsTransitioning(false);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // MARK: handleLoginClick
  const handleLoginClick = async (event) => {
    event.preventDefault();
    const passwordtrim = password.trim();
    setLoading(true);

    try {
      // Wait for sessionObject to be ready or get a new one
      let currentSessionObject = sessionObject;
      if (!currentSessionObject || !currentSessionObject.token) {
        try {
          const { asyncSession } = await import('@/app/functions/functions');
          currentSessionObject = await asyncSession();
          DEBUG && console.log('Got session object for login:', currentSessionObject);
        } catch (error) {
          console.error('Failed to get session object:', error);
          // Fallback: try to get session token directly
          const tokenResponse = await fetch(`${baseUrl}/api/getsessiontoken`);
          currentSessionObject = await tokenResponse.json();
        }
      }

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSessionObject.token}`,
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
          openModal(`${translate('loginfailed', language)} ${data.error}`);
        }

        setLoading(false);
        return;
      }

      if (data.success) {
        const { id, alias, session_id } = data;
        setCookie('user', JSON.stringify(data), 365);
        setCookie('user_id', id, 365);
        setCookie('session_id', session_id, 365);

        // Set encrypted session cookie for API authentication
        try {
          const { setSessionCookie } = await import('@/app/api/serverfetch');
          await setSessionCookie(session_id, 90, API_KEY); // 90 days expiry, pass API_KEY
          DEBUG && console.log('Encrypted session cookie set successfully');
        } catch (error) {
          console.error('Failed to set encrypted session cookie:', error);
        }

        localStorageTimestamp();
        await handleEncrypt(data, API_KEY);

        userData.current = data;
        isLoggedin.current = true;

        playSound('success2', '0.5');

        DEBUG && console.log('isLoggedin.current', isLoggedin.current);
        DEBUG && console.log('userData.current', userData.current);

        onLoginSuccess(userData.current);

        if (loginModalType === 'page') {
          await fetchProfileImages(userData.current.id, 'profile');
          setShowLoggedin(true);
        } else {
          setTimeout(() => {
            setloginUpdate((prev) => !prev);
            DEBUG && console.log('loginUpdate toggled');
          }, 0);

          onClose();
        }
      } else {
        setLoading(false);
        openModal(translate('invalidemailpassword', language));
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      openModal(translate('networkresponseerror', language));
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

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.trim().toLowerCase();
    setEmail(newEmail);
  };

  const handleKeepLoggedIn = (e) => {
    DEBUG && console.log('Keep me logged in');
    playSound('check', '0.5');
    setKeepLoggedIn((prev) => !prev);
  };

  // MARK: Markup
  return (
    <>
      {isOpen && (
        <div id={loginModalId} className={isVisible ? 'visible' : ''}>
          <div className={`${loginModalId !== 'logincomppage' ? 'modal-content' : ''}`}>
            {loginModalType === 'modal' && (
              <div className="btn-closemenu" onClick={onClose}>
                ×
              </div>
            )}
            <GDPRPopup />
            <main id="loginmodalmain">
              {loginModalType === 'page' && (
                <>
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
                </>
              )}

              <div className="content">
                {loginModalType === 'page' && showLoggedin && userData && userData.current.id ? (
                  <>
                    <h1 className="logo">Traino</h1>
                    <h2>{translate('loggedinas', language)}</h2>
                    <Link
                      href={
                        userData.current.usertype === 'trainer'
                          ? userData.current.stripe_account === 0
                            ? `/trainer/@${userData.current.alias}/payments`
                            : `/trainer/@${userData.current.alias}`
                          : `/trainee/${userData.current.id}`
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
                            alt={''}
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
                      {translate('chooseotheraccount', language)}
                    </button>
                    <div className="login-bottom">
                      <span>{translate('donthaveaccount', language)}</span>
                      <Link href="/signup">{translate('createaccount', language)}</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="logo">Traino</h1>
                    <form
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    >
                      <div className="input-group">
                        <input
                          ref={emailRef}
                          type="text"
                          id="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={handleEmailChange}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          placeholder={translate('password', language)}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
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
                              onChange={handleKeepLoggedIn}
                            />
                            <span className="customcheckbox"></span>
                            {translate('keeploggedin', language)}
                          </label>
                        </div>
                      </div>
                      {loading ? (
                        <div className="buttonloader">
                          <Loader />
                        </div>
                      ) : (
                        <button type="button" className="button bigbutton" onClick={handleLoginClick}>
                          {translate('login', language)}
                        </button>
                      )}
                      <div className="forgot-container">
                        <Link href="/forgot-password" className="forgotlink">
                          {translate('forgotpassword', language)}
                        </Link>
                      </div>
                    </form>
                    <div className="login-bottom">
                      <span>{translate('donthaveaccount', language)}</span>
                      <Link href="/signup">{translate('createaccount', translate)}</Link>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
          <div className="darkoverlay" onClick={onClose}></div>
        </div>
      )}
    </>
  );
}
