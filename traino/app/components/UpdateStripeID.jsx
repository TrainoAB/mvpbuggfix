import React, { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';
import Loader from '@/app/components/Loader';
import { usePathname } from 'next/navigation';
import { getStripeId, getStripeUrl, getToken } from '@/app/functions/fetchDataFunctions.js';

import './UpdateStripeID.css';

const UpdateStripeID = ({ mode = 'nostripe', stripeId: parentStripeId = null, onStripeUpdate = null }) => {
  const appState = useAppState();

  // Safety check to prevent destructuring errors
  if (!appState) {
    return <Loader />;
  }

  const {
    DEBUG = false,
    baseUrl = '',
    sessionObject = null,
    useTranslations = () => ({ translate: () => '' }),
    language = 'sv',
    isLoggedin = { current: false },
    userData = { current: null },
  } = appState;
  const [stripeId, setStripeId] = useState(parentStripeId);
  const [stripeIdLoaded, setStripeIdLoaded] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [errorMessage, setErrorMessage] = useState('');
  const [wasSignedOut, setWasSignedOut] = useState(false); // Track if user signed out
  const [isLoading, setIsLoading] = useState(false);

  const { translate } = useTranslations('myeconomy', language);
  const pathname = usePathname();

  // Sync with parent component's stripe ID only
  useEffect(() => {
    if (parentStripeId !== null) {
      setStripeId(parentStripeId);
      setCurrentMode(parentStripeId ? 'gotstripe' : 'nostripe');
      setStripeIdLoaded(true);

      // Check if user just returned from Stripe redirect
      const fromRedirect = sessionStorage.getItem('stripe_onboarding_success');
      if (fromRedirect && parentStripeId) {
        sessionStorage.removeItem('stripe_onboarding_success');
        DEBUG && console.log('Stripe onboarding completed successfully!');
        // You could show a success toast here
      }

      // Check if user cancelled Stripe onboarding
      const cancelled = sessionStorage.getItem('stripe_onboarding_cancelled');
      if (cancelled === 'true') {
        sessionStorage.removeItem('stripe_onboarding_cancelled');
        setErrorMessage('Stripe onboarding was cancelled. You can try again when ready.');
        DEBUG && console.log('Stripe onboarding was cancelled by user');
      }
    }
  }, [parentStripeId]);

  async function handleCreateStripe() {
    const newTab = window.open('', '_blank');
    try {
      setErrorMessage('');

      // Check if this is account switching - user signed out or had a stripe_id before
      const isAccountSwitching = wasSignedOut || (currentMode === 'nostripe' && mode === 'gotstripe');

      DEBUG && console.log('Creating Stripe account - is account switching:', isAccountSwitching);
      DEBUG && console.log('wasSignedOut:', wasSignedOut, 'currentMode:', currentMode, 'originalMode:', mode);

      const data = await getStripeUrl(
        userData.current.email,
        userData.current.id,
        null, // No existing stripe_id since they signed out
        isAccountSwitching, // Pass the switching flag
      );

      if (data && data.url) {
        DEBUG && console.log('Opening URL:', data);
        newTab.location.href = data.url;
      } else {
        newTab.close();
        DEBUG && console.log('No URL found in response:', data);
        setErrorMessage('Failed to create Stripe onboarding URL');
      }

      DEBUG && console.log('API call succeeded:', data);
    } catch (error) {
      DEBUG && console.log('API call failed:', error.message);
      setErrorMessage(`Failed to create Stripe account: ${error.message}`);
      newTab.close();
    }
  }

  async function handleSignOutFromStripe() {
    try {
      setErrorMessage('');
      DEBUG && console.log('Signing out from Stripe - current stripeId:', stripeId);

      const sessionObject = await getToken();
      const response = await fetch(`${baseUrl}/api/stripe/updatestripeid`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.current.email,
        }),
      });

      const data = await response.json();
      DEBUG && console.log('Sign out response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to sign out from Stripe`);
      }

      // Update local state immediately to prevent race conditions
      setStripeId(stripeId);
      console.log('Stripe ID after sign out:', stripeId);
      setCurrentMode('nostripe');
      setWasSignedOut(true);

      // Notify parent component immediately
      if (onStripeUpdate) {
        onStripeUpdate(null);
      }

      DEBUG && console.log('Successfully signed out from Stripe:', data);

      // Show success message briefly
      if (data.action === 'signed_out') {
        DEBUG && console.log('Sign out confirmed by server');
      }
    } catch (error) {
      DEBUG && console.log('Failed to sign out from Stripe:', error.message);
      setErrorMessage(`Failed to sign out from Stripe: ${error.message}`);
    }
  }

  async function handleStripeLogin() {
    try {
      setErrorMessage('');
      setIsLoading(true);

      const sessionObject = await getToken();
      if (!sessionObject?.token) {
        setErrorMessage('Ingen giltig session. Logga in först.');
        return;
      }

      const response = await fetch(`${baseUrl}/api/stripe/checkstripeid`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.current.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      if (data.hasStripeAccount) {
        // användaren är “reconnectad”
        setStripeId(data.stripe_id);
        setCurrentMode('gotstripe');
        console.log('✅ Stripe reconnected för användaren');
      } else {
        setErrorMessage('Ingen Stripe-koppling hittad, använd onboarding.');
      }
    } catch (error) {
      console.error('❌ handleStripeLogin error:', error);
      setErrorMessage(`Failed to reconnect Stripe: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="stripecontent">
      {errorMessage && (
        <div
          style={{
            color: 'red',
            marginBottom: '1rem',
            padding: '0.5rem',
            border: '1px solid red',
            borderRadius: '4px',
            backgroundColor: '#ffebee',
          }}
        >
          {errorMessage}
        </div>
      )}

      {currentMode === 'nostripe' && (
        <div className="nostripe">
          <p>{translate('myeconomy_createstripeaccount', language)}</p>
          <button
            className="button stripebutton"
            onClick={handleCreateStripe}
            onMouseOver={() => playSound('tickclick', '0.5')}
          >
            {translate('myeconomy_createstripeaccount_button', language)}
          </button>
          <button
            className="button stripebutton"
            onClick={handleStripeLogin}
            onMouseOver={() => playSound('tickclick', '0.5')}
          >
            Log in (existing account)
          </button>
          {isLoading && <p className="text-gray-500 mt-2">Connecting to Stripe...</p>}

          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            {translate('myeconomy_stripe_process_info', language)}
          </p>
        </div>
      )}

      {currentMode === 'gotstripe' && stripeId && (
        <div className="gotstripe">
          <div
            style={{
              color: 'green',
              marginBottom: '1rem',
              padding: '0.5rem',
              border: '1px solid green',
              borderRadius: '4px',
              backgroundColor: '#e8f5e8',
            }}
          >
            ✅ {translate('myeconomy_stripe_connected', language)} (ID: {stripeId.substring(0, 10)}...)
          </div>

          <p style={{ marginBottom: '1rem', color: '#666' }}>{translate('myeconomy_disconnect_info', language)}</p>

          <button
            className="button stripebutton"
            onClick={handleSignOutFromStripe}
            onMouseOver={() => playSound('tickclick', '0.5')}
            style={{ backgroundColor: '#e74c3c', borderColor: '#c0392b' }}
          >
            {translate('myeconomy_signout_stripe', language)}
          </button>

          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            {translate('myeconomy_stripe_process_info', language)}
          </p>
        </div>
      )}
    </div>
  );
};

export default UpdateStripeID;
