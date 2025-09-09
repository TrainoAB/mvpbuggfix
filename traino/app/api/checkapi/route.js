export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { API_KEY, DEVELOPMENT_MODE, baseUrl, DEBUG, isServerSecretValid, isApiKeySet } from '../secretcontext';
import { decryptData } from '@/app/functions/functions';

export async function GET(request) {
  function parseCookies(cookieString) {
    const cookies = {};
    if (!cookieString) return cookies;

    // Split the cookie string into individual cookies
    const cookiePairs = cookieString.split('; ');

    // Split each pair into key and value and decode them
    cookiePairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      cookies[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return cookies;
  }

  const SETPASSWORD = process.env.SETPASSWORD === 'true';

  // Asynchronous function to handle the request

  // Parse cookies from the request
  const cookieString = request.headers.get('cookie');
  const cookies = parseCookies(cookieString);

  // Check if `notifications` exists and parse it as JSON
  if (cookies.notifications) {
    try {
      cookies.notifications = JSON.parse(cookies.notifications);
    } catch (error) {
      console.error('Error parsing notifications cookie:', error);
    }
  }

  // Check if `enudata` exists and parse it as JSON
  if (cookies.enudata) {
    try {
      cookies.enudata = JSON.parse(cookies.enudata);
    } catch (error) {
      console.error('Error parsing enudata cookie:', error);
    }
  }

  // Reconstruct the cookies object with `notifications` as the last property
  const reorderedCookies = { ...cookies };
  if ('notifications' in reorderedCookies) {
    const notificationsValue = reorderedCookies.notifications;
    delete reorderedCookies.notifications;
    reorderedCookies.notifications = notificationsValue;
  }

  /*
  // Check if `enudata` exists and decrypt it
  if (cookies.enudata) {
    try {
      const storedData = JSON.parse(cookies.enudata);
      // Await the result of the decryptData function
      cookies.enudata = await decryptData(storedData, API_KEY);
    } catch (error) {
      console.error('Error decrypting enudata cookie:', error);
    }
  }
  */

  // Construct the response message JSON including the values
  const message = {
    message: 'Hello from the API! I am live and running some TRAINO Star Power.',
    baseUrl: baseUrl,
    debugMode: DEBUG,
    developmentMode: DEVELOPMENT_MODE,
    isServerSecretValid: isServerSecretValid,
    isApiKeySet: isApiKeySet,
    isPasswordSet: SETPASSWORD,
    you: {
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-client-ip') ||
        request.headers.get('x-cluster-client-ip') ||
        request.headers.get('forwarded') ||
        request.headers.get('remote-address') ||
        request.connection.remoteAddress,
      userAgent: request.headers.get('user-agent'),
      language: request.headers.get('accept-language'),
      host: request.headers.get('host'),
      protocol: request.headers.get('x-forwarded-proto') || request.protocol,
      referer: request.headers.get('referer') || request.headers.get('referrer'),
      origin: request.headers.get('origin'),
      cookies: reorderedCookies,
    },
  };

  // Return a response with the JSON message
  return new Response(JSON.stringify(message), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
