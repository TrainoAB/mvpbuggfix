export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
export const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
export function formatDateSwedish(inputDate) {
  if (!inputDate || typeof inputDate !== 'string') {
    return 'Invalid date';
  }
  const months = [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ];

  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];

  const dateParts = inputDate.split('-');
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);
  const date = new Date(year, month, day);

  const dayOfWeek = days[date.getDay()];
  const monthName = months[date.getMonth()];

  return `${dayOfWeek}, ${day} ${monthName}`;
}

export function setCookie(name, value, days) {
  if (typeof document === 'undefined') return;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const sameSite = isLocalhost ? '; SameSite=Lax' : '; SameSite=None';
  const secure = isLocalhost ? '' : '; Secure';

  document.cookie = `${name}=${value || ''}${expires}; path=/${sameSite}${secure}`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') {
    return null; // Return null if document is not defined (e.g., during server-side rendering)
  }

  const nameEQ = name + '=';
  const cookiesArray = document.cookie.split(';');
  for (let i = 0; i < cookiesArray.length; i++) {
    let cookie = cookiesArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

export function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Function to get the base URL
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  } else {
    return process.env.NEXT_PUBLIC_BASE_URL; // Default fallback
  }
};

let baseUrl;

if (DEVELOPMENT_MODE) {
  baseUrl = getBaseURL();
  if (DEBUG) {
    console.log('Base URL', baseUrl);
  }
} else {
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
}

export { baseUrl };

// MARK: Get session object
export const getSessionObject = async () => {
  if (typeof window === 'undefined') {
    // Undvik fetch under byggtiden
    return { props: { data: null } };
  }
  const response = await fetch(`${baseUrl}/api/getsessiontoken`);
  if (!response.ok) {
    throw new Error('Functions - getSessionObject: Failed to fetch session object');
  }
  const sessionObject = await response.json();
  return sessionObject;
};

let sessionObjectPromise = null;
export let sessionObject = null; // Uppdaterad till null från början

export const initializeSessionObject = async () => {
  if (!sessionObjectPromise) {
    sessionObjectPromise = getSessionObject();
    sessionObject = await sessionObjectPromise; // Vänta på upplösning och tilldela värdet
  }
  return sessionObject;
};

// Usage within another function
export const asyncSession = async () => {
  try {
    await initializeSessionObject(); // Säkerställ att sessionObject är upplöst
    console.log('Session object is ready:', sessionObject);
    return sessionObject;
  } catch (error) {
    console.error('Functions - asyncSession - Error fetching session object:', error);
    return { token: null, tokenVersion: 0 };
  }
};

// Initialize sessionObjectPromise immediately
(async () => {
  await initializeSessionObject(); // För att starta initialisering direkt
  console.log('Resolved session object:', sessionObject);
})();

export function formatMoney(number) {
  return number.toLocaleString('en-US');
}

export function debounce(func, delay) {
  let debounceTimer = null; // Track the timer
  let isExecuting = false; // Flag to track if currently executing

  return function (...args) {
    if (isExecuting) {
      console.log('Already executing');

      // If already executing, don't allow a new timer to start
      return;
    }

    clearTimeout(debounceTimer); // Clear any existing timer
    debounceTimer = setTimeout(() => {
      isExecuting = true; // Mark as executing
      func.apply(this, args); // Execute the function
      setTimeout(() => {
        isExecuting = false; // Reset the flag after execution
      }, 500);
    }, delay);
  };
}

export function debounceReturn(func, delay) {
  let debounceTimer = null; // Track the timer
  let currentPromise = null; // Track current promise

  return function (...args) {
    // If there's a current promise for the same arguments, return it
    const argsKey = JSON.stringify(args);

    clearTimeout(debounceTimer); // Clear any existing timer

    // Cancel any existing promise
    if (currentPromise) {
      currentPromise.cancelled = true;
    }

    const promise = new Promise((resolve, reject) => {
      debounceTimer = setTimeout(async () => {
        // Check if this promise was cancelled
        if (promise.cancelled) {
          reject(new Error('Promise cancelled'));
          return;
        }

        try {
          const result = await func.apply(this, args); // Execute the function

          // Check again if cancelled after async operation
          if (!promise.cancelled) {
            resolve(result); // Resolve the Promise with the result
          }
        } catch (error) {
          if (!promise.cancelled) {
            reject(error); // Reject the Promise if an error occurs
          }
        } finally {
          if (currentPromise === promise) {
            currentPromise = null; // Clear current promise
          }
        }
      }, delay);
    });

    currentPromise = promise;
    return promise;
  };
}

