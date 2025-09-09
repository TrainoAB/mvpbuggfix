import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { sanitizeInput } from '@/app/functions/functions';

function ModalName({ onClose, onSave, buttonText, title, text, text2, data, data2 }) {
  const [userData, setUserData] = useState({
    firstname: data,
    lastname: data2,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const { isKeyboardOpen, setIsKeyboardOpen, isMobile, language, useTranslations } = useAppState();
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 2);
  }, []);

  const handleChange = (fieldName, value) => {
    let sanitizedValue;
    sanitizedValue = sanitizeInput(value, 'name');

    // Clear any existing error message when user types
    if (errorMessage) {
      setErrorMessage('');
    }

    setUserData({ ...userData, [fieldName]: sanitizedValue });
  };

  const checkAndSave = () => {
    const sanitizedData = {
      firstname: userData.firstname.trim(),
      lastname: userData.lastname.trim(),
    };

    // Check if names are empty
    if (sanitizedData.firstname === '' || sanitizedData.lastname === '') {
      setErrorMessage(translate('fullname_required', language));
      return;
    }

    // Check name length limits (50 characters each)
    const MAX_NAME_LENGTH = 50;

    if (sanitizedData.firstname.length > MAX_NAME_LENGTH) {
      setErrorMessage(translate('firstname_too_long', language));
      return;
    }

    if (sanitizedData.lastname.length > MAX_NAME_LENGTH) {
      setErrorMessage(translate('lastname_too_long', language));
      return;
    }

    // If all validations pass, save the data
    onSave('firstname', sanitizedData);
  };

  const handleInputFocus = (index) => {
    if (isMobile) {
      setIsKeyboardOpen(true);

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

  return (
    <>
      <div>
        <div className="modal">
          <button className="x-btn" onClick={() => onClose('firstname')}></button>
          <div className="modal-header">
            <h2 className="title">{title}</h2>
            <div className="modal-line"></div>
          </div>

          {data && <span className="value-type">{text} </span>}
          <input
            className="input"
            type="text"
            value={userData.firstname}
            maxLength={50}
            ref={(el) => (inputRefs.current[0] = el)}
            onFocus={() => handleInputFocus(0)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange('firstname', e.target.value)}
          />
          <div
            className="character-count"
            style={{
              fontSize: '12px',
              color: userData.firstname.length > 40 ? '#e74c3c' : userData.firstname.length > 35 ? '#f39c12' : '#666',
              textAlign: 'right',
            }}
          >
            {userData.firstname.length}/50
          </div>
          {data2 && <span className="value-type">{text2} </span>}
          <input
            className="input"
            type="text"
            value={userData.lastname}
            maxLength={50}
            ref={(el) => (inputRefs.current[1] = el)}
            onFocus={() => handleInputFocus(1)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange('lastname', e.target.value)}
          />
          <div
            className="character-count"
            style={{
              fontSize: '12px',
              color: userData.lastname.length > 40 ? '#e74c3c' : userData.lastname.length > 35 ? '#f39c12' : '#666',
              textAlign: 'right',
            }}
          >
            {userData.lastname.length}/50
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="modal-buttons">
            <button className="save-modal button" onClick={() => checkAndSave()}>
              {buttonText}
            </button>
            <button
              className="button onlyborder"
              onClick={() => onClose('firstname')} //sets firsname isEditing to false = close the modal
            >
              {translate('cancel', language)}
            </button>
          </div>
        </div>
        <div className="darkoverlay" onClick={() => onClose('firstname')}></div>
      </div>
    </>
  );
}

export default ModalName;
