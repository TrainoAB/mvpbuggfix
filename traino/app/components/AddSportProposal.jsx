import React, { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getCookie } from '@/app/functions/functions';
import './addSportProposal.css';

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  );
};

// AddSportProposal Component
export default function AddSportProposal({ onProposalSubmit }) {
  const { DEBUG, useTranslations, language, baseUrl, sessionObject } = useAppState();

  const { translate } = useTranslations('addsport', language);

  const [showModal, setShowModal] = useState(false);
  const [sportProposal, setSportProposal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleOpenModal = (event) => {
    event.preventDefault();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSportProposal('');
    setSubmitMessage('');
    setShowModal(false);
  };

  const handleChange = (event) => {
    setSportProposal(event.target.value);
  };

  const handleSubmit = async () => {
    if (sportProposal.trim() === '') {
      setSubmitMessage('Vänligen ange ett sportnamn');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get user ID from cookie
      const userId = getCookie('user_id');
      if (!userId) {
        setSubmitMessage('Du måste vara inloggad för att föreslå en sport');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/sports/proposal`,
          method: 'POST',
          body: JSON.stringify({
            sport_name: sportProposal.trim(),
          }),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setSubmitMessage(data.error);
      } else {
        setSubmitMessage('Tack! Ditt sportförslag har skickats in för granskning.');
        setSportProposal('');

        // Call the original callback if it exists
        if (onProposalSubmit) {
          onProposalSubmit(sportProposal.trim());
        }

        // Close modal after a delay to show success message
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      }
    } catch (error) {
      DEBUG && console.error('Error submitting sport proposal:', error);
      setSubmitMessage('Ett fel uppstod när förslaget skulle skickas. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-proposal">
      <button className="add-proposal-btn" onClick={handleOpenModal}>
        {translate('addsport_proposenewsport', language)}
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <h2>{translate('addsport_proposenewsport', language)}</h2>
        <input
          type="text"
          value={sportProposal}
          onChange={handleChange}
          placeholder={translate('addsport_writeyourproposal', language)}
          className="proposal-input"
          disabled={isSubmitting}
        />

        {submitMessage && (
          <div
            className={`submit-message ${
              submitMessage && submitMessage.includes && submitMessage.includes('Tack') ? 'success' : 'error'
            }`}
          >
            {submitMessage}
          </div>
        )}

        <div className="button-container">
          <button
            className="submit-proposal-btn button"
            onClick={handleSubmit}
            disabled={isSubmitting || !sportProposal.trim()}
          >
            {isSubmitting ? 'Skickar...' : translate('submit', language)}
          </button>
          <button
            type="button"
            className="cancel-proposal-btn button"
            onClick={handleCloseModal}
            disabled={isSubmitting}
          >
            {translate('cancel', language)}
          </button>
        </div>
      </Modal>
    </div>
  );
}
