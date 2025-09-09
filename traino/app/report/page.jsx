'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/app/components/Menus/Navigation';
import BugReport from './BugReport';
import { useAppState } from '@/app/hooks/useAppState';

import './page.css';

const BugReportPage = () => {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations(language);

  const router = useRouter();

  const handleBack = () => {
    if (router && router.back) {
      router.back();
    } else {
      window.history.back(); // Fallback för äldre webbläsare
    }
  };

  return (
    <>
      <Navigation />
      <main id="bugreport">
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>{translate('report', language)}</h1>
          <div></div>
        </div>
        <BugReport />
      </main>
    </>
  );
};

export default BugReportPage;
