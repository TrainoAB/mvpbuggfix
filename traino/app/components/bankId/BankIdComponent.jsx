// Denna komponent behöver inte translate då BankID endast är för Sverige
'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';

import QRCode from 'qrcode';

import './BankIdComponent.css';

const BankIDComponent = ({ personalnumber, onVerificationComplete, disabled }) => {
  const { DEBUG, useTranslations, language } = useAppState();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [authenticationComplete, setAuthenticationComplete] = useState(false);
  const [orderRef, setOrderRef] = useState(null);
  const [qrStartToken, setQrStartToken] = useState(null);
  const [qrStartSecret, setQrStartSecret] = useState(null);
  const [autoStartToken, setAutoStartToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30); // Time for QR code to expire

  const { translate } = useTranslations('signup', language);

  // MARK: BankID Verification
  const handleBankIDVerification = async (e) => {
    e.preventDefault();
    resetState();
    setStatus(translate('startbankid', language));
    setError('');

    try {
      const response = await fetch('/api/bankid/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalnumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'BankID-verifiering misslyckades');
      }

      const data = await response.json();
      setStatus('BankID-verifiering initierad. Följ instruktionerna nedan.');
      setPolling(true);
      setTimeLeft(30); // Reset the timeout counter

      if (data.orderRef) {
        setOrderRef(data.orderRef);
      }

      if (data.autoStartToken) {
        setAutoStartToken(data.autoStartToken);
      }

      if (data.qrStartToken && data.qrStartSecret) {
        setQrStartToken(data.qrStartToken);
        setQrStartSecret(data.qrStartSecret);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const resetState = () => {
    setStatus('');
    setError('');
    setQrCodeData('');
    setPolling(false);
    setOrderRef(null);
    setAutoStartToken(null);
    setQrStartToken(null);
    setQrStartSecret(null);
    setAuthenticationComplete(false);
    setTimeLeft(30);
  };

  const handleError = (err) => {
    setError('');
    console.error('Error during authentication:', err);
    let errorMessage = typeof err.message === 'string' ? err.message : JSON.stringify(err.message, null, 2);
    setError(`Fel: ${errorMessage}`);
    setStatus('');
  };

  //MARK: Cancellation
  const handleBankIDCancel = async () => {
    try {
      if (!orderRef) {
        throw new Error('Ingen aktiv BankID-verifiering att avbryta.');
      }

      const response = await fetch('/api/bankid/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderRef }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Misslyckades att avbryta BankID-verifiering.');
      }

      resetState();
      setStatus('BankID-verifiering avbruten.');
      if (onVerificationComplete) {
        onVerificationComplete(false); // Notify parent component
      }
    } catch (err) {
      handleError(err);
      if (onVerificationComplete) {
        onVerificationComplete(false); // Proceed even on error
      }
    }
  };

  //MARK: QR updates/timeout
  useEffect(() => {
    let qrInterval;
    let timeoutInterval;

    if (qrStartToken && qrStartSecret && !authenticationComplete) {
      let qrStartTime = Date.now();

      const updateQRCode = async () => {
        const timeSinceStart = Math.floor((Date.now() - qrStartTime) / 1000);
        const qrAuthCode = await QRAuthCode(qrStartSecret, timeSinceStart);
        const qrData = `bankid.${qrStartToken}.${qrAuthCode}`;

        QRCode.toDataURL(qrData, { margin: 0 }, (err, url) => {
          if (err) {
            handleError(err);
          } else {
            setQrCodeData(url);
          }
        });
      };

      updateQRCode();
      qrInterval = setInterval(updateQRCode, 1000); // Update every second

      // Timeout handling
      timeoutInterval = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft === 1) {
            clearInterval(qrInterval);
            handleBankIDCancel(); // Cancel and reset if timeout happens
            return 0;
          }
          return prevTimeLeft - 1;
        });
      }, 1000);

      return () => {
        clearInterval(qrInterval);
        clearInterval(timeoutInterval);
      };
    }
  }, [qrStartToken, qrStartSecret, authenticationComplete]);

  // MARK: BankID status/polling
  useEffect(() => {
    let pollingInterval;
    if (polling && orderRef) {
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/bankid/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderRef }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Misslyckades att hämta autentiseringsstatus');
          }

          const data = await response.json();

          if (data.status === 'complete') {
            setStatus('Autentisering slutförd!');
            setPolling(false);
            setAuthenticationComplete(true);
            setQrCodeData('');
            clearInterval(pollingInterval);
            if (onVerificationComplete) {
              onVerificationComplete(); // Notify parent component
            }
          } else if (data.status === 'failed') {
            setStatus('Autentisering misslyckades.');
            setPolling(false);
            clearInterval(pollingInterval);
            if (onVerificationComplete) {
              onVerificationComplete(); // Notify parent component
            }
          } else {
            setStatus(getHintMessage(data.hintCode));
          }
        } catch (err) {
          handleError(err);
          setPolling(false);
          clearInterval(pollingInterval);
          if (onVerificationComplete) {
            onVerificationComplete(); // Proceed even on error
          }
        }
      }, 2000);

      return () => {
        clearInterval(pollingInterval);
      };
    }
  }, [polling, orderRef]);

  const QRAuthCode = async (secret, time) => {
    const timeHex = ('0' + time.toString(16)).slice(-2);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(timeHex);
    const key = await window.crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
    ]);
    const signature = await window.crypto.subtle.sign('HMAC', key, data);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const getHintMessage = (hintCode) => {
    switch (hintCode) {
      case 'outstandingTransaction':
        return <div className="hint-message outstanding">Väntar på att du slutför autentiseringen i BankID-appen.</div>;
      case 'noClient':
        return <div className="hint-message no-client">Ingen BankID-app hittades. Starta din BankID-app.</div>;
      case 'started':
        return <div className="hint-message started">BankID-appen har startats. Vänligen autentisera.</div>;
      case 'userSign':
        return <div className="hint-message user-sign">Användaren signerar.</div>;
      default:
        return <div className="hint-message default">Status: {hintCode}</div>;
    }
  };

  const getBankIDAppLink = () => {
    return `bankid:///?autostarttoken=${autoStartToken}&redirect=null`;
  };

  return (
    
    <div id="bankidcomponent">
      <h3 className="signup-user-header">Verifiera dig med BankID</h3>
      {!authenticationComplete && !orderRef && (
        <button
          type="button"
          className="button button-start"
          onClick={handleBankIDVerification}
          disabled={disabled || polling}
        >
          <img className="bankid-logo" src="/assets/bankid-logo.png" alt="BankId Logo" />Starta BankID-verifiering
        </button>
      )}

      {orderRef && !authenticationComplete && (
        <button type="button" className="button cancel-button" onClick={handleBankIDCancel} disabled={!orderRef}>
          {polling ? (
            <>
              <span className="spinner"></span> Avbryt verifiering... *hoppa över
            </>
          ) : (
            'Avbryt verifiering / hoppa över *test'
          )}
        </button>
      )}

      {status && <p>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {autoStartToken && !authenticationComplete && (
        <div className="autostart-container">
          <p>
            <a className="autostart-link" href={getBankIDAppLink()}>
              Klicka här för att starta BankID-appen
            </a>
          </p>
        </div>
      )}
      {authenticationComplete && (
        <button type="button" className="button success-button">
          Verifieringen lyckades!
        </button>
      )}

      {/* {qrCodeData && !authenticationComplete && (
        <div>
          <h3>Eller scanna QR-koden</h3>
          <img className="qr-code" src={qrCodeData} alt="BankID QR Code" />

        </div>
      )} */}

      {polling && <p>Tid kvar: {timeLeft} sekunder</p>}
    </div>
  );
};

export default BankIDComponent;
