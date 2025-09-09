import React, { useState } from 'react';
import HoverSelectPillButton from './HoverSelectPillButton';
import ModalShowConfirmation from './ModalShowConfirmation';
import './ModalNoteAboutCustomer.css';
import { set } from 'date-fns';

const ModalNoteAboutCustomer = ({ setIsOpen, onSave }) => {
  const [note, setNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSave = () => {
    onSave(note);
    setNote('');
    // setIsOpen(false);
    setShowConfirmation(true);
  };

  return (

    <>
      <div className="darkBG" onClick={() => setIsOpen(false)} />
      <div className="centered">
        {!showConfirmation ? (
          <div className="modal">
            <div className="modal-content">
              <div className="modalHeader">
                <h4 className="heading">New Note</h4>
                <div className="closeWindowIcon" onClick={() => setIsOpen(false)}>
                  ✖
                </div>
              </div>
              <div className="modalTextContent">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write your note here..."
                />
              </div>
              <div className="modalActions">
                <div className="actionsContainer">
                  <HoverSelectPillButton
                    onClick={handleSave}
                    text="Publish"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (<ModalShowConfirmation onClose={() => {
          setShowConfirmation(false);
          setIsOpen(false);
        }}
          title="Note published"
          text="Your note has been published" />)
        }
      </div>
    </>
  );
};

  export default ModalNoteAboutCustomer;