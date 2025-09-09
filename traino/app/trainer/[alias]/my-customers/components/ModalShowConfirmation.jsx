import './ModalShowConfirmation.css';

const ModalShowConfirmation = ({ onClose, title, text}) => {
  return ( 
    <div id="show-confirmation-modal" className="centered">
      <div className="modal">
        <div className="modal-content">
          <h4>{title}</h4>
          <p>{text}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ModalShowConfirmation;
