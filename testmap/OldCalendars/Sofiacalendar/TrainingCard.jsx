import React from 'react';
import './ChooseTraining.css';

export default function TrainingCard({ training, isOutlined, toggleOutline }) {
  const handleOnClick = () => {
    toggleOutline(training);
  };

  return (
    <div
      className={`training-card ${isOutlined ? 'outlined' : ''}`}
      onClick={handleOnClick}
    >
      <div className='card-content'>
        <span className="training-icon">
          <span className="icon"></span>
        </span>
        <h4 className="small-heading">{training.name}</h4>
      </div>
    </div>
  );
}
