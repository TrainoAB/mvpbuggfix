import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import {
  isValidEmail,
  sanitizeInput,
  ifAliasExist,
  baseUrl,
  sessionObject,
  ifEmailExist,
} from '@/app/functions/functions';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';

function Modal({ onClose, onSave, buttonText, field, title, text, data }) {
  const [userData, setUserData] = useState(data);
  const [errorMessage, setErrorMessage] = useState('');
  const { sessionObject, baseUrl, isKeyboardOpen, setIsKeyboardOpen, isMobile, language, useTranslations } =
    useAppState();
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 1);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue;

    switch (field) {
      case 'mobilephone':
        sanitizedValue = sanitizeInput(value, 'phone');
        break;
      case 'email':
        sanitizedValue = sanitizeInput(value, 'email');
        break;
      case 'alias':
        sanitizedValue = sanitizeInput(value, 'alias');
        break;

      default:
        sanitizedValue = sanitizeInput(value, 'text');
    }

    setUserData(sanitizedValue);
  };

  const sanitizeAndValidateInput = async (input, field) => {
    if (input === undefined) {
      setErrorMessage(translate('field_required', language));
      return null;
    } else {
      const sanitizedValue = input.trim();

      switch (field) {
        case 'email':
          if (!isValidEmail(sanitizedValue)) {
            setErrorMessage(translate('invalid_email', language));
            return null;
          }
          if (await ifEmailExist(sanitizedValue)) {
            setErrorMessage(translate('email_exists', language));
            return null;
          }
          break;
        case 'mobilephone':
          if (!isValidPhoneNumber(sanitizedValue) || sanitizedValue === undefined) {
            setErrorMessage(translate('invalid_phone_format', language));
            return null;
          }
          break;
        case 'alias':
          try {
            const aliasExists = await ifAliasExist(sanitizedValue);
            if (aliasExists) {
              setErrorMessage(translate('alias_exists', language));
              return null;
            }
          } catch (error) {
            console.error('Error:', error);
            setErrorMessage(translate('alias_validation_error', language));
            return null;
          }
          break;
        default:
          break;
      }

      return sanitizedValue;
    }
  };

  const checkAndSave = async (field) => {
    const sanitizedValue = await sanitizeAndValidateInput(userData, field);
    if (sanitizedValue !== null) {
      onSave(field, sanitizedValue);
    }
  };

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

          {field == 'mobilephone' && (
            <PhoneInput
              placeholder={translate('enter_phone', language)}
              value={userData}
              onChange={setUserData}
              defaultCountry="SE"
            />
          )}
          {(field === 'alias' || field === 'email') && (
            <>
              {data && <span className="value-type">{text}</span>}
              <input
                className="input"
                type="text"
                value={userData}
                ref={(el) => (inputRefs.current[0] = el)}
                onFocus={() => handleInputFocus(0)}
                onBlur={handleInputBlur}
                onChange={(e) => {
                  e.target.name = field;
                  handleChange(e);
                }}
              />
            </>
          )}

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="modal-buttons">
            <button className="save-modal button" onClick={async () => await checkAndSave(field)}>
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

export default Modal;
