import React from 'react';
import '../components/SavedPopUp.css';
const SavedPopUp = ({ popUp }) => {
  let cName = '';
  popUp === false ? (cName = 'popup') : (cName = 'displayPopup');

  return (
    <div className={cName}>
      <span className="popupcheck" alt="savedCheck"></span>
    </div>
  );
};

export default SavedPopUp;
