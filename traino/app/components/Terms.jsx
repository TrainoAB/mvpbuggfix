import React from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import GeneralTerms from '../terms/general-terms/page';
import GeneralTrainerTerms from '../terms/general-terms-trainer/page';
import GDPRTerms from '../terms/gdpr/page';

import './Terms.css';

export default function Terms({ type }) {
  const { showTerms, setShowTerms, useTranslations, language } = useAppState();

  const { translate } = useTranslations('global', language);
  const handleCloseTerms = () => {
    setShowTerms(false);
  };

  return (
    <>
      {showTerms && (
        <div id="terms-container">
          <div className="categorytop secondarytop">
            <div className="btn-back" onClick={handleCloseTerms}></div>
            <h1>{translate('terms', language)}</h1>
            <div></div>
          </div>
          {type === 'trainee' && <GeneralTerms handleBack={handleCloseTerms} />}
          {type === 'trainer' && <GeneralTrainerTerms handleBack={handleCloseTerms} />}
          {type === 'gdpr' && <GDPRTerms handleBack={handleCloseTerms} />}
        </div>
      )}
    </>
  );
}
