import React, { useEffect, useState } from 'react';
import Picker from 'react-mobile-picker';
import './PickerComponent.css';

const generateTimeArray = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    const formattedHour = hour.toString().padStart(2, '0');
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedMinute = minute.toString().padStart(2, '0');
      times.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return times;
};

const timeOptions = generateTimeArray();

const selections = {
  initialTime: timeOptions,
  endTime: timeOptions,
};

export const PickerComponent = ({
  closeTimeModal,
  startTime,
  setStartTime,
  stopTime,
  setStopTime,
  addMoreTime,
}) => {
  const [pickerValue, setPickerValue] = useState({
    initialTime: startTime,
    endTime: stopTime,
  });


  const handleAddMoreTime = () => {
    setStartTime(pickerValue.initialTime);
    setStopTime(pickerValue.endTime);
    addMoreTime(pickerValue.initialTime, pickerValue.endTime);

  };

  const handleSaveTime = () => {
    setStartTime(pickerValue.initialTime);
    setStopTime(pickerValue.endTime);
    closeTimeModal();
  };

  return (
    <div className="picker-wrapper">
      <div className="modal-overlay"></div>
      <div className="modal-content">
        <Picker
          value={pickerValue}
          onChange={setPickerValue}
          className="picker"
          wheel="natural"
        >
          <Picker.Column key="initialTime" name="initialTime" className="picker-column">
            {selections.initialTime.map((option) => (
              <Picker.Item
                key={option}
                value={option}
                className={`picker-item ${option === pickerValue.initialTime ? 'selected' : ''}`}
              >
                {option}
              </Picker.Item>
            ))}
          </Picker.Column>
          <Picker.Column key="endTime" name="endTime" className="picker-column">
            {selections.endTime.map((option) => (
              <Picker.Item
                key={option}
                value={option}
                className={`picker-item ${option === pickerValue.endTime ? 'selected' : ''}`}
              >
                {option}
              </Picker.Item>
            ))}
          </Picker.Column>
        </Picker>
        <div className="time-button-container">
          <button className='time-add-button' onClick={handleAddMoreTime}></button>
          <button className="time-cancel-button" onClick={closeTimeModal}></button>
        </div>
        {/* <button onClick={handleSaveTime}>Save time</button> */}
      </div>
    </div>
  );
};

export default PickerComponent;
