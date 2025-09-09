// GDPRPopup.js
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCookie, setCookie } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import './GDPRPopup.css';

export const GDPRPopup = () => {
  const { DEBUG, language, useTranslations } = useAppState();
  const [showPopup, setShowPopup] = useState(false);

  const { translate } = useTranslations('gdpr', language);

  useEffect(() => {
    const checkGDPRStatus = () => {
      const hasAcceptedGDPR = getCookie('acceptedGDPR');
      if (!hasAcceptedGDPR || hasAcceptedGDPR === 'false') {
        setShowPopup(true);
      }
    };

    checkGDPRStatus();

    window.addEventListener('storage', checkGDPRStatus);

    return () => {
      window.removeEventListener('storage', checkGDPRStatus);
    };
  }, []);

  const acceptGDPR = () => {
    setCookie('acceptedGDPR', true, 365);
    setShowPopup(false);
  };

  return (
    <div id="gdpr-container">
      <div className={`gdpr-overlay ${showPopup ? 'show' : ''}`}>
        <div className="gdpr-popup">
          <h2>{translate('gdpr_acceptgdpr', language)}</h2>
          <div className="text-container">
            <p>
              {translate('gdpr_accepttext', language)}
              &nbsp;
              <Link className="link" href="/terms/gdpr">
                GDPR
              </Link>
              ,{' '}
              <Link className="link" href="/terms/cookies">
                Cookies
              </Link>{' '}
              {translate('gdpr_andothertracingtechniques', language)}
            </p>
          </div>
          <div className="button-container">
            <button className="button" onClick={acceptGDPR}>
              {translate('accept', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
