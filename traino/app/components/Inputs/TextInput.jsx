import React, { forwardRef } from 'react';

const TextInput = forwardRef(({ id, name, value, onChange, placeholder, className, onBlur, onFocus }, ref) => {
  return (
    <div className="input-group">
      <label htmlFor={id}>{placeholder}</label>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        ref={ref}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </div>
  );
});

export default TextInput;
