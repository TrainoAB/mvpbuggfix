import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { sanitizeInput } from '@/app/functions/functions';

function ModalAboutMe({ onClose, onSave, buttonText, field, title, text, data }) {
  const [userData, setUserData] = useState(data || '');
  const [errorMessage, setErrorMessage] = useState('');
  const { isKeyboardOpen, setIsKeyboardOpen, isMobile, language, useTranslations } = useAppState();
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 1);
  }, []);

  const handleChange = (value) => {
    let sanitizedValue;
    sanitizedValue = sanitizeInput(value, 'text');
    setUserData(sanitizedValue);
  };

  const checkAndSave = (field) => {
    const sanitizedValue = userData.trim();
    onSave(field, sanitizedValue);
  };

  // Function to handle input focus
  const handleInputFocus = (index) => {
    if (isMobile) {
      setIsKeyboardOpen(true);
      if (inputRefs.current[index]) {
        inputRefs.current[index].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
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
          <button className="x-btn" onClick={() => onClose(field)}></button>
          <div className="modal-header">
            <h2 className="title">{title}</h2>
            <div className="modal-line"></div>
          </div>
          <p className="value-type">{text}</p>

          <textarea
            className="input-textarea"
            maxLength="300"
            value={userData}
            ref={(el) => (inputRefs.current[0] = el)}
            onFocus={() => handleInputFocus(0)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange(e.target.value)}
          />

          <div
            className="character-count"
            style={{
              fontSize: '12px',
              color: userData.length >= 300 ? '#ff4444' : userData.length > 280 ? '#ff8800' : '#666',
              marginTop: '5px',
            }}
          >
            {userData.length} / 300 characters
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="modal-buttons">
            <button className="save-modal button" onClick={() => checkAndSave(field)}>
              {buttonText}
            </button>
            <button className="button onlyborder" onClick={() => onClose(field)}>
              {translate('cancel', language)}
            </button>
          </div>
        </div>
        <div className="darkoverlay" onClick={() => onClose(field)}></div>
      </div>
    </>
  );
}

export default ModalAboutMe;
