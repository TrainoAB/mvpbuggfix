import React from 'react';

const AliasInput = React.forwardRef(({ id, name, value, onChange, onBlur, placeholder, className, isValid, aliasExistsMessage }, ref) => {
  return (
    <div className={`input-group`}>
      <label htmlFor={id}>{placeholder}</label>
      <div className="input-with-icon">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          ref={ref}
          className={value === '' ? '' : isValid === true ? 'valid' : 'invalid'}
        />
        {value !== '' && isValid === true && <span className="input-icon valid">✔️</span>}
        {value !== '' && isValid === false && <span className="input-icon invalid">❌</span>}
      </div>
      {aliasExistsMessage && <p className="error-message">{aliasExistsMessage}</p>}
    </div>
  );
});

export default AliasInput;