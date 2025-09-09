import CryptoJS from 'crypto-js';

export function generateRandomToken(key) {
  // Convert key to string
  key = key.toString();
  let lettersOnly = key.replace(/\d/g, '');
  let numbersOnly = key.replace(/\D/g, '');

  // Generate random letters and numbers (15 characters)
  const randomChars = generateRandomChars(15);
  const randomChars2 = generateRandomChars(15);

  // Generate random two-digit number (01 to 99)
  const randomTwoDigit = Math.floor(Math.random() * 90) + 10;

  // Rearrange the key based on the random two-digit number
  const rearrangedKey = rearrangeKey(numbersOnly, randomTwoDigit);

  // Construct token
  let token = randomChars + randomTwoDigit + rearrangedKey + randomChars2;

  // Insert letters in order
  let tokenArray = token.split('');
  let letterIndex = 0;

  for (let i = 0; i < tokenArray.length && letterIndex < lettersOnly.length; i++) {
    if (Math.random() < 0.3) {
      // Adjust probability to control insertion frequency
      tokenArray.splice(i, 0, lettersOnly[letterIndex]);
      letterIndex++;
      i++; // Adjust index to account for the inserted letter
    }
  }

  // If there are remaining letters, append them to the end
  while (letterIndex < lettersOnly.length) {
    tokenArray.push(lettersOnly[letterIndex]);
    letterIndex++;
  }

  token = tokenArray.join('');

  const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
  const tokenWithTimestamp = `${token}:${timestamp}`;

  const encrypted = encrypt(tokenWithTimestamp, key);

  return encrypted;
}

// Function to generate random letters and numbers
function generateRandomChars(length) {
  // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const characters = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
// Function to rearrange the key based on the random two-digit number
function rearrangeKey(key, randomTwoDigit) {
  const result = key * randomTwoDigit;

  return result;
}

function encrypt(text, key) {
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();
  return encrypted;
}

export function validateToken(encryptedToken, key, DEBUG) {
  // Convert key to string
  key = key.toString();

  // Decrypt the token
  const decrypted = decrypt(encryptedToken, key);
  if (!decrypted) {
    DEBUG && console.log('ValidateToken: Decryption failed');
    return false; // Decryption failed
  }

  // Split the decrypted string into token and timestamp
  const [token, timestamp] = decrypted.split(':');

  // Check if the token is still valid (e.g., within 24 hours)
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - parseInt(timestamp) > 24 * 60 * 60) {
    DEBUG && console.log('ValidateToken: Current Time Expired');
    return false; // Token has expired
  }

  // Extract letters from the token
  const extractedLetters = token.replace(/\d/g, '');
  // DEBUG && console.log('Extracted letters:', extractedLetters);

  // Extract letters from the token
  const extractedLettersFromKey = key.replace(/\d/g, '');
  // DEBUG && console.log('Extracted letters from key:', extractedLettersFromKey);

  if (extractedLetters !== extractedLettersFromKey) {
    DEBUG && console.log('ValidateToken: Extracted Letters Missmatch');
    return false;
  }

  // Remove letters from the token
  const withoutLetters = token.replace(/[a-zA-Z]/g, '');
  // DEBUG && console.log('Removed letters:', withoutLetters);

  // Remove letters from the key
  const withoutLettersKey = key.replace(/[a-zA-Z]/g, '');
  // DEBUG && console.log('Removed letters from Key:', withoutLettersKey);

  // Remove the first 15 characters
  const lettersWithoutFirst15 = withoutLetters.slice(15);
  // DEBUG && console.log('Letters without first 15:', lettersWithoutFirst15);

  // Extract the random two-digit number
  const randomTwoDigitStr = lettersWithoutFirst15.slice(0, 2);
  // DEBUG && console.log('Random two-digit string:', randomTwoDigitStr);

  const randomTwoDigit = parseInt(randomTwoDigitStr);
  // DEBUG && console.log('Random two-digit:', randomTwoDigit);

  if (isNaN(randomTwoDigit)) {
    DEBUG && console.log('validateToken: Invalid random two-digit number.');
    return false; // Invalid random two-digit number
  }

  // Remove the last 15 characters
  const rearrangedKey = lettersWithoutFirst15.slice(2, lettersWithoutFirst15.length - 15);
  // DEBUG && console.log('Rearranged key:', rearrangedKey);

  if (rearrangedKey.length === 0 || isNaN(parseInt(rearrangedKey))) {
    DEBUG && console.log('validateToken: Invalid rearranged key.');
    return false; // Invalid rearranged key
  }

  // Reverse the rearrangement
  const originalKey = parseInt(rearrangedKey) / randomTwoDigit;
  // DEBUG && console.log('Original key:', originalKey);

  // DEBUG && console.log('Reconstructed keys:', originalKey, withoutLettersKey);

  return originalKey === parseInt(withoutLettersKey); // Compare the reconstructed key to the original
}

function decrypt(encryptedText, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
