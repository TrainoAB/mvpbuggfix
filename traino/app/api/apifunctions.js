import { generateRandomToken } from './tokengen';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export async function fetchAPI(url, options = {}) {
  const GET_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  DEBUG && console.log('API KEY from env ', GET_API_KEY);

  const API_KEY = generateRandomToken(GET_API_KEY);

  DEBUG && console.log('API KEY Generated ', API_KEY);

  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `TrainoStarPower${API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Attempt to parse JSON response
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      // Handle if response is not JSON (e.g., empty response)
      console.error('Error parsing JSON:', error);
      return {}; // Return empty object or handle as needed
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Failed to fetch'); // Rethrow the error to propagate it further
  }
}
