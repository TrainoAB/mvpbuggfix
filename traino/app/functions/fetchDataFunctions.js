export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
export const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

// Helper function to get cookie (consistent with app-wide usage)
const getCookie = (name) => {
  if (typeof document === 'undefined') {
    return null;
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
};

//MARK: How to use
// 1.   import the function you want to use into your file
//      ex: import { getUser } from '@/app/functions/fetchDataFunctions.js';
// 2.   Call the function from you docucument
//      ex: // const data = await getUser(userId);

// MARK: Get base URL
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
    // Avoid fetch during build time
    return { props: { data: null } };
  }
  const response = await fetch(`${baseUrl}/api/getsessiontoken`);
  if (!response.ok) {
    throw new Error('FetchDataFunctions - getSessionObject: Failed to fetch session object');
  }
  const sessionObject = await response.json();
  return sessionObject;
};

let sessionObjectPromise = null;
export let sessionObject = null; // Initially null

export const initializeSessionObject = async () => {
  if (!sessionObjectPromise) {
    sessionObjectPromise = getSessionObject();
  }
  sessionObject = await sessionObjectPromise; // Wait for the resolution and assign the value
  return sessionObject;
};

// Usage within another function
export const asyncSession = async () => {
  try {
    const sessionData = await initializeSessionObject(); // Wait for the session object to be ready
    console.log('Session object is ready:', sessionData);
    return sessionData; // Return the session object to the caller
  } catch (error) {
    console.error('FetchDataFunctions - asyncSession - Error fetching session object:', error);
    return { token: null, tokenVersion: 0 };
  }
};

// Immediately initialize sessionObjectPromise
(async () => {
  await initializeSessionObject(); // Initialize the session object immediately
  console.log('Resolved session object:', sessionObject);
})();

// Function that waits for sessionObject
export const getToken = async () => {
  const sessionObject = await asyncSession(); // Wait for the session to be initialized
  return sessionObject; // Access the token once it's ready
};

// MARK: Fetch Data
export async function fetchData(urlPath) {
  const sessionObject = await getToken(); // Wait for the token
  DEBUG && console.log('Using token:', sessionObject.token);
  const allCookies = document.cookie;
  const enudata = (allCookies.match(/(?:^|;\s*)enudata=([^;]*)/) || [])[1] || '';

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        xcookie: enudata,
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: urlPath,
        method: 'GET',
      }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    DEBUG && console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// MARK: Add Data
