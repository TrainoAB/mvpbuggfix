import React from 'react';
import './ChooseTraining.css';
import './RangeSlider.css'

export default function RangeSlider({
  sliderHeading,
  min,
  max,
  value,
  setRangeValue,
}) {
 const handleChange = (event) => {
   setRangeValue(Number(event.target.value)); // Omvandla värdet till ett tal
 };
  return (
    <>
      <div className="range-wrapper">
        <label htmlFor="range-slider" className="form-heading">
          {sliderHeading}
        </label>
        <div className="range-slider">
          <input
            type="range"
            id="range-slider"
            name="range-slider"
            min={min}
            max={max}
            value={value}
            step={5}
            onChange={handleChange}
          />
          <span>{value} min</span>
        </div>
      </div>
    </>
  );
}
