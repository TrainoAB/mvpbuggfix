
import React from 'react';

const GenderSelection = ({ selectedGender, handleGenderChange, translate, language }) => {
  return (
    <div className="gender-selection">
      <input
        type="radio"
        id="male"
        name="gender"
        value="male"
        checked={selectedGender === 'male'}
        onChange={() => handleGenderChange('male')}
        hidden
      />
      <label
        htmlFor="male"
        className={`gender-label ${selectedGender === 'male' ? 'active' : ''}`}
        onClick={() => handleGenderChange('male')}
      >
        {translate('male', language)}
      </label>
      <input
        type="radio"
        id="female"
        name="gender"
        value="female"
        checked={selectedGender === 'female'}
        onChange={() => handleGenderChange('female')}
        hidden
      />
      <label
        htmlFor="female"
        className={`gender-label ${selectedGender === 'female' ? 'active' : ''}`}
        onClick={() => handleGenderChange('female')}
      >
        {translate('female', language)}
      </label>
    </div>
  );
};

export default GenderSelection;