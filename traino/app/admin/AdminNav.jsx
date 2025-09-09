import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
export default function AdminNav({ page }) {
  const { DEBUG, useTranslations, language } = useAppState();

  const router = useRouter();
  const { translate } = useTranslations('profile', language);
  const handleBack = (e) => {
    e.preventDefault();
    if (router && router.back) {
      router.back();
    } else {
      router.push('/train');
    }
  };

  return (
    <>
      <div className="categorytop">
        <button className="btn-back" onClick={handleBack}></button>
        <h1>
          {/* Admin */}
          {translate('admin', language)}
        </h1>
        <div></div>
      </div>
      <div className="header-buttons">
        <Link href="/admin" className={page === 'stats' ? 'active' : ''}>
          {translate('stats', language)}
        </Link>
        <Link href="/admin/users" className={page === 'users' ? 'active' : ''}>
          {translate('users', language)}
        </Link>
        {/* <Link href="/admin/faq" className={page === 'faq' ? 'active' : ''}>FAQ</Link>
                <Link href="/admin/bugreports" className={page === 'bugreports' ? 'active' : ''}>Bugs</Link> */}
        <Link href="/admin/licenses" className={page === 'licenses' ? 'active' : ''}>
          {/* Licenses */}
          {translate('licenses', language)}
        </Link>
      </div>
    </>
  );
}
