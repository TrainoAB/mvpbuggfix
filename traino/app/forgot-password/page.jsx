'use client';
import { useState, useRef, useEffect } from 'react';
import './page.css';
import Link from 'next/link';
import { isValidEmail } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { useRouter } from 'next/navigation';

import Loader from '@/app/components/Loader';

export default function ForgotPassword() {
  const { DEBUG, baseUrl, sessionObject, useTranslations, language, isMobile, setIsKeyboardOpen } = useAppState();
  const [email, setEmail] = useState('');
  const [emailsent, setEmailsent] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [counter, setCounter] = useState(0);
  const router = useRouter();
  const intervalRef = useRef(null);

  const { translate } = useTranslations('forgotpassword', language);

  const startTimer = () => {
    if (intervalRef.current) return; // Prevent multiple intervals
    setCounter(60);
    intervalRef.current = setInterval(() => {
      setCounter((prevCounter) => {
        if (prevCounter <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null; // Reset the interval reference
          return 0;
        }
        return prevCounter - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  const handleLinkClick = (event) => {
    event.preventDefault();

    startTimer();

    setLoading(true);
    if (email === '') {
      alert(translate('enteremail', language));
      setLoading(false);
      return;
    }

    const isValid = isValidEmail(email);
    if (!isValid) {
      alert(translate('validemail', language));
      setLoading(false);
      return;
    }
    DEBUG && console.log(email);

    async function forgotPassword(email) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/forgot_password`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
          }),
        });
        const data = await response.json();

        if (response.ok) {
          DEBUG && console.log('Success:', data.message);
          setEmailsent(true);
          setLoading(false);
        } else {
          console.error('Error:', data.error);
          alert('Error:', data.error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error:', data.error);
        setLoading(false);
      }
    }

    // Usage
    forgotPassword(email);
  };

  // Function to handle input focus
  const handleInputFocus = () => {
    if (isMobile) {
      setIsKeyboardOpen(true);
    }
  };

  // Function to handle input blur
  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const clearInput = () => {
    setEmail('');
  };

  // MARK: Markup
  return (
    <main id="forgotpassword">
      <button className="back-btn" onClick={() => router.push('/login')}></button>
      <div className="content-container">
        {!emailsent && <div className="icon-div"></div>}
        {emailsent && <div className="icon-div2"></div>}
        {!emailsent ? (
          <>
            <h1 className="header">{translate('forgotpassword', language)}</h1>
            <div className="text-div">{translate('explaintext_enteremail', language)}</div>
            <form className="input-container">
              <label htmlFor="email" className="label">
                {translate('email', language)}
              </label>
              <div className="input-group">
                <input
                  type="text"
                  id="email"
                  placeholder={translate('email', language)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="input"
                />
              </div>
              <br />

              <button className="button" onClick={handleLinkClick} disabled={counter > 0}>
                {translate('button_sendlink', language)}
              </button>

              {counter > 0 && (
                <p className="sendagain">
                  {/* Skicka igen om */}
                  {translate('send_again_in', language)}
                  {counter}
                  {/* sekunder */}
                  {translate('seconds', language)}
                </p>
              )}

              <br />
              <br />
              <div className="buttons">
                <Link href="/login">{translate('login', language)}</Link>
                <Link href="/signup">{translate('createaccount', language)}</Link>
              </div>
            </form>

            <br />
          </>
        ) : (
          <>
            <h1 className="header">{translate('header_sendtomail', language)}</h1>
            <div className="text-div">{translate('explaintext_sendtomail', language)}</div>
            <br />
            <div className="input-container">
              <div className="buttons">
                <Link href="/login" className="button">
                  {translate('login', language)}
                </Link>
                <Link href="/signup">{translate('createaccount', language)}</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
