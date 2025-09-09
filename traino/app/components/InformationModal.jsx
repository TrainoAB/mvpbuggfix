import React, { useEffect, useState } from 'react';

import { getCookie, setCookie } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';

import './InformationModal.css';

export const InformationModal = ({ data, pageName }) => {
  const { DEBUG, useTranslations, language } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);

  const { translate } = useTranslations('global', language);

  useEffect(() => {
    const modalShown = getCookie(`${pageName}ModalShown`);
    setIsModalShown(modalShown);

    if (!modalShown) {
      setIsOpen(true);
    }
  }, [pageName]);

  const handleClose = () => {
    setIsOpen(false);
    setCookie(`${pageName}ModalShown`, 'true', 365);
  };

  if (!isOpen || isModalShown) return null;

  return (
    <div id="info-modal">
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content">
          <h2>{data.header}</h2>
          <div className="text-container">
            <p>{data.text}</p>
          </div>
          <button className="button" onClick={handleClose}>
            {translate('ok', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
