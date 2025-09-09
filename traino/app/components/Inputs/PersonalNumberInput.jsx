import React from 'react';

const PersonalNumberInput = React.forwardRef(
  ({ id, name, value, onChange, onBlur, placeholder, className, isValid }, ref) => {
    const handleChange = (e) => {
      let input = e.target.value.replace(/\D/g, ''); // Ta bort allt utom siffror

      // Om 8 eller fler siffror, lägg till bindestreck efter 8 siffror
      if (input.length > 8) {
        input = input.slice(0, 8) + '-' + input.slice(8, 12); // max 12 siffror totalt
      }

      // Anropa onChange med ett fejk-event med det formaterade värdet
      onChange({
        ...e,
        target: {
          ...e.target,
          value: input,
          name: name, // <-- this line is critical
        },
      });
    };

    return (
      <div className="input-group">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          ref={ref}
          className={isValid === true ? 'valid' : isValid === false ? 'invalid' : ''}
        />
        {isValid === true && <span className="input-icon valid">✔️</span>}
        {isValid === false && <span className="input-icon invalid">❌</span>}
      </div>
    );
  },
);

export default PersonalNumberInput;
