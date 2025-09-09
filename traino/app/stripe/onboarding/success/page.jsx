'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import Loader from '@/app/components/Loader';

export default function StripeOnboardingSuccess() {
  const router = useRouter();
  const { DEBUG, userData, isLoggedin } = useAppState();

  useEffect(() => {
    // Wait a moment and then redirect to the user's payments page
    const redirectToPayments = () => {
      if (isLoggedin && userData?.current?.alias) {
        const paymentsUrl = `/trainer/@${userData.current.alias}/payments`;
        DEBUG && console.log('Redirecting to payments page:', paymentsUrl);
        router.push(paymentsUrl);
      } else {
        // If user data isn't available yet, try again in a moment
        setTimeout(redirectToPayments, 1000);
      }
    };

    // Add a small delay to ensure any backend processing is complete
    setTimeout(redirectToPayments, 2000);
  }, [isLoggedin, userData, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
      }}
    >
      <Loader />
      <h2>Stripe Account Successfully Created!</h2>
      <p>Redirecting you to your payments page...</p>
    </div>
  );
}
