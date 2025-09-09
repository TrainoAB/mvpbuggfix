'use client';
import React, { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getStripeIdWithEmail, saveStripeId } from '@/app/functions/fetchDataFunctions';

export default function StripeDebugPage() {
  const { DEBUG, userData, isLoggedin } = useAppState();
  const [email, setEmail] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, { message, type, timestamp }]);
  };

  const testStripeConnection = async () => {
    if (!email) {
      addResult('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      addResult(`Testing Stripe connection for email: ${email}`, 'info');

      // Test 1: Get Stripe ID with email
      addResult('Step 1: Searching for Stripe account...', 'info');
      const stripeId = await getStripeIdWithEmail(email);

      if (stripeId) {
        addResult(`✅ Found Stripe account: ${stripeId}`, 'success');

        // Test 2: Save Stripe ID
        addResult('Step 2: Attempting to save Stripe ID...', 'info');
        try {
          await saveStripeId(stripeId, email);
          addResult('✅ Successfully saved Stripe ID to database', 'success');
        } catch (saveError) {
          addResult(`❌ Failed to save Stripe ID: ${saveError.message}`, 'error');
        }
      } else {
        addResult('❌ No Stripe account found with this email', 'error');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Stripe Connection Debug Tool</h1>

      {!isLoggedin.current && (
        <div
          style={{
            color: 'red',
            padding: '1rem',
            border: '1px solid red',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          ⚠️ You must be logged in to use this debug tool
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Email Address:
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address to test"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={testStripeConnection}
            disabled={loading || !isLoggedin.current}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Testing...' : 'Test Stripe Connection'}
          </button>

          <button
            onClick={clearResults}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h3>Test Results:</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '0.25rem 0',
                  color: result.type === 'error' ? 'red' : result.type === 'success' ? 'green' : 'black',
                }}
              >
                <span style={{ color: '#666' }}>[{result.timestamp}]</span> {result.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>Debug Information:</h3>
        <p>
          <strong>Current User ID:</strong> {userData.current?.id || 'Not logged in'}
        </p>
        <p>
          <strong>Debug Mode:</strong> {DEBUG ? 'Enabled' : 'Disabled'}
        </p>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul>
          <li>Enter the email address associated with a Stripe account</li>
          <li>Click "Test Stripe Connection" to run the connection test</li>
          <li>Check the results to see where the connection might be failing</li>
          <li>If DEBUG mode is enabled, check the browser console for additional logs</li>
        </ul>
      </div>
    </div>
  );
}
