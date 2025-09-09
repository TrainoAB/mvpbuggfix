import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { sanitizeInput } from '@/app/functions/functions';
import AddressAutoComplete from '@/app/components/Inputs/AddressAutoComplete';

function ModalPlace({ onClose, onSave, field, title, text, data, buttonText }) {
  const [userData, setUserData] = useState({
    address: data || '',
    latitude: '',
    longitude: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const { DEBUG, isKeyboardOpen, setIsKeyboardOpen, isMobile, language, useTranslations } = useAppState();
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 2);
  }, []);

  const handleChange = (fieldName, value) => {
    let sanitizedValue;
    sanitizedValue = sanitizeInput(value, 'address');
    setUserData({ ...userData, [fieldName]: sanitizedValue });
  };

  const handleAddressSelect = (suggestion) => {
    const newFormData = userData;
    newFormData.address = `${suggestion.name} ${suggestion.streetNumber}, ${
      suggestion.city ? suggestion.city : suggestion.municipality
    }, ${suggestion.country}`;
    newFormData.latitude = suggestion.latitude;
    newFormData.longitude = suggestion.longitude;

    DEBUG && console.log(newFormData);

    setUserData(newFormData);
  };

  const checkAndSave = (field) => {
    const sanitizedAddress = userData.address.trim();
    const userLong = userData.longitude;
    const userLat = userData.latitude;

    if (sanitizedAddress.length <= 0) {
      setErrorMessage(`${translate('workplace_required', language)}`);
    } else {
      onSave(field, {
        user_address: sanitizedAddress,
        longitude: userLong,
        latitude: userLat,
      });
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

  return (
    <>
      <div>
        <div className="modal">
          <div className="modal-header">
            <button className="x-btn" onClick={() => onClose(field)}></button>
            <h2 className="title">{title}</h2>
            <p className="info-text">{text}</p>
            <div className="modal-line"></div>
          </div>
          <span className="value-type">Adress</span>
          <AddressAutoComplete onSelect={handleAddressSelect} />

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

export default ModalPlace;
