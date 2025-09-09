import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getCategories, getCookie } from '@/app/functions/functions';
import AddSportProposal from '../../../components/AddSportProposal';
import DropdownMenu from '@/app/components/DropdownMenu';

function ModalSport({ onClose, onSave, onDelete, field, title, text, data, dropdownText, buttonText }) {
  const { DEBUG, traincategories, setTraincategories, sessionObject, baseUrl, language, useTranslations } =
    useAppState();
  const [fetchCategories, setFetchCategories] = useState(false);
  const [userSport, setUserSport] = useState([]);
  const [addedSports, setAddedSports] = useState([]);
  const [deletedSports, setDeletedSports] = useState([]);
  const userId = useRef(null);
  const { translate } = useTranslations('editaccount', language);
  const { translate: translateGlobal } = useTranslations('global', language);
  const selectInputRef = useRef();

  useEffect(() => {
    // Function to fetch user_id from cookie
    const storedUserId = getCookie('user_id');
    if (storedUserId) {
      userId.current = parseInt(storedUserId); // Assuming user_id is stored as integer
    } else {
      userId.current = null; // Set to null if user_id is not found in cookie
    }

    DEBUG && console.log('User id:', userId.current);
    DEBUG && console.log('Current language:', language);
  }, [DEBUG, language]);

  useEffect(() => {
    if (!fetchCategories) {
      if (traincategories.length === 0) {
        getCategories(setTraincategories);
        setFetchCategories(true);
      }
    }
  }, [fetchCategories, traincategories.length, setTraincategories]);

  useEffect(() => {
    if (traincategories.length > 0 && data) {
      let dataArray = data;

      if (typeof data === 'string') {
        dataArray = data.split(',').map((item) => item.trim());
      }

      if (Array.isArray(dataArray)) {
        const mappedSports = dataArray
          .map((sport) => {
            if (typeof sport === 'string') {
              const sportObj = traincategories.find((s) => s.category_name === sport);
              return sportObj ? sportObj : null;
            } else if (typeof sport === 'object' && sport !== null && 'category_name' in sport) {
              return sport;
            } else {
              return null;
            }
          })
          .filter(Boolean);
        setUserSport(mappedSports);
      }
    }
  }, [traincategories, data]);

  const handleAdd = (sportName) => {
    const sport = traincategories.find((s) => s.category_name === sportName);
    if (sport && !userSport.some((userSport) => userSport.category_name === sport.category_name)) {
      // Mark newly added sports with a flag
      const sportWithFlag = { ...sport, isNewlyAdded: true };
      setUserSport([...userSport, sportWithFlag]);
      setAddedSports([...addedSports, sport]);
    }
  };

  const handleRemove = (id, isNewlyAdded = false) => {
    const updatedUserSport = userSport.filter((item) => item.id !== id);
    setUserSport(updatedUserSport);

    if (isNewlyAdded) {
      // Remove from addedSports if it was newly added
      setAddedSports(addedSports.filter((sport) => sport.id !== id));
    } else {
      // Add to deletedSports if it was an existing sport
      setDeletedSports((deletedSports) => [...deletedSports, { id: id, user_id: userId.current }]);
    }
  };

  const checkAndSave = (field) => {
    if (addedSports.length > 0) {
      onSave(field, userSport, addedSports);
    }

    if (deletedSports.length > 0) {
      onDelete(deletedSports, userSport);
    }
  };

  const handleProposalSubmit = (proposal) => {
    // Hantera förslag på nya sporter här.

    DEBUG && console.log('Förslag på ny sport:', proposal);
  };

  return (
    <div>
      <div className="modal">
        <button className="x-btn" onClick={() => onClose(field)}></button>
        <h2 className="title">{title}</h2>
        <p className="info-text">{text}</p>
        <div className="modal-line"></div>

        <div className="input-option-container">
          <DropdownMenu sportsCategories={traincategories} handleAddSport={handleAdd} selectInputRef={selectInputRef} />
        </div>

        {Array.isArray(userSport) && userSport.length > 0 && (
          <div className="sport-list">
            {userSport.map((item, index) => (
              <div key={index} className="modal-list-item">
                <span className="data-item">{translateGlobal(`cat_${item.category_link}`, language)}</span>
                {/* Always show remove button */}
                <button className="remove-btn" onClick={() => handleRemove(item.id)}></button>
              </div>
            ))}
          </div>
        )}

        {/* Lägg till förslag på ny sport */}

        <AddSportProposal onProposalSubmit={handleProposalSubmit} />

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
  );
}

export default ModalSport;
