import React, { useEffect, useState, useCallback } from 'react';
import SelectItem from './SelectItem';
import '../components/FormSectionHeader.css';
import '../components/Days.css';

const Days = ({ heading, subHeading, setChosenDays }) => {
  const week = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];
  const [checkedDays, setCheckedDays] = useState(
    week.reduce((acc, day) => {
      acc[day] = false;
      return acc;
    }, {}),
  );

  const handleCheckboxChange = useCallback((day) => {
    setCheckedDays((prevState) => {
      const newState = { ...prevState, [day]: !prevState[day] };
      return newState;
    });
  }, []);

  useEffect(() => {
    const updatedChosenDays = Object.keys(checkedDays).filter((key) => checkedDays[key]);
    setChosenDays(updatedChosenDays);
  }, [checkedDays, setChosenDays]);

  return (
    <div className="day-checkbox-wrapper">
      <h4 className="form-heading dayHeading">{heading}</h4>
      <h6 className="form-subheading select">{subHeading}</h6>
      <div className="day-checkboxes">
        {week.map((day, index) => (
          <SelectItem
            key={index}
            label={day}
            selectVal={checkedDays[day]}
            setSelect={() => handleCheckboxChange(day)}
          />
        ))}
      </div>
    </div>
  );
};

export default Days;
