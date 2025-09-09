'use client';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import './SignupDone.css';

export default function SignupDone({ status = null, formData = null }) {
  const { useTranslations, language } = useAppState();

  const { translate } = useTranslations('signupdone', language);

  return (
    <div className="reg-done">
      <span className="icon-check"></span>
      <h2>{translate('signupdone_confirmemail', language)}</h2>
      <p>{translate('signupdone_confirmemailtext', language)}</p>
      <br />
      <Link href="/login" className="button">
        {translate('login', language)}
      </Link>
      <br />
      <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
        Inte fått bekräftelsemail?{' '}
        <Link href="/resend-confirmation" style={{ color: '#007bff' }}>
          Skicka om det här
        </Link>
      </p>
    </div>
  );
}
