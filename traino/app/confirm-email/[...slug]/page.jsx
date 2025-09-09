'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Loader from '@/app/components/Loader';
import { useAppState } from '@/app/hooks/useAppState';

import './page.css';

export default function ConfirmEmail({ params }) {
  const { DEBUG, baseUrl, sessionObject, useTranslations, language } = useAppState();
  const [confirmed, setConfirmed] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  const { translate } = useTranslations('confirmemail', language);

  const email = decodeURIComponent(params.slug[0]);
  const confirmCode = params.slug[1];

  useEffect(() => {
    DEBUG && console.log(params);
    DEBUG && console.log('Email:', email);
    DEBUG && console.log('Code:', confirmCode);
    // Encode the email
    const encodedEmail = encodeURIComponent(email);

    async function confirmEmail(encodedEmail, confirmCode) {
      try {
        // Make the fetch request
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/confirmemail?email=${encodedEmail}&code=${confirmCode}`,
            method: 'GET',
          }),
        });

        // Parse the JSON response body
        const data = await response.json();

        if (data && data.error) {
          // If there's an error message, set confirmed to false
          setConfirmed(false);
          DEBUG && console.error('Error confirming email:', data.error);
        } else {
          // If there's no error message, set confirmed to true after 2 seconds
          setTimeout(() => {
            setConfirmed(true);
          }, 2000);
        }
      } catch (error) {
        // If an error occurs during the fetch request or JSON parsing, log the error
        setConfirmed(false);
        alert(translate('failedtoconfirm', language));
        console.error('Error confirming email:', error.message);
      }
    }

    confirmEmail(encodedEmail, confirmCode);
  }, []);

  const handleResendConfirmation = async () => {
    if (resendingEmail) return;

    setResendingEmail(true);

    try {
      const response = await fetch(`${baseUrl}/api/resend-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (data && data.success) {
        alert(translate('confirmationemailresent', language) || 'En ny bekräftelselänk har skickats till din e-post.');
      } else {
        alert(
          data.error ||
            translate('failedtoresend', language) ||
            'Kunde inte skicka om bekräftelsemail. Försök skapa ett nytt konto istället.',
        );
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      alert(
        translate('failedtoresend', language) ||
          'Kunde inte skicka om bekräftelsemail. Försök skapa ett nytt konto istället.',
      );
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <main id="confirmemail">
      <div className="content-container">
        {confirmed === null && <Loader />}

        {confirmed === true && (
          <>
            <div className="icon-div"></div>
            <h1 className="header">{translate('emailconfirmed', language)}</h1>
            <div className="text-div">{translate('explaintext_emailconfirmed', language)}</div>
            <br />
            <Link href="/login" className="button">
              {translate('login', language)}
            </Link>
          </>
        )}

        {confirmed === false && (
          <>
            <div className="icon-div failed"></div>
            <h1 className="header">{translate('notverified', language)}</h1>
            <div className="text-div">{translate('explaintex_notverified', language)}</div>
            <div className="text-div">
              Om du inte kan bekräfta din e-post, kan du antingen begära en ny bekräftelselänk eller skapa ett nytt
              konto.
            </div>
            <br />
            <button
              onClick={handleResendConfirmation}
              className="button"
              disabled={resendingEmail}
              style={{ marginBottom: '10px' }}
            >
              {resendingEmail ? 'Skickar...' : 'Skicka ny bekräftelselänk'}
            </button>
            <br />
            <Link href="/signup" className="button">
              {translate('createaccount', language)}
            </Link>
            <br />
            <Link href="/train" className="button onlyborder">
              {translate('searchtrainer', language)}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
