import React from 'react';
import "./RemoveTimesButton.css"

const RemoveTimesButton = ({ setRemoveTimes, title }) => {
  return (
    <button
      className='remove-times-button'
      onClick={() => setRemoveTimes((preVal) => !preVal)}
    >
      {title}
    </button>
  );
};

export default RemoveTimesButton;
