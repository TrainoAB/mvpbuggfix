'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CreateStripeLink = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter an email.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const response = await fetch('/api/stripe/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        DEBUG && console.log(data);
        setMessage('Account created successfully! Redirecting...');
        router.push(data.url);
      } else {
        const errMessage = await response.text();
        setError(errMessage || 'Failed to create account');
        console.error(errMessage);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Create Stripe Account'}
      </button>
      {error && <p>{error}</p>}
      {message && <p>{message}</p>}
    </form>
  );
};

export default CreateStripeLink;