export function formatKnumber(number) {
  if (number >= 1000 && number < 1000000) {
    return (number / 1000).toFixed(0) + 'k';
  } else if (number >= 1000000 && number < 1000000000) {
    return (number / 1000000).toFixed(0) + 'M';
  } else if (number >= 1000000000) {
    return (number / 1000000000).toFixed(0) + 'B';
  }
  return number.toString();
}

export function getTimeRange(dateString, duration) {
  const date = new Date(dateString);

  const startHours = date.getHours().toString().padStart(2, '0');
  const startMinutes = date.getMinutes().toString().padStart(2, '0');
  const startTime = `${startHours}:${startMinutes}`;

  const endDate = new Date(date.getTime() + duration * 60000);
  const endHours = endDate.getHours().toString().padStart(2, '0');
  const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
  const endTime = `${endHours}:${endMinutes}`;

  return `${startTime} - ${endTime}`;
}

export const capitalizeFirstLetter = (string) => {
  return string.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDateToYear = (dateString) => {
  const date = new Date(dateString);
  const options = { year: 'numeric' };
  return date.toLocaleDateString('sv-SE', options);
};

export function formatDateToWord(dateString) {
  // Create a Date object from the input date string
  const date = new Date(dateString);

  // Months in English
  const englishMonths = [
    'january',
    'february',
    'mars',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  // Extract day and month
  const day = date.getDate();
  const monthIndex = date.getMonth(); // 0-indexed

  // Format the date in "day Month" format (e.g., "10 Januari")
  const formattedDate = `${englishMonths[monthIndex]}`;

  return formattedDate;
}

export function formatDateToNumber(dateString) {
  // Create a Date object from the input date string
  const date = new Date(dateString);

  // Extract day and month
  const day = date.getDate();
  const monthIndex = date.getMonth(); // 0-indexed

  const formattedDate = `${day}`;

  return formattedDate;
}

export function generateTranslations(translate, tags) {
  const translationObject = {};

  tags.forEach((tag) => {
    translationObject[tag] = translate(tag);
  });

  return translationObject;
}

// Convert km to time
export const walkTime = (km) => {
  // Calculate time in hours (distance / speed)
  const timeInHours = km / 5;

  // Extract the whole number of hours
  const hours = Math.floor(timeInHours);

  // Calculate remaining minutes
  const remainingMinutes = Math.round((timeInHours - hours) * 60);

  // Initialize an empty array to store the time components
  const timeComponents = [];

  // If hours is not zero, add it to the time components array
  if (hours !== 0) {
    timeComponents.push(`${hours} tim`);
  }

  // If minutes is not zero, add it to the time components array
  if (remainingMinutes !== 0) {
    // Limit remainingMinutes to two decimals
    const roundedMinutes = remainingMinutes;
    timeComponents.push(`${roundedMinutes} min`);
  }

  // Join the time components with ", " and return as a string
  return timeComponents.join(', ');
};

// Shorten text to 200 char
export const shortenText = (text, length = 200) => {
  if (!text) {
    DEBUG && console.log('shortenText called with null or undefined text.');
    return '';
  }

  if (typeof text !== 'string') {
    DEBUG && console.log(`shortenText expected a string but got ${typeof text}.`);
    return '';
  }

  // Check if the text length is already less than or equal to the specified length
  if (text.length <= length) {
    return text; // Return the original text if it's already short
  }

  // Find the last space before or at the specified length
  let lastSpaceIndex = length - 1;
  while (lastSpaceIndex >= 0 && text.charAt(lastSpaceIndex) !== ' ') {
    lastSpaceIndex--;
  }

  // If no space was found, shorten to the specified length without breaking words
  if (lastSpaceIndex === -1) {
    return text.substring(0, length) + '...';
  }

  // Otherwise, shorten to the last space before or at the specified length
  return text.substring(0, lastSpaceIndex) + '...';
};

// MARK: Get Categories
export async function getCategories(setTraincategories) {
  const lastUpdate = getCookie('lastupdate');
  const storedData = localStorage.getItem('traincategories');

  const lastUpdateDate = new Date(lastUpdate);
  const now = new Date();
  const timeDifference = now - lastUpdateDate;
  const hoursDifference = timeDifference / (1000 * 60); // Convert milliseconds to hours

  function removeDuplicates(arr) {
    const uniqueObjects = [];
    const seenIds = new Set();
    arr.forEach((obj) => {
      if (!seenIds.has(obj.id)) {
        uniqueObjects.push(obj);
        seenIds.add(obj.id);
      }
    });
    return uniqueObjects;
  }

  if (storedData && lastUpdate && hoursDifference < 1) {
    const data = JSON.parse(storedData);
    setTraincategories(data);
    return data; // Return data directly
  } else {
    try {
      while (!sessionObject || !sessionObject.token) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms before checking again
      }

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/categories`,
          method: 'GET',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const rawData = await response.json();
      const data = removeDuplicates(rawData);
      setTraincategories(data);

      const localdata = JSON.stringify(data);
      DEBUG && console.log('Updated sports categories in cookie');
      localStorage.setItem('traincategories', localdata);
      setCookie('lastupdate', now, 365);

      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Rethrow the error for additional error handling in the calling code
    }
  }
}

// MARK: Get User Details ID
export async function getUserDetails(userId, token = null) {
  const apiUrl = `${baseUrl}/api/users?id=${userId}`;

  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: apiUrl,
        method: 'GET',
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    // Parse the JSON response and return the data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Optionally, rethrow the error if you want to handle it later
    throw error;
  }
}

// MARK: Admin User Details
export async function adminUserDetails(userId, token = null) {
  // TODO: (adminUserDetails) Create check that the user is either admin or logged in with the same userid
  const apiUrl = `${baseUrl}/api/admin/users?id=${userId}`;

  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: apiUrl,
        method: 'GET',
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    // Parse the JSON response and return the data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Optionally, rethrow the error if you want to handle it later
    throw error;
  }
}

// MARK: Save New User Info To Database
export async function saveToDB(field, newData, userId) {
  try {
    if (Array.isArray(newData) || typeof newData !== 'object') {
      newData = { [field]: newData };
    }
    newData.id = userId;

    saveNewUserInfo(newData);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

// MARK: Save New User Info
export async function saveNewUserInfo(data, token = null) {
  DEBUG && console.log('saveNewUserInfo', data);

  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}/api/users/edit`,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    });

    // Parse the JSON response and return the data
    const res = await response.json();
    return res;
  } catch (error) {
    console.error('Error saving new user info:', error);
    // Optionally, rethrow the error if you want to handle it later
    throw error;
  }
}