export async function addData(urlPath, bodyData) {
  const sessionObject = await getToken(); // Wait for the token

  DEBUG && console.log('=== ADD DATA START ===');
  DEBUG && console.log('URL Path:', urlPath);
  DEBUG && console.log('Body Data:', JSON.stringify(bodyData, null, 2));
  DEBUG && console.log('Using token:', sessionObject.token ? `${sessionObject.token.substring(0, 20)}...` : 'NO TOKEN');

  try {
    const requestBody = {
      url: urlPath,
      method: 'POST',
      body: JSON.stringify(bodyData),
    };

    // Use the getCookie helper for consistency and readability
    const enudata = getCookie('enudata') || '';

    DEBUG && console.log('Proxy request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        xcookie: enudata,
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    DEBUG && console.log('Response status:', response.status);
    DEBUG && console.log('Response status text:', response.statusText);
    DEBUG && console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    DEBUG && console.log('Raw response text:', responseText);

    // Try to parse as JSON first (works for both success and error responses)
    let data;
    try {
      data = JSON.parse(responseText);
      DEBUG && console.log('Parsed JSON data:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      DEBUG && console.error('Failed to parse response as JSON:', jsonError);
      DEBUG && console.error('Response text was:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      DEBUG && console.error('HTTP error details:');
      DEBUG && console.error('- Status:', response.status);
      DEBUG && console.error('- Status Text:', response.statusText);
      DEBUG && console.error('- Response Body:', responseText);
      DEBUG && console.error('- Parsed Data:', data);

      // If the JSON contains an error message, throw that instead of the generic HTTP error
      if (data && (data.error || data.message)) {
        // Handle multilingual error messages - check both data.message and data.error
        let errorMessage = data.message || data.error;

        DEBUG && console.log('Checking error fields - data.error:', data.error, 'data.message:', data.message);

        // First try data.message (which often contains the detailed multilingual message)
        if (data.message && typeof data.message === 'string') {
          try {
            const parsedMessage = JSON.parse(data.message);
            if (typeof parsedMessage === 'object' && (parsedMessage.en || parsedMessage.sv)) {
              // Get user language from cookie or localStorage, default to 'en'
              const userLanguage =
                getCookie('language') ||
                (typeof window !== 'undefined' && localStorage.getItem('language')) ||
                (typeof window !== 'undefined' && window.navigator.language?.startsWith('sv') ? 'sv' : 'en') ||
                'en';
              errorMessage = parsedMessage[userLanguage] || parsedMessage['en'] || parsedMessage['sv'] || data.message;
              DEBUG &&
                console.log(
                  'Parsed multilingual error from data.message:',
                  errorMessage,
                  'for language:',
                  userLanguage,
                );
            } else {
              errorMessage = data.message;
            }
          } catch (e) {
            // If parsing data.message fails, try data.error
            console.log('Failed to parse data.message as JSON, trying data.error:', data.error);
            if (data.error && typeof data.error === 'string') {
              try {
                const parsedError = JSON.parse(data.error);
                if (typeof parsedError === 'object' && (parsedError.en || parsedError.sv)) {
                  const userLanguage =
                    getCookie('language') ||
                    (typeof window !== 'undefined' && localStorage.getItem('language')) ||
                    'en';
                  errorMessage = parsedError[userLanguage] || parsedError['en'] || parsedError['sv'] || data.error;
                  DEBUG &&
                    console.log(
                      'Parsed multilingual error from data.error:',
                      errorMessage,
                      'for language:',
                      userLanguage,
                    );
                } else {
                  errorMessage = data.error;
                }
              } catch (e2) {
                // If both fail, use the original values
                DEBUG && console.log('Failed to parse both data.message and data.error as JSON, using original');
                errorMessage = data.message || data.error;
              }
            } else {
              errorMessage = data.message;
            }
          }
        } else if (data.error && typeof data.error === 'string') {
          // Try parsing data.error if data.message doesn't exist or isn't a string
          try {
            const parsedError = JSON.parse(data.error);
            if (typeof parsedError === 'object' && (parsedError.en || parsedError.sv)) {
              const userLanguage =
                getCookie('language') ||
                (typeof window !== 'undefined' && localStorage.getItem('language')) ||
                (typeof window !== 'undefined' && window.navigator.language?.startsWith('sv') ? 'sv' : 'en') ||
                'en';
              errorMessage = parsedError[userLanguage] || parsedError['en'] || parsedError['sv'] || data.error;
              DEBUG &&
                console.log('Parsed multilingual error from data.error:', errorMessage, 'for language:', userLanguage);
            }
          } catch (e) {
            console.log('Failed to parse data.error as JSON, using original:', data.error);
            errorMessage = data.error;
          }
        }

        DEBUG && console.log('Final error message to throw:', errorMessage);
        throw new Error(errorMessage);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`);
      }
    }

    DEBUG && console.log('=== ADD DATA SUCCESS ===');
    return data;
  } catch (error) {
    console.error('=== ADD DATA ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    // Re-throw the error so it can be caught by the calling function
    throw error;
  }
}

// MARK: Get Product Details
export async function getProductDetails(productId, table) {
  const apiUrl = `${baseUrl}/api/products?id=${productId}&table=${table}`;
  const sessionObject = await getToken(); // Wait for the token

  const allCookies = document.cookie;
  const enudata = (allCookies.match(/(?:^|;\s*)enudata=([^;]*)/) || [])[1] || '';

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        xcookie: enudata,
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: apiUrl,
        method: 'GET',
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error getproduct_details:', err, url);
    throw err;
  }
}

//MARK: Get Products per Bounds
export async function getProductsBounds(category, data, page, limit) {
  DEBUG && console.log('Req data:', data);
  let urlPath = `${baseUrl}/api/products/bounds?cat=${category}&page=${page}&limit=${limit}`;
  DEBUG && console.log('Req url:', urlPath);
  const results = await addData(urlPath, data);
  DEBUG && console.log('Products found:', results);
  return results;
}

//MARK: Get Products Map Count
export async function getProductsMapCount(category) {
  DEBUG && console.log('Products Map count search:', category);
  let urlPath = `${baseUrl}/api/products/count/mapcount?cat=${category}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Products Map count data:', data);
  return data;
}

//MARK: Get Products Alias
export async function getProducts(userAlias) {
  const urlPath = `${baseUrl}/api/products/user?alias=${userAlias}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Products data:', data);
  return data;
}

// MARK: Get Products ID
export async function getProduct(id) {
  const urlPath = `${baseUrl}/api/products?id=${id}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Product data:', data);
  return data;
}

// MARK: Get Products Count
export async function getProductsCount(userAlias) {
  const urlPath = `${baseUrl}/api/products/count?alias=${userAlias}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Products count:', data);
  return data;
}

// MARK: Get Sport Product Count
export async function getSportProductCount(userAlias, category_link) {
  // Returns the number of products in specific sport for a user
  const urlPath = `${baseUrl}/api/products/count?alias=${userAlias}&cat=${category_link}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('SportsProductsCount:', data);
  return data;
}

//MARK: Get User ID/Alias
export async function getUser(aliasOrId) {
  // Check if aliasOrId is a id or alias
  const isNumeric = await /^\d+$/.test(aliasOrId);
  let urlPath = '';

  if (isNumeric) {
    // if id use this urlPath
    urlPath = await `${baseUrl}/api/users?id=${aliasOrId}`;
    DEBUG && console.log('Search user by ID');
  } else {
    // else use this urlPath
    urlPath = await `${baseUrl}/api/users?alias=${aliasOrId}`;
    DEBUG && console.log('Search user by ALIAS');
  }

  const data = await fetchData(urlPath);
  DEBUG && console.log('User data:', data);
  return data;
}

// MARK: Get User Name
export async function getUserName(aliasOrId) {
  // Check if aliasOrId is a id or alias
  const isNumeric = await /^\d+$/.test(aliasOrId);
  let urlPath = '';

  if (isNumeric) {
    // if id use this urlPath
    urlPath = await `${baseUrl}/api/users?id=${aliasOrId}`;
    DEBUG && console.log('Search user by ID');
  } else {
    // else use this urlPath
    urlPath = await `${baseUrl}/api/users?alias=${aliasOrId}`;
    DEBUG && console.log('Search user by ALIAS');
  }

  const data = await fetchData(urlPath);
  DEBUG && console.log('User data:', data);
  return `${data.firstname} ${data.lastname}`;
}

// MARK: Get Trainer Reviews
export async function getTrainerReviews(userId) {
  // Returns reviews for selected trainer
  const urlPath = `${baseUrl}/api/read_review?id=${userId}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Trainer Reviews:', data);
  return data;
}

// MARK: Get Schedule
export async function getSchedule(queryParams) {
  const urlPath = `${baseUrl}/api/schedule?${queryParams.toString()}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Products data:', data);
  return data;
}

// MARK: Get User Clipcards
export async function getUserClipcards(productId, userId) {
  const urlPath = `${baseUrl}/api/clipcards?product_id=${productId}${userId}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Clipcards data:', data);
  return data;
}

// MARK: Add Booking
export async function addBooking(bodyData) {
  console.log('=== ADD BOOKING START ===');
  console.log('Booking bodyData:', JSON.stringify(bodyData, null, 2));

  const urlPath = `${baseUrl}/api/booking`;
  console.log('Booking URL path:', urlPath);

  try {
    const data = await addData(urlPath, bodyData);
    console.log('=== ADD BOOKING SUCCESS ===');
    console.log('Booking response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('=== ADD BOOKING ERROR ===');
    console.error('Booking error:', error);
    throw error; // Re-throw to maintain error chain
  }
}

// MARK: Save Stripe ID
export async function saveStripeId(stripeId, userEmail) {
  DEBUG && console.log('Saving Stripe ID:', stripeId, 'for:', userEmail);
  const sessionObject = await getToken(); // Wait for the token

  const response = await fetch(`${baseUrl}/api/proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionObject.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${baseUrl}/api/stripe/updatestripeid`,
      method: 'POST',
      body: JSON.stringify({
        stripe_id: stripeId,
        email: userEmail,
      }),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to save Stripe ID`);
  }

  const data = await response.json();
  DEBUG && console.log('Stripe ID save response:', data);

  // Check for error in the response
  if (data.error) {
    throw new Error(`Save failed: ${data.error}`);
  }

  return data;
}

// MARK: Comprehensive Stripe ID check and update
export async function ensureStripeIdIsSet(userId, userEmail) {
  try {
    DEBUG && console.log('=== COMPREHENSIVE STRIPE CHECK ===');
    DEBUG && console.log('User ID:', userId, 'Email:', userEmail);

    // Step 1: Check if Stripe ID is already in database
    let stripeIdFromDb = null;
    try {
      stripeIdFromDb = await getStripeId(userId);
      DEBUG && console.log('Stripe ID from database:', stripeIdFromDb);
      if (stripeIdFromDb) {
        return stripeIdFromDb; // Already set, return it
      }
    } catch (error) {
      DEBUG && console.log('Error getting Stripe ID from database:', error.message);
    }

    // Step 2: If not in database, try to find Stripe account by email
    let stripeIdFromStripe = null;
    try {
      stripeIdFromStripe = await getStripeIdWithEmail(userEmail);
      DEBUG && console.log('Stripe ID from Stripe API:', stripeIdFromStripe);

      if (stripeIdFromStripe) {
        // Step 3: Save the found Stripe ID to database
        try {
          await saveStripeId(stripeIdFromStripe, userEmail);
          DEBUG && console.log('Successfully saved Stripe ID to database');
          return stripeIdFromStripe;
        } catch (saveError) {
          DEBUG && console.log('Error saving Stripe ID:', saveError.message);
          // Even if save fails, we found the ID, so return it
          return stripeIdFromStripe;
        }
      }
    } catch (error) {
      DEBUG && console.log('Error getting Stripe ID from Stripe API:', error.message);
    }

    // Step 4: No Stripe ID found anywhere
    DEBUG && console.log('No Stripe ID found in database or Stripe API');
    return null;
  } catch (error) {
    DEBUG && console.log('Error in comprehensive Stripe check:', error.message);
    throw error;
  }
}

// MARK: Get Stripe ID
export async function getStripeId(userId) {
  try {
    DEBUG && console.log('Fetching Stripe ID with user id:', userId);
    const sessionObject = await getToken(); // Wait for the token

    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: `${baseUrl}/api/stripe/gettrainerstripe_id`,
        method: 'POST',
        body: JSON.stringify({
          trainer_id: userId,
        }),
      }),
    });

    const data = await response.json();
    DEBUG && console.log('Stripe ID:', data.stripeId);
    return data.stripeId;
  } catch (error) {
    DEBUG && console.log('Error fetching Stripe ID', error.message);
    throw error;
  }
}

