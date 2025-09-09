'use client';

import { useEffect, useState } from 'react';
import { getCookie } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { getUserDetails } from '../../functions/functions';
import { checkoutSession } from '../../functions/fetchDataFunctions';

import { DEBUG } from '../../api/secretcontext';

import Link from 'next/link';
import Loader from '@/app/components/Loader';

import { stripePromise } from '../../api/stripe/connect';

const CheckoutButton = ({ onStartPayment, selectedProducts, totalCost }) => {
  const { sessionObject, baseUrl, useTranslations, language, userDetails } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const { translate } = useTranslations('global', language);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const userId = getCookie('user_id');
        if (!userId) throw new Error('User ID not found in cookies');

        const userDetails = await getUserDetails(userId);
        setUserId(userId);
        setUserEmail(userDetails.email);
      } catch (err) {
        console.error('Error fetching user email: ', err);
        setError('Failed to fetch user email');
      }
    };
    fetchUserEmail();
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      if (!userEmail) throw new Error('User email is not available');

      const bodyData = {
        customerEmail: userEmail,
        customerId: userId,
        totalCost: totalCost.totalCost,
        product: selectedProducts[0],
      };

      DEBUG && console.table('Body Data', bodyData);
      /* 
      const response = await fetch('/api/stripe/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: userEmail,
          customerId: userId,
          totalCost: totalCost.totalCost,
          product: selectedProducts[0],
        }),
      });

      if (!response.ok) throw new Error('Invalid response from server.');

      const data = await response.json(); */

      const data = await checkoutSession(bodyData);

      DEBUG && console.log('Response', data);

      const { url } = data;

      if (!url) throw new Error('Stripe URL not found in response.');

      sessionStorage.setItem('product_under_payment', JSON.stringify(selectedProducts));
      onStartPayment(url); // Pass the URL to the parent to show the iframe
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="button" disabled style={{ textTransform: 'capitalize' }}>
        {translate('loading', language)}...
      </div>
    );

  return (
    <div className="button" onClick={handleCheckout}>
      {translate('pay', language)}
    </div>
  );
};

export default CheckoutButton;
