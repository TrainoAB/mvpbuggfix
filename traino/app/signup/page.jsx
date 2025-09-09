'use client';
import { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';
import Link from 'next/link';
import SignupDone from '@/app/components/SignupDone';
import './page.css';

export default function Signup() {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('signup', language);

  return (
    <main id="signup">
      <div className="categorytop">
        <Link href="/login" className="btn-back"></Link>
        <h1>{translate('signup_title', language)}</h1>
        <div></div>
      </div>

      <div className="content">
        <Link
          href="/signup/trainee"
          className="signup-type type-trainee"
          onMouseOver={() => playSound('tickclick', '0.5')}
          onClick={() => playSound('popclick', '0.5')}
        >
          <h2>{translate('trainee', language)}</h2>
          <span>{translate('trainee_text', language)}</span>
        </Link>
        <Link
          href="/signup/trainer"
          className="signup-type type-trainer"
          onMouseOver={() => playSound('tickclick', '0.5')}
          onClick={() => playSound('popclick', '0.5')}
        >
          <h2>{translate('trainer', language)}</h2>
          <span>{translate('trainee_text', language)}</span>
        </Link>
        {/*
                <Link href="/signup/group" className="signup-type type-group">
                    <h2>Grupp</h2>
                    <span>Gym, lag eller grupp, samling tränare</span>
                </Link>
                 */}
      </div>
    </main>
  );
}