export async function getStripeIdWithEmail(email) {
  try {
    DEBUG && console.log('Fetching Stripe ID with email:', email);
    const sessionObject = await getToken(); // Wait for the token

    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: `${baseUrl}/api/stripe/gettrainerstripe_id_email`,
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    DEBUG && console.log('Stripe ID response data:', data);

    // Check for error in the response
    if (data.error) {
      throw new Error(data.error);
    }

    return data.accountId || null;
  } catch (error) {
    DEBUG && console.log('Error fetching Stripe ID with email:', error.message);
    throw new Error(`Failed to fetch Stripe ID: ${error.message}`);
  }
}

// MARK: Get Stripe URL
export async function getStripeUrl(userEmail, trainerId = null, stripeId = null, switchAccount = false) {
  DEBUG && console.log('Stripe ID passed:', stripeId);
  DEBUG && console.log('Trainer ID passed:', trainerId);
  DEBUG && console.log('Switch account flag:', switchAccount);
  const sessionObject = await getToken(); // Wait for the token

  const response = await fetch(`${baseUrl}/api/stripe/onboarding`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionObject.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userEmail,
      stripe_id: stripeId,
      trainer_id: trainerId,
      switch_account: switchAccount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to create Stripe account');
  }

  DEBUG && console.log('Signup URL:', data);
  return {
    url: data.url,
    accountId: data.accountId,
  };
}

