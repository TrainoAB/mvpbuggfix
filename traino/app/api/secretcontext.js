export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
export const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const SERVER_SECRET = process.env.SERVER_SECRET;
export const API_KEY = process.env.API_KEY;

export let SESSION_TOKEN = null;
export let isValidToken = false;

export const validateServerSecret = (input) => {
  // Create an object to count occurrences of each character in the input text
  const charCount = {};
  const pattern = 'TRAINOSTARPOWER326777';

  if (input !== undefined) {
    // Count occurrences of each character in the input text
    for (let char of input) {
      if (charCount[char]) {
        charCount[char]++;
      } else {
        charCount[char] = 1;
      }
    }

    // Check if each character in the pattern is present in the input text
    for (let char of pattern) {
      if (!charCount[char] || charCount[char] <= 0) {
        return false;
      }
      charCount[char]--;
    }
  } else {
    return false;
  }

  return true;
};

export const isServerSecretValid = validateServerSecret(SERVER_SECRET);
export const isApiKeySet = API_KEY !== undefined && API_KEY !== '';
