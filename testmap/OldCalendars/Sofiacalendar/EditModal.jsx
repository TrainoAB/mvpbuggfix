import React, { useState, useEffect } from 'react';
import '../components/Modal.css';
import RangeSlider from '../../app/components/RangeSlider';
import ChooseTraining from './ChooseTraining';
import { isTimeOverlapping } from '../old-schedule/utilities';
import PickerComponent from '../old-schedule/PickerComponent/PickerComponent';

const EditModal = ({
  setOpenOtherModal,
  setOpenModal,
  dayClicked,
  setSingleTrainingList,
  singleDay,
  weekday,
  handleOnSaveManyDays,
  modalData,
  editedDates,
  handleOnSave,
  editedDaysInRange,
}) => {
  const [rangeValue, setRangeValue] = useState(0);
  const [selectedTrainings, setSelectedTrainings] = useState([]);
  const [timeAvailable, setTimeAvailable] = useState([]);
  const [startTime, setStartTime] = useState('00:00');
  const [stopTime, setStopTime] = useState('00:00');
  const [multiDates, setMultiDates] = useState([]);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const openTimeModal = () => setIsTimeModalOpen(true);
  const closeTimeModal = () => setIsTimeModalOpen(false);

  useEffect(() => {
    if (modalData) {
      setRangeValue(modalData.pause ?? 0);
      if (editedDates && editedDates.length > 0) {
        const lastEditedDate = editedDates[editedDates.length - 1];
        setSelectedTrainings(lastEditedDate.selectedTrainings ?? []);
        setTimeAvailable(lastEditedDate.timeAvailable ?? []);
      } else if (editedDaysInRange && editedDaysInRange.length > 0) {
        const lastEditedDates = editedDaysInRange[editedDaysInRange.length - 1];

        setSelectedTrainings(lastEditedDates.selectedTrainings ?? []);
        setTimeAvailable(lastEditedDates.timeAvailable ?? []);
      } else {
        setSelectedTrainings(modalData.selectedTrainings ?? []);
        setTimeAvailable(modalData.timeAvailable ?? []);
      }
    }
  }, [modalData, editedDates, dayClicked, singleDay]);

  const onClickClose = () => {
    setOpenOtherModal(false);
    setOpenModal(false);
  };

  const addMoreTime = (startTime, stopTime) => {
    const newStartTime = new Date(`1970-01-01T${startTime}:00`);
    const newStopTime = new Date(`1970-01-01T${stopTime}:00`);

    if (newStartTime >= newStopTime) {
      alert('Starttiden måste vara tidigare än sluttiden');
      return;
    }

    if (isTimeOverlapping(newStartTime, newStopTime, timeAvailable)) {
      alert('Tiden överlappar med en befintlig tid');
      return;
    }

    const timeObject = { startTime, stopTime };
    setTimeAvailable((prevTimeAvailable) => [...prevTimeAvailable, timeObject]);
  };

  const handleRemoveTime = (index) => {
    setTimeAvailable((prevTimeAvailable) => prevTimeAvailable.filter((_, i) => i !== index));
  };

  const saveAndReturn = () => {
    const newObj = {
      selectedTrainings: selectedTrainings,
      timeAvailable: timeAvailable,
      pause: rangeValue,
      date: dayClicked,
    };

    if (singleDay) {
      handleOnSave(timeAvailable, dayClicked, selectedTrainings);
      setSingleTrainingList((preArr) => {
        const updatedArr = preArr.filter((item) => item.date.getTime() !== dayClicked.getTime());
        return [...updatedArr, newObj];
      });
    } else {
      handleOnSaveManyDays(timeAvailable, dayClicked, selectedTrainings);
    }

    setOpenOtherModal(false);
    setOpenModal(false);
  };

  return (
    <div className="modalBackground">
      <div className="modalContainer">
        <div className="modal-header">
          <button className="close-button" onClick={onClickClose}>
            X
          </button>
          {singleDay ? (
            <h1 className="header-text">
              {weekday} {dayClicked.getDate()} {'/'} {dayClicked.getMonth() + 1}
            </h1>
          ) : (
            <>
              <h1>
                {weekday}
                {'ar'}{' '}
              </h1>
              <p className="modal-header-date">
                {modalData.startDate} {' - '} {modalData.endDate}
              </p>
            </>
          )}
          <div className="modal-line"></div>
        </div>

        <div className="modal-body">
          <div className="training-div">
            <ChooseTraining selectedTrainings={selectedTrainings} setSelectedTrainings={setSelectedTrainings} />
            <div className="modal-line"></div>
          </div>

          <div>
            <div className="added-time-text">Tillagda tider:</div>
            {timeAvailable.length > 0 && (
              <div className="time-list">
                {timeAvailable.map((time, index) => (
                  <div className="time-item" key={index}>
                    <p>
                      {time.startTime} - {time.stopTime}
                    </p>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveTime(index, dayClicked.getDate(), time.startTime)}
                    ></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={openTimeModal} className="open-modal-button">
              00:00
            </button>
            {isTimeModalOpen && (
              <PickerComponent
                closeTimeModal={closeTimeModal}
                startTime={startTime}
                setStartTime={setStartTime}
                stopTime={stopTime}
                setStopTime={setStopTime}
                addMoreTime={addMoreTime}
              />
            )}

            <div className="modal-line-time"></div>
          </div>

          <div className="pause-div">
            <RangeSlider min={0} setRangeValue={setRangeValue} max={60} value={rangeValue} sliderHeading="Paus" />
          </div>
        </div>
        <div className="edit-modal-footer">
          <button className="button" onClick={saveAndReturn}>
            Spara
          </button>
          <button onClick={onClickClose} className="button">
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
