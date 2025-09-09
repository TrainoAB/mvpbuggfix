import React, { useEffect, useState } from 'react';

const EmailInput = React.forwardRef((props, ref) => {
  const {
    id,
    name,
    value,
    onChange,
    placeholder,
    className,
    emailExistsMessage,
    isValidEmail,
    isLoading,
    style,
    iconClassName,
  } = props;
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (value === '') {
      setShowValidation(false);
    } else {
      setShowValidation(true);
    }
  }, [value]);

  const inputClassName = `${className} ${
    showValidation && (isValidEmail === true ? 'valid' : isValidEmail === false ? 'invalid' : '')
  }`;

  return (
    <div className={`email-input-container ${className}`} style={style}>
      <label htmlFor={id}>{placeholder}</label>
      <div id="email-container" className="input-with-icon">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClassName}
          ref={ref}
        />
        {isLoading && <span className={`${iconClassName} loading`}>🔄</span>}
        {!isLoading && showValidation && isValidEmail !== null && (
          <span className={`${iconClassName} ${isValidEmail === true ? 'valid' : 'invalid'}`}>
            {isValidEmail === true ? '✔️' : '❌'}
          </span>
        )}
      </div>
      {emailExistsMessage && <p className="error-message">{emailExistsMessage}</p>}
    </div>
  );
});

export default EmailInput;
