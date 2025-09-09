import React from 'react';
import { formatDateToWord, formatDateToNumber } from '../functions/functions'; // Adjust import as necessary
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';

import './CancellationModal.css';

const CancellationModal = ({
  show,
  booking,
  reason,
  onClose,
  onConfirm,
  onReasonChange,
  loading = false,
  error = '',
}) => {
  const { DEBUG, useTranslations, language } = useAppState();

  const { translate } = useTranslations('global', language);

  if (!show) return null;

  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent click from bubbling to the overlay
  };

  return (
    <div id="cancelation-modal">
      <div className="modal-container">
        <div className="modal" onClick={handleModalClick}>
          <div className="categorytop">
            <div className="btn-back" onClick={onClose}></div>
            <h2>{translate('cancelbooking', language)}</h2>
          </div>
          <div className="modal-content">
            <h3>
              {translate(`cat_${booking?.sport.category_link}`)}
              {booking?.time && `, ${booking.time} min`}
            </h3>
            <h4>{booking?.details.trainer_name}</h4> {/* Using the trainer's name */}
            <p>
              {formatDateToNumber(booking.date)} {translate(formatDateToWord(booking.date), language)}
            </p>{' '}
            {/* Format the date */}
            <p>
              {booking?.time
                ? `${booking.date.split(' ')[1]} - TBD` // TODO: Fix this to show end time
                : 'Start time not available'}
            </p>
            <textarea
              value={reason}
              onChange={onReasonChange}
              placeholder="Ange orsak till avbokning..."
              disabled={loading}
            />
            {error && (
              <div className="error-message" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <div className="modal-buttons">
              <button className="button onlyborder" onClick={onClose} disabled={loading}>
                {translate('cancel', language)}
              </button>
              <button
                className="button"
                onClick={(e) => {
                  if (!loading) {
                    playSound('canceled', '0.5');
                    onConfirm(e);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Avbokar...' : translate('cancelbooking', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="darkoverlay" onClick={onClose}></div>
    </div>
  );
};

export default CancellationModal;
