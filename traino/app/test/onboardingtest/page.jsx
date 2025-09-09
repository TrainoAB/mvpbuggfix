'use client';
import { useState } from 'react';

export default function onboardingtest() {
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLink('');

    try {
      console.log('Submitting mail: ', email);
      const response = await fetch('/api/stripe/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status: ', response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'An unknown error occurred');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      console.log('Content-type: ', contentType);

      const data = await response.json();
      console.log(data.url);

      if (data.url) {
        setLink(data.url);
        console.log('Link set to:', data.url);
      } else {
        throw new Error('URL not found in the response');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Create Stripe Account</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Create Account</button>
      </form>
      {link && <a href={link}>To Stripe</a>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
