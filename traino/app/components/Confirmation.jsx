'use client';
import './Confirmation.css';
import { DEBUG } from '@/app/functions/functions';

const Confirmation = ({ onBack = null, onBackText = null, onClose, onCloseText, title, text = null }) => {
  DEBUG &&
    console.log(
      'Title: ',
      title,
      'Text: ',
      text,
      'onBack: ',
      onBack,
      'onClose: ',
      onClose,
      'onCloseText: ',
      onCloseText,
      'onBackText: ',
      onBackText,
    );

  /*   TODO: Fixa i trainer.page.jsx en bättre state till denna modal
const handleClose = () => { 
    onClose(null);
  }; */

  if (onClose === false) return null;

  return (
    <>
      <div id="confirmation">
        <div className="confirmation-modal">
          <>
            <div className="title-container">
              <span className="icon-check"></span>
              <h1>{title}</h1>
              {text !== null && <p>{text}</p>}
            </div>
            <br />
            {onBack !== null ? (
              <div className="buttons-container">
                <button onClick={onBack} className="button onlyborder">
                  {onBackText}
                </button>
                <button className="button" onClick={onClose}>
                  {onCloseText}
                </button>
              </div>
            ) : (
              <button className="button" onClick={onClose}>
                {onCloseText}
              </button>
            )}
          </>
        </div>
        <div className="darkoverlay" onClick={onClose}></div>
      </div>
    </>
  );
};

export default Confirmation;
