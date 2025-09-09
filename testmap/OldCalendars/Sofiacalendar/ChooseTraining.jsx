import React, { useEffect } from 'react';
import TrainingCard from '../../app/components/TrainingCard';
import { trainingsData } from '../old-schedule/data';
import './ChooseTraining.css';
import './FormSectionHeader.css';

export default function ChooseTraining({ selectedTrainings, setSelectedTrainings }) {
  const toggleOutline = (training) => {
    setSelectedTrainings(
      (prevSelectedTrainings) =>
        prevSelectedTrainings.some((t) => t.id === training.id)
          ? prevSelectedTrainings.filter((t) => t.id !== training.id) //id already selected
          : [...prevSelectedTrainings, training], //id not selected
    );
  };

  useEffect(() => {}, []);

  return (
    <>
      <h4 className="form-heading date" style={{ fontSize: '16px' }}>
        Välj pass
      </h4>
      <div className="cards">
        {trainingsData.map((training) => (
          <TrainingCard
            key={training.id}
            training={training}
            isOutlined={selectedTrainings.some((t) => t.id === training.id)}
            toggleOutline={toggleOutline}
          />
        ))}
      </div>
    </>
  );
}
