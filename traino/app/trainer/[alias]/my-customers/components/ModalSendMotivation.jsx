import React, { useState, useRef, useEffect } from 'react';
import HoverSelectPillButton from './HoverSelectPillButton';
import ModalShowConfirmation from './ModalShowConfirmation';
import './ModalSendMotivation.css';

const ModalSendMotivation = ({ setIsOpen, title, placeholderText, suggestions }) => {
  const [note, setNote] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const textareaRef = useRef(null);

  const handleSend = () => {
    console.log('Inmatad motivering:', note);
    setShowConfirmation(true); // Show confirmation modal
  };

  const handleSuggestionClick = (suggestion) => {
    setNote(prevNote => prevNote + ' ' + suggestion);
    setShowSuggestions(false);
    textareaRef.current.focus();
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    setShowSuggestions(false);
  };

  const handleNoSuggestionClick = () => {
    setShowSuggestions(false);
    textareaRef.current.focus();
  };

  useEffect(() => {
    textareaRef.current.focus();
  }, []);

  return (
    <>
      <div className="darkBG" onClick={() => setIsOpen(false)} />
      <div className="centered">
        {!showConfirmation ? (
          <div className="modal">
            <div className="modal-content">
              <div className="modalHeader">
                <h4 className="heading">{title}</h4>
                <div className="closeWindowIcon" onClick={() => setIsOpen(false)}>
                  ✖
                </div>
              </div>
              <div className="modalTextContent">
                {showSuggestions && (
                  <div className="suggestions">
                    <div
                      className="suggestion no-suggestion"
                      onClick={handleNoSuggestionClick}
                    >
                      "Write your own text..."
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={handleNoteChange}
                  placeholder={placeholderText}
                />
              </div>
              <div className="modalActions">
                <div className="actionsContainer">
                  <HoverSelectPillButton 
                    onClick={handleSend}
                    text="Send"  
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ModalShowConfirmation onClose={() => {
            setShowConfirmation(false);
            setIsOpen(false);
          }} 
              title="Motivation Sent"
              text="Your motivation has been sent to the customer."
          />
        )}
      </div>
    </>
  );
};

export default ModalSendMotivation;
