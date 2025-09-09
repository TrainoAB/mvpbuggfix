'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { isValidEmail } from '@/app/functions/functions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/app/components/Loader';

import './page.css';

export default function ResendConfirmation() {
  const { DEBUG, baseUrl, useTranslations, language, isMobile, setIsKeyboardOpen } = useAppState();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [counter, setCounter] = useState(0);
  const router = useRouter();
  const intervalRef = useRef(null);

  const { translate } = useTranslations('confirmemail', language);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      setMessage('Vänligen ange en giltig e-postadress.');
      setSuccess(false);
      return;
    }

    startTimer();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${baseUrl}/api/resend-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Rate limit exceeded - sync client timer with server
        const retryAfter = data.retryAfter || 60;
        setCounter(retryAfter);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          setCounter((prevCounter) => {
            if (prevCounter <= 1) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              return 0;
            }
            return prevCounter - 1;
          });
        }, 1000);

        setMessage(data.error || 'För många försök. Vänta innan du försöker igen.');
        setSuccess(false);
      } else if (data && data.success) {
        setMessage('En ny bekräftelselänk har skickats till din e-post. Kontrollera din inkorg.');
        setSuccess(true);
        setEmailSent(true);
        setEmail('');
      } else {
        setMessage(
          data.error ||
            'Kunde inte skicka bekräftelsemail. Kontrollera att e-postadressen är korrekt och att du har ett overifierat konto.',
        );
        setSuccess(false);
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      setMessage('Ett fel uppstod. Försök igen senare.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
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

  return (
    <main id="resendconfirmation">
      <button className="back-btn" onClick={() => router.push('/login')}></button>
      <div className="content-container">
        {!emailSent && <div className="icon-div"></div>}
        {emailSent && <div className="icon-div2"></div>}
        {!emailSent ? (
          <>
            <h1 className="header">Skicka om bekräftelsemail</h1>
            <div className="text-div">
              Om du inte fick din bekräftelselänk eller om den inte fungerar, kan du begära en ny här. Detta fungerar
              endast för konton som ännu inte är verifierade.
            </div>
            <form className="input-container" onSubmit={handleSubmit}>
              <label htmlFor="email" className="label">
                E-postadress
              </label>
              <div className="input-group">
                <input
                  type="text"
                  id="email"
                  placeholder="din@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="input"
                  required
                />
              </div>

              <br />

              {loading ? (
                <div className="button loading">
                  <div className="loader-container">
                    <Loader />
                  </div>
                </div>
              ) : (
                <button type="submit" className="button" disabled={counter > 0}>
                  Skicka ny bekräftelselänk
                </button>
              )}

              {counter > 0 && <p className="sendagain">Skicka igen om {counter} sekunder</p>}

              {message && !emailSent && <div className={`message ${success ? 'success' : 'error'}`}>{message}</div>}

              <br />
              <br />
              <div className="buttons">
                <Link href="/login">Logga in</Link>
                <Link href="/signup">Skapa nytt konto</Link>
              </div>
            </form>

            <br />
          </>
        ) : (
          <>
            <h1 className="header">Bekräftelsemail skickat</h1>
            <div className="text-div">
              En ny bekräftelselänk har skickats till din e-post. Kontrollera din inkorg och klicka på länken för att
              verifiera ditt konto.
            </div>
            <br />
            <div className="input-container">
              <div className="buttons">
                <Link href="/login" className="button">
                  Logga in
                </Link>
                <Link href="/signup">Skapa nytt konto</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
