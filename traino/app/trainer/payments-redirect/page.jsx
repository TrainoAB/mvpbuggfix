'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import { getStripeId, saveStripeId } from '@/app/functions/fetchDataFunctions';
import Loader from '@/app/components/Loader';

export default function PaymentsRedirect() {
  const appState = useAppState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const maxAttempts = 12;

  // Safety check to prevent destructuring errors
  if (!appState) {
    return (
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
        <Loader />
        <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
      </main>
    );
  }

  // Safely destructure with fallbacks to prevent errors during state initialization
  const {
    isLoggedin = { current: false },
    userData = { current: null },
    DEBUG = false,
    baseUrl = '',
    sessionObject = null,
    useTranslations = () => ({ translate: () => '' }),
    language = 'sv',
  } = appState;

  const { translate } = useTranslations('myeconomy', language);

  useEffect(() => {
    if (translate && language) {
      setStatusMessage(translate('myeconomy_checking_stripe', language));
    }
  }, [translate, language]);

  useEffect(() => {
    // Additional safety check to ensure all required values are available
    if (!appState || !isLoggedin || !userData || !translate) {
      return;
    }

    const checkStripeAndRedirect = async () => {
      try {
        if (!isLoggedin?.current || !userData?.current) {
          DEBUG && console.log('User not logged in, redirecting to login');
          router.push('/login');
          return;
        }

        const alias = userData.current.alias;
        if (!alias) {
          DEBUG && console.log('No alias found, redirecting to login');
          router.push('/login');
          return;
        }

        // Check if user cancelled Stripe onboarding
        const cancelled = searchParams.get('cancelled');

        if (cancelled === 'true') {
          DEBUG && console.log('User cancelled Stripe onboarding');
          setStatusMessage(translate('myeconomy_onboarding_cancelled', language));

          setTimeout(() => {
            sessionStorage.setItem('stripe_onboarding_cancelled', 'true');
            router.push(`/trainer/@${alias}/payments`);
          }, 2000);
          return;
        }

        // Check if stripe_id is provided as URL parameter
        const stripeIdFromUrl = searchParams.get('stripe_id');

        if (stripeIdFromUrl) {
          DEBUG && console.log('Stripe ID found in URL parameter:', stripeIdFromUrl);
          setStatusMessage(translate('myeconomy_stripe_found_saving', language));

          try {
            // Add null checks before calling saveStripeId
            if (!userData.current?.email) {
              throw new Error('User email not available');
            }

            await saveStripeId(stripeIdFromUrl, userData.current.email);
            DEBUG && console.log('Stripe ID saved successfully from URL parameter');

            setStatusMessage(translate('myeconomy_done_redirecting', language));
            sessionStorage.setItem('from_stripe_redirect', 'true');
            sessionStorage.setItem('stripe_onboarding_success', 'true');
            router.push(`/trainer/@${alias}/payments`);
            return;
          } catch (saveError) {
            DEBUG && console.error('Error saving Stripe ID from URL:', saveError);
            setError('Failed to save Stripe ID');
            setStatusMessage(translate('myeconomy_error_redirecting', language));
            // Continue to fallback logic below
          }
        }

        DEBUG && console.log(`=== STRIPE REDIRECT CHECK ATTEMPT ${checkAttempts + 1}/${maxAttempts} ===`);
        setStatusMessage(`${translate('myeconomy_checking_stripe', language)} (${checkAttempts + 1}/${maxAttempts})`);

        // Add null checks before calling getStripeId
        if (!userData.current?.id) {
          throw new Error('User ID not available');
        }

        // Check our database for the Stripe ID
        const stripeId = await getStripeId(userData.current.id);

        if (stripeId) {
          DEBUG && console.log('Stripe ID found in database:', stripeId);
          setStatusMessage(translate('myeconomy_stripe_found_redirecting', language));
          sessionStorage.setItem('from_stripe_redirect', 'true');
          sessionStorage.setItem('stripe_onboarding_success', 'true');
          router.push(`/trainer/@${alias}/payments`);
          return;
        }

        // If no Stripe ID is found, retry or redirect
        if (checkAttempts < maxAttempts) {
          DEBUG && console.log(`No Stripe ID found yet. Webhook might be delayed. Retrying in 3 seconds...`);
          setCheckAttempts((prev) => prev + 1);
          setTimeout(checkStripeAndRedirect, 3000);
        } else {
          DEBUG && console.log('Max attempts reached, redirecting to payments page anyway');
          setStatusMessage(translate('myeconomy_timeout_redirecting', language));
          sessionStorage.setItem('from_stripe_redirect', 'true');
          router.push(`/trainer/@${alias}/payments`);
        }
      } catch (error) {
        DEBUG && console.error('Error during Stripe redirect check:', error);
        setError(error.message);
        setStatusMessage(translate('myeconomy_error_redirecting', language));

        // On error, still try to redirect to payments page
        const alias = userData?.current?.alias;
        if (alias) {
          router.push(`/trainer/@${alias}/payments`);
        } else {
          router.push('/login');
        }
      }
    };

    // Start checking after a small delay to ensure user state is loaded
    const timer = setTimeout(checkStripeAndRedirect, 1000);

    return () => clearTimeout(timer);
  }, [appState, isLoggedin, userData, router, checkAttempts, translate, language, searchParams]);

  // Show error state if there's an error
  if (error) {
    return (
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#e74c3c', marginBottom: '1rem' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
        <p style={{ color: '#666' }}>Redirecting to payments page...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
      }}
    >
      <Loader />
      <p style={{ marginTop: '1rem', color: '#666' }}>{statusMessage}</p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
        {translate('myeconomy_linking_wait_message', language)}
      </p>
      {checkAttempts >= maxAttempts / 2 && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f39c12' }}>
          {translate('myeconomy_waiting_confirmation', language)}
        </p>
      )}
    </main>
  );
}
