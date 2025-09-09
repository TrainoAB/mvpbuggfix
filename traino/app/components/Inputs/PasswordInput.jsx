// app/components/Inputs/PasswordInput.jsx

import React, { forwardRef, useState } from 'react';
import PasswordToggle from '@/app/components/Inputs/PasswordToggle';
import '@/app/components/Inputs/Passwordinput.css';



const PasswordInput = forwardRef(
  ({ id, name, value, onChange, placeholder, className, showPassword, togglePasswordVis, validationMessage }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <div className="input-group password-trainee">
        <label htmlFor={id}>{placeholder}</label>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            ref={ref}
            autoComplete="new-password"
            className={`password-input password-trainer ${className} ${validationMessage ? 'error' : ''}`}
            onFocus={() => setIsFocused(true)}
            // onBlur={() => setIsFocused(false)}
          />
          <PasswordToggle
            showPassword={showPassword}
            togglePasswordVis={togglePasswordVis}
            className="password-toggle-icon"
          />
        </div>
        {/* {validationMessage && <p className="error-message">{validationMessage}</p>} */}
        
        <div id="passwordinput" className={isFocused ? 'expand' : 'collapse'}>
          {/* <div>
          Password requirements:
          </div> */}
          <ul className="password-requirements">
          {/* At least: */}
          <li>
            {value?.length >= 8 ? "✔️ " : "❌ "}- 8 characters</li>
          <li>{value?.match(/[A-Z]/) ? "✔️ " : "❌ "}- Uppercase letter</li>
          <li>{value?.match(/[a-z]/) ? "✔️ " : "❌ "}- Lowercase letter</li>
          <li>{value?.match(/[!@#$%^&*(),.?":{}|<>]/) ? "✔️ " : "❌ "}- Special character</li>
          <li>{value?.match(/[0-9]/) ? "✔️ " : "❌ "}- Number</li>
          </ul>
        </div>
      </div>
    );
  },
);

export default PasswordInput;
