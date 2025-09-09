import { NextResponse } from 'next/server';
import { validateServerSecret, SERVER_SECRET, DEBUG } from '@/app/api/secretcontext';

export const config = {
  matcher: ['/((?!api/*|favicon.ico|manifest.json|_next/|assets/*).*)'],
};

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { href, pathname } = url;

  DEBUG && console.log('==== Middleware Execution Start ====');
  DEBUG && console.log('Request URL:', href);
  DEBUG && console.log('Request Method:', req.method);

  // Validate server secret
  const isSecretValid = validateServerSecret(SERVER_SECRET);
  DEBUG && console.log('Server Secret Valid:', isSecretValid);

  if (!isSecretValid) {
    DEBUG && console.log('Middleware: Invalid Secret');
    return NextResponse.json({ error: 'Invalid Secret' }, { status: 401 });
  }

  // Handle redirects
  const redirects = {
    '/events': 'https://events.traino.nu',
    '/traino': 'https://howitworks.traino.nu/',
    '/about': 'https://company.traino.nu/about',
    '/support': 'https://howitworks.traino.nu/support',
    '/faq': 'https://howitworks.traino.nu/faq',
    '/companytraining': 'https://companytraining.traino.nu',
  };

  if (redirects[pathname]) {
    return NextResponse.redirect(redirects[pathname], 301);
  }

  // Handle /admin and /admin/* paths
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const userCookie = req.cookies.get('user');
    if (userCookie) {
      let userObject;
      try {
        // userCookie.value contains the JSON string
        userObject = JSON.parse(userCookie.value);
      } catch (parseError) {
        DEBUG && console.log('Middleware: Error parsing user cookie', parseError);
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      DEBUG && console.log('User:', userObject);

      try {
        if (userObject.roll === 'admin') {
          DEBUG && console.log('User is admin, allowing access to admin paths');
          // Allow access to admin paths
        } else {
          DEBUG && console.log('User is not admin, redirecting to login');
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        DEBUG && console.log('Middleware: Error checking admin role', error);
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } else {
      DEBUG && console.log('Middleware: User cookie not found, redirecting to login');
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  /* There is a bug in the code below or inside login page/component somehow, doesnt work, going to login, still redirects to train */
  /*   // Handle /train and /train/* paths
  if (pathname === '/train' || pathname.startsWith('/train/')) {
    const userCookie = req.cookies.get('user');
    if (userCookie) {
      let user;
      try {
        user = JSON.parse(userCookie.value);
      } catch (parseError) {
        DEBUG && console.log('Middleware: Error parsing user cookie for /train', parseError);
        return NextResponse.next();
      }

      try {
        if (user.usertype === 'trainer') {
          const alias = user.alias;
          url.pathname = `/trainer/@${alias}`;
          DEBUG && console.log('New pathname:', url.pathname);
          return NextResponse.redirect(url);
        }
      } catch (error) {
        DEBUG && console.log('Middleware: Error checking trainer redirect', error);
      }
    } else {
      DEBUG && console.log('Middleware: User cookie not found');
    }
  }
 */
  // Allow all other paths to pass through
  DEBUG && console.log('Middleware processing completed successfully.');
  return NextResponse.next();
}
