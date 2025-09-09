import { Inter } from 'next/font/google';
import { AppProviders } from '@/app/context/AppProviders';

import AlertModal from '@/app/components/AlertModal';
import Chat from '@/app/components/Chat/Chat';
import PasswordChecker from '@/app/components/PasswordChecker';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

DEBUG && console.log('Layout - baseUrl: ', baseUrl);

export const metadata = {
  charset: 'UTF-8',
  title: 'TRAINO - Find your personal trainer',
  description: 'Find your personal trainer',
  links: [{ rel: 'manifest', href: '/manifest.json' }],
};

// MARK: Get session object
export const getSessionObject = async (baseUrl) => {
  try {
    const url = `${baseUrl}/api/getsessiontoken`;
    DEBUG && console.log('Layout - ', url);
    const response = await fetch(url);
    const contentType = response.headers.get('Content-Type');

    DEBUG && console.log(`Response Status: ${response.status}`);
    DEBUG && console.log(`Content-Type: ${contentType}`);

    if (!response.ok) {
      throw new Error(`Layout - Error fetching session object: ${response} - ${response.statusText}`);
    }

    const sessionObject = await response.json();
    return sessionObject;
  } catch (error) {
    console.error('Layout - getSessionObject:', error.message);
  }
};

// MARK: Root Layout
export default async function RootLayout({ children }) {
  let sessionObjectSource = {};

  async function fetchSessionToken() {
    try {
      sessionObjectSource = await getSessionObject(baseUrl);
    } catch (error) {
      console.error('Layout: getSessionObject:', error.message);
    }
  }

  await fetchSessionToken();

  DEBUG && console.log('Layout: sessionObjectSource:', sessionObjectSource);

  // MARK: Markup
  return (
    <AppProviders sessionObjectCtx={sessionObjectSource}>
      <html lang="en">
        <body suppressHydrationWarning className={inter.className}>
          <PasswordChecker>
            {children}
            <AlertModal />
            <Chat />
          </PasswordChecker>
        </body>
      </html>
    </AppProviders>
  );
}