// MARK: Save New Password
export async function saveNewPassword(data, token = null) {
  DEBUG && console.log('saveNewPassword', data);

  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}/api/users/edit`,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    });

    // Parse the JSON response and return the data
    const res = await response.json();

    return res;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// MARK: Get User Details Alias
export async function getUserDetailsAlias(alias, token) {
  const encodedAlias = encodeURI(alias);

  const apiUrl = `${baseUrl}/api/users?alias=${encodedAlias}`;

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: apiUrl,
        method: 'GET',
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    // Parse the JSON response and return the data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Optionally, rethrow the error if you want to handle it later
    throw error;
  }
}

// MARK: Sanitize Input
export function sanitizeInput(input, type) {
  let sanitizedInput = input;

  switch (type) {
    case 'text':
      // Remove HTML tags, but allow letters, numbers, spaces, hyphens, and underscores
      sanitizedInput = sanitizedInput.replace(/[^a-zA-Z0-9åäöÅÄÖéÉèÈêÊëËçÇñÑ\s\-!?+&$€£@'´:().,]/g, '');
      break;
    case 'number':
      // allow only numbers
      sanitizedInput = input.replace(/[^\d]/g, '');
      break;
    case 'name':
      // Remove HTML tags and special characters, but allow letters, hyphens, apostrophes, and spaces
      sanitizedInput = sanitizedInput.replace(/[^a-zA-ZåäöÅÄÖéÉèÈêÊëËçÇñÑ\-'\s]/g, '');
      // Limit name length to 50 characters
      if (sanitizedInput.length > 50) {
        sanitizedInput = sanitizedInput.slice(0, 50);
      }
      break;
    case 'phone':
      sanitizedInput = sanitizedInput.replace(/[^\d+]/g, '');
      // Check if the phone number starts with 0 and has 10 digits (Swedish format)
      if (/^0\d{9}$/.test(sanitizedInput)) {
        // Convert to E.164 format
        sanitizedInput = '+46' + sanitizedInput.slice(1);
      }
      break;
    case 'email':
      // Remove spaces and any non-email valid characters
      sanitizedInput = sanitizedInput.replace(/\s+/g, '');
      sanitizedInput = sanitizedInput.replace(/[^\w@.-]/g, '');
      break;
    case 'password':
      // Allow letters, numbers, and special characters including å, ä, and ö
      sanitizedInput = sanitizedInput.replace(/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>åäöÅÄÖ]/g, '');
      break;
    case 'personalnumber':
      /* const raw = input; // this should be the unmodified string from input field
      // Allow only digits and one hyphen
      let sanitized = raw.replace(/[^\d-]/g, '');

      // Ensure only one hyphen is allowed
      const parts = sanitized.split('-');
      if (parts.length > 2) {
        sanitized = parts[0] + '-' + parts.slice(1).join('');
      }

      // Limit to 13 characters (e.g. 'YYYYMMDD-XXXX')
      if (sanitized.length > 13) {
        sanitized = sanitized.slice(0, 13);
      }

      sanitizedInput = sanitized; */
      break;
    case 'address':
      // Allow letters, digits, commas, spaces, and hyphens
      sanitizedInput = sanitizedInput.replace(/[^a-zA-Z0-9åäöÅÄÖéÉèÈêÊëËçÇñÑ\s,.-]/g, '');
      break;
    case 'alias':
      // Allow letters, numbers, hyphens, underscores, and å, ä, ö
      sanitizedInput = sanitizedInput.replace(/[^\wåäöÅÄÖ-]/g, '');
      break;
    default:
      // Default case removes any non-word characters
      sanitizedInput = sanitizedInput.replace(/[^\w\s-]/gi, '');
  }

  // Only trim whitespace for non-text, non-name and non-address inputs
  if (type !== 'name' && type !== 'address' && type !== 'text') {
    sanitizedInput = sanitizedInput.trim();
  }

  return sanitizedInput;
}

// MARK: Validate Address Format (basic validation)
export function validateAddress(address) {
  const addressPattern = /^[a-zA-ZåäöÅÄÖéÉèÈêÊëËçÇñÑ\s]+\s\d+,\s[a-zA-ZåäöÅÄÖéÉèÈêÊëËçÇñÑ\s]+$/;
  if (!addressPattern.test(address)) {
    // You might want to handle this differently depending on your use case
    console.warn('Invalid address format. Expected format: "gatan 4, Staden"');
    return 'Invalid address format. Expected format: "gatan 4, Staden"';
  }
}

// MARK: Validate Password
export function validatePassword(password) {
  const minLength = 8;
  const maxLength = 300;

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > maxLength) {
    return 'Password must be at most 300 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include a number.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must include a special character.';
  }
  return '';
}

// MARK: Validate New Sport
export function validateNewSport(newSport, preExistingSports) {
  const maxLength = 50;
  const newSportRegex = /^[a-zA-Z\s-]+$/;
  if (newSport.length > maxLength) {
    return 'too-long';
  }

  if (preExistingSports.some((sport) => sport.category_name === newSport)) {
    return 'existing-sport';
  }

  if (!newSportRegex.test(newSport)) {
    return 'invalid-characters';
  }

  return 'valid';
}

// MARK: Is Valid Email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  if (!isValid) {
    console.error('Invalid email format:', email);
  }
  return isValid;
}

// MARK: If Email Exist
export async function ifEmailExist(email, token = null) {
  // Check if email is null, undefined, or empty string
  if (!email || email.trim() === '') {
    console.error('Email is null, undefined, or empty:', email);
    throw new Error('Email is required');
  }

  if (!isValidEmail(email)) {
    console.error('Invalid email format:', email);
    throw new Error('Invalid email format');
  }

  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}/api/checkemail`,
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Check email request failed`);
    }

    const result = await response.json();

    const isEmailFound = result.success === 'Email found';
    console.log('Email check result:', result, 'isEmailFound:', isEmailFound);
    return isEmailFound;
  } catch (error) {
    console.error('Email check error:', error);
    // Re-throw the error so the calling code can handle it properly
    throw error;
  }
}

// MARK: Logout
export function logout(isLoggedin, userData, router = null, check = false) {
  function reset() {
    DEBUG && console.log('Logged out');
    isLoggedin.current = false;
    if (userData !== '') {
      userData.current = null;
    }

    deleteCookie('enudata');
    deleteCookie('timestamp');
    deleteCookie('user_id');
    deleteCookie('user');
    deleteCookie('session_id');
    deleteCookie('loginSessionId');

    if (!check && router) {
      router.push('/train');
    }
  }

  const user_id = getCookie('user_id');
  const session_id = getCookie('session_id');
  const cookieUser = JSON.parse(getCookie('user'));

  // Check if user_id or session_id is missing
  if (userData === '' || !user_id || !session_id || !cookieUser.user_id) {
    // If either user_id or session_id is missing, call logout
    DEBUG && console.log('Missing user_id or session_id, calling reset');
    reset();
    return;
  }

  const data = {
    user_id: user_id,
    session_id: session_id,
  };

  async function loggingout() {
    try {
      DEBUG && console.log('Logging out...');
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/logout`,
          method: 'POST',
          body: JSON.stringify(data),
        }),
      });

      // Redirect to the login page after logout
      DEBUG && console.log('Logout request successful, calling reset');
      reset();
    } catch (error) {
      // Log any errors that occurred during the fetch request
      console.error('Error during logout:', error);
    }
  }

  loggingout();
}

