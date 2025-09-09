import React, { useState } from 'react';
import HoverSelectPillButton from './HoverSelectPillButton';
import './ModalAddChallenge.css';

const ModalAddChallenge = ({ setIsOpen, onSave }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSave = () => {
    const challenge = {
      title,
      text,
      endDate,
    };
    onSave(challenge);
    setTitle('');
    setText('');
    setEndDate('');
    setIsOpen(false);
  };

  return (
    <div id="modal-challenge">
      <div className="darkBG" onClick={() => setIsOpen(false)} />
      <div className="centered">
        <div className="modal">
          <div className="modal-content">
            <div className="modalHeader">
              <h4 className="heading">Ny utmaning</h4>
              <div className="closeWindowIcon" onClick={() => setIsOpen(false)}>
                ✖
              </div>
            </div>
            <div className="modalTextContent">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Rubrik..."
                className="inputField"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Beskrivning..."
                className="textareaField"
              />
              <label>Slutdatum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="inputField"
              />
            </div>
            <div className="modalActions">
                <HoverSelectPillButton
                  onClick={() => setIsOpen(false)}
                  text="Avbryt"
                />
                <HoverSelectPillButton
                  onClick={handleSave}
                  text="Skicka"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAddChallenge;