import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import PasswordToggle from '../../../components/Inputs/PasswordToggle';
import { sanitizeInput, getCookie } from '@/app/functions/functions';

function ModalDeleteAccount({ onClose, onSave, buttonText, title, field, error }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [stripeId, setStripeId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingWarnings, setBookingWarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedBookings, setHasCheckedBookings] = useState(false);
  const {
    DEBUG,
    isKeyboardOpen,
    setIsKeyboardOpen,
    isMobile,
    baseUrl,
    sessionObject,
    // password,
    // setPassword,
    language,
    useTranslations,
    showPassword,
    setShowPassword,
    togglePasswordVis,
  } = useAppState();
  const userId = useRef(null);
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 3);
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  useEffect(() => {
    // Function to fetch user_id from cookie
    const storedUserId = getCookie('user_id');
    if (storedUserId) {
      userId.current = parseInt(storedUserId); // Assuming user_id is stored as integer
      checkBookings();
    } else {
      userId.current = null; // Set to null if user_id is not found in cookie
    }

    DEBUG && console.log('User id:', userId.current);
  }, [DEBUG]);

  const checkBookings = async () => {
    if (!userId.current) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/users/delete`,
          method: 'POST',
          body: JSON.stringify({
            id: userId.current,
            check_only: true,
          }),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setBookingWarnings(data);
        setHasCheckedBookings(true);
      }
    } catch (error) {
      console.error('Error checking bookings:', error);
      setErrorMessage('Failed to check active bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    let sanitizedValue;

    switch (field) {
      case 'currentPassword':
        sanitizedValue = sanitizeInput(value, 'password');
        setCurrentPassword(sanitizedValue);
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    // Clear previous error message
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage(translate('enter_password', language));
    } else {
      onSave({ currentPassword: currentPassword });
    }
  };

  // Function to handle input focus
  const handleInputFocus = (index) => {
    if (isMobile) {
      // Check if ref is defined
      setIsKeyboardOpen(true);
      // Scroll to the focused input
      inputRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Function to handle input blur
  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const formatDate = (date, time) => {
    const bookingDate = new Date(`${date} ${time}`);
    return bookingDate.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="modal">
        <button className="x-btn" onClick={() => onClose(field)}></button>
        <div className="modal-header">
          <h2 className="title">{title}</h2>
          <div className="modal-line"></div>
          <div className="modal-desc">
            <p>{translate('delete_account_warning', language)}</p>

            {isLoading && (
              <div className="loading-container">
                <p>{translate('checking_bookings', language)}</p>
              </div>
            )}

            {hasCheckedBookings && bookingWarnings && (
              <div className="booking-warnings">
                {bookingWarnings.refundable_bookings && bookingWarnings.refundable_bookings.length > 0 && (
                  <div className="warning-section refundable">
                    <h4>📅 {translate('refundable_bookings', language)}</h4>
                    <p>{translate('refundable_bookings_desc', language)}</p>
                    <ul>
                      {bookingWarnings.refundable_bookings.map((booking, index) => (
                        <li key={index}>
                          <strong>
                            {booking.product_type === 'trainingpass'
                              ? translate('training_pass', language)
                              : translate('online_training', language)}
                          </strong>
                          <br />
                          {formatDate(booking.booked_date, booking.starttime)} - {booking.price}kr
                        </li>
                      ))}
                    </ul>
                    <p>
                      <strong>
                        {translate('total_refund', language)}: {bookingWarnings.total_refund_amount}kr
                      </strong>
                    </p>
                  </div>
                )}

                {bookingWarnings.non_refundable_bookings && bookingWarnings.non_refundable_bookings.length > 0 && (
                  <div className="warning-section non-refundable">
                    <h4>⚠️ {translate('non_refundable_bookings', language)}</h4>
                    <p>{translate('non_refundable_bookings_desc', language)}</p>
                    <ul>
                      {bookingWarnings.non_refundable_bookings.map((booking, index) => (
                        <li key={index}>
                          <strong>
                            {booking.product_type === 'trainingpass'
                              ? translate('training_pass', language)
                              : translate('online_training', language)}
                          </strong>
                          <br />
                          {formatDate(booking.booked_date, booking.starttime)} - {booking.price}kr
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {bookingWarnings.owned_programs && bookingWarnings.owned_programs.length > 0 && (
                  <div className="warning-section programs">
                    <h4>📚 {translate('purchased_programs', language)}</h4>
                    <p>{translate('purchased_programs_desc', language)}</p>
                    <ul>
                      {bookingWarnings.owned_programs.map((program, index) => (
                        <li key={index}>
                          <strong>
                            {program.product === 'trainprogram'
                              ? translate('training_program', language)
                              : translate('diet_program', language)}
                          </strong>{' '}
                          - {program.price}kr
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!bookingWarnings.has_active_bookings && bookingWarnings.owned_programs.length === 0 && (
                  <div className="warning-section no-bookings">
                    <p>✅ {translate('no_active_bookings', language)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="value-type">{translate('password', language)}</p>
        <div className="input-group">
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-password"
            id="acc-delete-pass-input"
            placeholder={translate('current_password', language)}
            value={currentPassword}
            ref={(el) => (inputRefs.current[0] = el)}
            onFocus={() => handleInputFocus(0)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            autoComplete="off"
          />
          {currentPassword && <PasswordToggle showPassword={showPassword} togglePasswordVis={togglePasswordVis} />}
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="modal-buttons">
          <button className="save-modal button delete" onClick={handleSave} disabled={isLoading || !hasCheckedBookings}>
            {isLoading ? translate('checking', language) : buttonText}
          </button>
          <button className="button onlyborder" onClick={() => onClose(field)}>
            {translate('cancel', language)}
          </button>
        </div>
      </div>
      <div className="darkoverlay" onClick={() => onClose(field)}></div>
    </div>
  );
}

export default ModalDeleteAccount;
