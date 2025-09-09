'use client';
import { useEffect, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';

export default function GetStripeID() {
  const { DEBUG, sessionObject, baseUrl, useTranslations, language } = useAppState();
  const [stripeID, setStripeID] = useState(null);

  useEffect(() => {
    const fetchStripeID = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/stripe/getstripeid`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': language,
          },
          body: JSON.stringify({ email: 'fredrik.berglund@traino.nu' }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Stripe ID');
        }

        const data = await response.json();
        DEBUG && console.log('Response:', data);
        const stripeID = data.stripeID;

        if (stripeID) {
          setStripeID(stripeID);
          DEBUG && console.log('Stripe ID:', stripeID);
        }
      } catch (error) {
        console.error('Error fetching Stripe ID:', error);
      }
    };

    fetchStripeID();
  }, [baseUrl, language, DEBUG]);

  return (
    <main>
      <h1>Get Stripe ID</h1>
      {stripeID ? <p>{stripeID}</p> : <p>Loading...</p>}
    </main>
  );
}
