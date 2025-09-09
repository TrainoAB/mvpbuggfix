import React from 'react';
import "../components/SelectItem.css";

const SelectItem = ({ label, setSelect }) => {
  return (
    <label className='container'>
      {label}
      <input type="checkbox" onClick={() => setSelect(preVal => !preVal)}/>
      <span className="checkmark"></span>
    </label>
  );
};

export default SelectItem;
