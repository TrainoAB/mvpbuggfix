import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import PasswordToggle from '../../../components/Inputs/PasswordToggle';
import { sanitizeInput } from '@/app/functions/functions';

function ModalPassword({ onClose, onSave, buttonText, title, text, field, error }) {
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    isKeyboardOpen,
    setIsKeyboardOpen,
    isMobile,
    // password,
    // setPassword,
    showPassword,
    setShowPassword,
    togglePasswordVis,
    language,
    useTranslations,
  } = useAppState();
  const { translate } = useTranslations('editaccount', language);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 3);
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const handleChange = (field, value) => {
    let sanitizedValue;

    switch (field) {
      case 'currentPassword':
        sanitizedValue = sanitizeInput(value, 'password');
        setCurrentPassword(sanitizedValue);
        break;
      case 'newPassword':
        sanitizedValue = sanitizeInput(value, 'password');
        setNewPassword(sanitizedValue);
        break;
      case 'confirmPassword':
        sanitizedValue = sanitizeInput(value, 'password');
        setConfirmPassword(sanitizedValue);
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    setErrorMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage(translate('all_fields_required', language));
    } else if (newPassword.length < 8) {
      setErrorMessage(translate('password_min_length', language));
    } else if (newPassword !== confirmPassword) {
      setErrorMessage(translate('password_mismatch', language));
    } else if (currentPassword == newPassword) {
      setErrorMessage(translate('password_same_as_old', language));
    } else {
      onSave({ currentPassword, newPassword });
    }
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

  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  return (
    <div>
      <div className="modal">
        <button className="x-btn" onClick={() => onClose(field)}></button>
        <div className="modal-header">
          <h2 className="title">{title}</h2>
          <div className="modal-line"></div>
        </div>

        <div className="input-group">
          <p className="value-type">{translate('current_password', language)}</p>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-password"
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

        <div className="input-group">
          <p className="value-type">{translate('new_password', language)}</p>
          <input
            type={showNewPassword ? 'text' : 'password'}
            className="input-password"
            placeholder={translate('new_password', language)}
            value={newPassword}
            ref={(el) => (inputRefs.current[1] = el)}
            onFocus={() => handleInputFocus(1)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            autoComplete="new-password"
          />
          {newPassword && (
            <PasswordToggle
              showPassword={showNewPassword}
              togglePasswordVis={() => setShowNewPassword(!showNewPassword)}
            />
          )}
        </div>
        <div className="input-group">
          <p className="value-type">{translate('confirm_password', language)}</p>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-password"
            placeholder={translate('confirm_password', language)}
            value={confirmPassword}
            ref={(el) => (inputRefs.current[2] = el)}
            onFocus={() => handleInputFocus(2)}
            onBlur={handleInputBlur}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            autoComplete="new-password"
          />
          {confirmPassword && (
            <PasswordToggle
              showPassword={showConfirmPassword}
              togglePasswordVis={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          )}
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="modal-buttons">
          <button className="save-modal button" onClick={handleSave}>
            {buttonText}
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

export default ModalPassword;