export async function getStripeID(userEmail) {
  DEBUG && console.log('Trainer Email:', userEmail);
  const sessionObject = await getToken(); // Wait for the token

  const response = await fetch(`${baseUrl}/api/stripe/getid`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionObject.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userEmail,
    }),
  });

  const data = await response.json();
  DEBUG && console.log('Get Stripe ID Response:', data);
  if (!response.ok) {
    throw new Error('Failed to get Stripe ID');
  }
  return data.url;
}

// MARK: Add Bought Product
export async function addBoughtProduct(bodyData) {
  const urlPath = `${baseUrl}/api/products/buy`;
  const data = await addData(urlPath, bodyData);
  DEBUG && console.log('Bought product:', data);
  return data;
}

// MARK: ADdd New Password
export async function addNewPass(bodyData) {
  const urlPath = `${baseUrl}/api/schedule/createpass`;
  const data = await addData(urlPath, bodyData);
  DEBUG && console.log('Add new pass:', data);
  return data;
}

//MARK: Admin fetches
export async function getCompanyStats() {
  // Returns stats for members, transactions and so on..
  const urlPath = `${baseUrl}/api/admin/stats`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Company stats:', data);
  return data;
}

// MARK: Get Bug Reports
export async function getBugreports(page) {
  // Returns bug reports
  const urlPath = `${baseUrl}/api/admin/bugreports?page=${page}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Bug reports:', data);
  return data;
}

// MARK: Check Has Bought Product
export async function hasBoughtProduct(user_id, product_id) {
  // Returns bug reports
  const urlPath = `${baseUrl}/api/products/hasbought?id=${product_id}&user_id=${user_id}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Has bought product:', data);
  return data;
}

