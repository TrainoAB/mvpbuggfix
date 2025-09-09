'use client';

import { useEffect, useRef } from 'react';
import './CalendarModal.css';

function Modal({ openModal, closeModal, children }) {
  const ref = useRef();

  useEffect(() => {
    if (openModal) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [openModal]);

  function handleModalClick(e) {
    // Close the modal if the user clicks outside of it
    if (e.target === ref.current) {
      closeModal();
    }
  }

  return (
    <dialog ref={ref} onCancel={closeModal} onClick={handleModalClick}>
      {children}
    </dialog>
  );
}

export default Modal;
