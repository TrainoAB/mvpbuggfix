'use client';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from './PlaySound';
import './AlertModal.css';

const AlertModal = () => {
  const { useTranslations, language, isModalOpen, modalMessage, closeModal } = useAppState();
  const { translate } = useTranslations('global', language);
  if (!isModalOpen) return null;

  playSound('alert');

  return (
    <div id="alert-modal-container">
      <div className="alert-modal-overlay" onClick={closeModal}>
        <div className="alert-modal">
          {modalMessage}
          <button className="button" onClick={closeModal}>
            {translate('close', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