// MARK: Check Is Booked Pass
export async function isBookedPass(product_id, booked_date, starttime, endtime = null) {
  // Enhanced to support overlap checking when endtime is provided
  let urlPath = `${baseUrl}/api/booking/isbooked?id=${product_id}&date=${booked_date}&starttime=${starttime}`;

  // Add endtime parameter for overlap checking
  if (endtime) {
    urlPath += `&endtime=${endtime}`;
  }

  const data = await fetchData(urlPath);
  DEBUG && console.log('Is Booked:', data);
  return data;
}

// MARK: Remove Bug Report
export async function removeBugreport(reportId) {
  // Remove bug report
  const urlPath = `${baseUrl}/api/admin/bugreports/delete?id=${reportId}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Remove Bug report:', data);
  return data;
}

export async function removeLicense(licenseId) {
  // Remove bug report
  const urlPath = `${baseUrl}/api/admin/licenses/delete?id=${licenseId}`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Removed License:', data);
  return data;
}

// MARK: Add FAQ
export async function addFaq(bodyData) {
  // Adds FAQ
  DEBUG;
  const urlPath = `${baseUrl}/api/admin/faq?crud=create`;
  const data = await addData(urlPath, bodyData);
  DEBUG && console.log('Add FAQ:', data);
  return data;
}

export async function getTrainerID(bodyData) {
  // Adds FAQ
  DEBUG;
  const urlPath = `${baseUrl}/api/stripe/gettrainerstripe_id`;
  const data = await addData(urlPath, bodyData);
  DEBUG && console.log('Get TrainerID:', data);
  return data;
}

export async function getLicenses() {
  // Returns licenses
  const urlPath = `${baseUrl}/api/admin/licenses`;
  const data = await fetchData(urlPath);
  DEBUG && console.log('Licenses:', data);
  return data;
}

// MARK: CheckoutSession
export async function checkoutSession(bodyData) {
  // Returns Trainer Stripe ID
  const urlPath = `${baseUrl}/api/stripe/checkout_sessions`;
  const data = await addData(urlPath, bodyData);
  DEBUG && console.log('Checkout Session:', data);
  return data;
}

export async function checkStripeOnboardingStatus(stripeId) {
  try {
    const response = await fetch('/api/stripe/createdashboardlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stripe_id: stripeId }),
    });

    const data = await response.json();

    // If dashboard link is created successfully, onboarding is complete
    if (response.ok && data.dashboardUrl) {
      return {
        isComplete: true,
        canReceivePayments: true,
        dashboardUrl: data.dashboardUrl,
      };
    }

    // If onboarding is required, return incomplete status
    if (data.onboardingRequired) {
      return {
        isComplete: false,
        canReceivePayments: false,
        requiresOnboarding: true,
      };
    }

    // For any other error, assume incomplete
    return {
      isComplete: false,
      canReceivePayments: false,
      error: data.error || 'Unable to verify Stripe status',
    };
  } catch (error) {
    console.error('Error checking Stripe onboarding status:', error);
    return {
      isComplete: false,
      canReceivePayments: false,
      error: error.message,
    };
  }
}
