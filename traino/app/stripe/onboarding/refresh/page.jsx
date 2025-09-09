'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import Loader from '@/app/components/Loader';

export default function StripeOnboardingRefresh() {
  const router = useRouter();
  const { DEBUG, userData, isLoggedin } = useAppState();

  useEffect(() => {
    // Redirect back to the payments page for refresh scenarios
    const redirectToPayments = () => {
      if (isLoggedin && userData?.current?.alias) {
        const paymentsUrl = `/trainer/@${userData.current.alias}/payments`;
        DEBUG && console.log('Refreshing - redirecting to payments page:', paymentsUrl);
        router.push(paymentsUrl);
      } else {
        // If user data isn't available yet, try again in a moment
        setTimeout(redirectToPayments, 1000);
      }
    };

    // Immediate redirect for refresh
    redirectToPayments();
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
      <h2>Refreshing Stripe Setup...</h2>
      <p>Taking you back to complete your setup...</p>
    </div>
  );
}
