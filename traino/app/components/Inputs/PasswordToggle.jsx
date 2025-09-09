import React from 'react';
import { playSound } from '@/app/components/PlaySound';

import './PasswordToggle.css';
const PasswordToggle = ({ showPassword, togglePasswordVis }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        playSound('tickclick', '0.5');
        togglePasswordVis(e);
      }}
      className={showPassword ? 'password-toggle-btn-open' : 'password-toggle-btn-closed'}
    ></button>
  );
};

export default PasswordToggle;