// MARK: Check Session
export function checkSession(isLoggedin, router) {
  return new Promise((resolve, reject) => {
    const user_id = getCookie('user_id');
    const session_id = getCookie('session_id');

    // Check if user_id or session_id is missing
    if (!user_id || !session_id) {
      // If either user_id or session_id is missing, call logout and resolve with false
      if (isLoggedin) {
        logout(isLoggedin, '', router, true);
      }
      resolve(false);
      return;
    }

    const data = {
      user_id: user_id,
      session_id: session_id,
    };

    async function asyncCheckSession() {
      try {
        // Wait for sessionObject to be ready
        let currentSessionObject = sessionObject;
        if (!currentSessionObject || !currentSessionObject.token) {
          try {
            currentSessionObject = await asyncSession();
          } catch (error) {
            DEBUG && console.log('Failed to get session object for checkSession:', error);
            resolve(false);
            return;
          }
        }

        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/session`,
            method: 'POST',
            body: JSON.stringify(data),
          }),
        });

        const responseData = await response.json(); // Parse the JSON response

        // Check if the response contains "success" or "error"
        if (responseData.hasOwnProperty('success')) {
          DEBUG && console.log('Session active');
          // Resolve the promise with true
          isLoggedin.current = true;
          resolve(true);
        } else if (responseData.hasOwnProperty('error')) {
          // Display error alert
          DEBUG && console.log(responseData.error);
          isLoggedin.current = false;
          // Call logout and resolve with false
          logout(isLoggedin, '', router, true);
          resolve(false);
        } else {
          // Handle unexpected response
          DEBUG && console.error('Unexpected response from server.');
          resolve(false);
        }
      } catch (error) {
        // Log any errors that occurred during the fetch request
        console.error('Error during checking session:', error);
        // Resolve the promise with false
        resolve(false);
      }
    }

    // Usage
    asyncCheckSession();
  });
}

// MARK: Gen UUID
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// MARK: Local Storage Timestamp
export function localStorageTimestamp() {
  const currentDate = new Date();
  // Extract the components of the current date and time
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  // Format the components into the desired string format
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  // Store the formatted time in cookies
  setCookie('timestamp', formattedTime, 365);
}

// MARK: If Alias Exist
export async function ifAliasExist(alias, token = null) {
  // Use provided token or fall back to global sessionObject
  const authToken = token || (sessionObject && sessionObject.token);

  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}/api/checkalias`,
        method: 'POST',
        body: JSON.stringify({ alias: alias }),
      }),
    });

    if (!response.ok) {
      throw new Error('Check alias request failed.');
    }

    const result = await response.json();
    console.log(result);
    if (result.success === 'Alias found') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// MARK: Encrypt function
export async function encryptData(data, password) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const passwordBuffer = encoder.encode(password);

    // Import key for key derivation
    const key = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveKey']);

    // Generate salt and derive key
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt'],
    );

    // Encrypt data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      dataBuffer,
    );

    // Return as JSON serializable object
    return {
      iv: Array.from(iv),
      salt: Array.from(salt),
      data: Array.from(new Uint8Array(encryptedData)),
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Encryption failed: ' + error.message);
  }
}

