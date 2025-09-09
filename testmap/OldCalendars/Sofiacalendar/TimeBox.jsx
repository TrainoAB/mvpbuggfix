import React from 'react';
import './TimeBox.css';

const TimeBox = ({ time }) => {
  return (
    <div className={'booked timeBox green'}>
      <p className="time">
        {time}
      </p>
    </div>
  );
};

export default TimeBox;
