import React from 'react';
import './ChooseTraining.css';
import './TrainingPeriodInputs.css';
export default function TrainingPeriodInputs({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) {
  return (
    <>
      <h4 className="form-heading date">Datum</h4>
      <div className="training-input-row">
        <label htmlFor="start">Startdatum</label>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="training-period-input"
          id="start"
        />
      </div>
      <div className="training-input-row">
        <label htmlFor="end">Slutdatum</label>
        <input
          type="date"
          value={endDate}
          className="training-period-input"
          id="end"
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
    </>
  );
}