// MARK: Decrypt function
export async function decryptData(encryptedData, password) {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const passwordBuffer = encoder.encode(password);

    // Convert arrays to Uint8Arrays
    const salt = new Uint8Array(encryptedData.salt);
    const iv = new Uint8Array(encryptedData.iv);
    const dataBuffer = new Uint8Array(encryptedData.data);

    console.log('Salt used for decryption:', salt);
    console.log('IV used for decryption:', iv);
    console.log('Data buffer length:', dataBuffer.length);

    // Import password to derive key
    const key = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveKey']);

    // Derive key using salt
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt'],
    );

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      dataBuffer,
    );

    // Decode and parse decrypted data
    return JSON.parse(decoder.decode(decryptedData));
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Decryption failed: ' + error.message);
  }
}

// MARK: String to Hash Code
export function stringHashCode(str) {
  let hash = 0;
  let chr;
  if (str.length === 0) return hash;
  for (var i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// MARK: Format Duration
export const formatDuration = (start, end) => {
  const startTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  const diffMs = endTime - startTime;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `(${diffHours}t, ${diffMinutes}m)`;
};

// MARK: Format Day Name
export function formatDayName(dayAbbreviation, type) {
  const dayAbbrev = dayAbbreviation.toLowerCase();

  const dayNames = {
    mon: { short: 'Mån', long: 'Måndag', longer: 'Måndagar' },
    tue: { short: 'Tis', long: 'Tisdag', longer: 'Tisdagar' },
    wed: { short: 'Ons', long: 'Onsdag', longer: 'Ondagar' },
    thu: { short: 'Tor', long: 'Torsdag', longer: 'Torsdagar' },
    fri: { short: 'Fre', long: 'Fredag', longer: 'Fredagar' },
    sat: { short: 'Lör', long: 'Lördag', longer: 'Lördagar' },
    sun: { short: 'Sön', long: 'Söndag', longer: 'Söndagar' },
  };

  if (dayAbbrev in dayNames) {
    if (type === 'short') {
      return dayNames[dayAbbrev].short;
    } else if (type === 'long') {
      return dayNames[dayAbbrev].long;
    } else if (type === 'longer') {
      return dayNames[dayAbbrev].longer;
    } else {
      throw new Error("Invalid type parameter. Use 'short','long' or 'longer'.");
    }
  } else {
    throw new Error("Invalid day abbreviation. Use 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', or 'sun'.");
  }
}

// MARK: cat to name
export function getCategoryName(inputLink, traincategories) {
  DEBUG && console.log('inside categoryName and looking at inputlink and traincategories', inputLink, traincategories);
  // Find the category object where category_link matches the input
  const category = traincategories.find((item) => item.category_link === inputLink);

  // If a matching category is found, return the category_name, otherwise return null or an error message
  return category ? category.category_name : null;
}

// MARK: cat to image
export function getCategoryImage(inputLink, traincategories) {
  let category;

  if (typeof inputLink === 'string') {
    // Find the category object where category_link matches the input
    category = traincategories.find((item) => item.category_link === inputLink);
  } else if (typeof inputLink === 'number') {
    // Find the category object where id matches the input
    category = traincategories.find((item) => item.id === inputLink);
  }

  // If a matching category is found, return the category_image, otherwise return null
  return category ? category.category_image : null;
}

// Function to convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Robust time formatting function to handle different time formats
export const formatTime = (timeString) => {
  if (!timeString) return '00:00';

  // Handle different possible time formats
  if (typeof timeString === 'string') {
    // If it's already in HH:MM:SS format, slice off seconds
    if (timeString.length === 8 && timeString.includes(':')) {
      return timeString.slice(0, 5); // HH:MM:SS -> HH:MM
    }
    // If it's in HH:MM format, return as is
    if (timeString.length === 5 && timeString.includes(':')) {
      return timeString;
    }
    // If it's a number or weird format, try to parse it
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // If it's a number (minutes since midnight), convert it
  if (typeof timeString === 'number') {
    const hours = Math.floor(timeString / 60);
    const minutes = timeString % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return '00:00';
};

// Format time range (start - end)
export const formatTimeRange = (startTime, endTime) => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};
