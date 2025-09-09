import './ScheduleProduct.css';

const ConfirmationModal = ({ type, onClose }) => {
  return (
    <>
      <div className="modal" style={{ textAlign: 'center', maxWidth: '25rem' }}>
        <div className="modal-content2">
          {type === 'success' ? (
            <>
              <div className="icon-check"></div>
              <h1>Sparat!</h1>
              <p>Du har lagt in passen i kalendern!</p>
            </>
          ) : (
            <>
              <div className="icon-alert"></div>
              <h1>Något gick fel</h1>
              <p>Passet blev inte sparat, någonting i processen orsakade ett fel, försök igen.</p>
            </>
          )}
          <button className="button" onClick={() => onClose('')}>
            OK
          </button>
        </div>
      </div>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
};

export default ConfirmationModal;
