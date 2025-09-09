import React from 'react';
import ProfileTrainer from '@/app/components/Profile/ProfileTrainer';
import './UserInfoModal.css';

export default function UserInfoModal({ isOpen, onClose, alias }) {
  if (!isOpen) return null;

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-button"></button>
        <ProfileTrainer alias={alias} nav={false} />
      </div>
    </div>
  );
}
