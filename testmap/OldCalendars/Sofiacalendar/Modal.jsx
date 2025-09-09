import React, { useState, useEffect } from 'react';
import EditModal from './EditModal';
import '../components/Modal.css';

export default function Modal({
  openOtherModal,
  setOpenOtherModal,
  setOpenModal,
  editedDaysInRange,
  dayClicked,
  modalData,
  editedDates,
  handleOnSave,
  handleOnSaveManyDays,
  setSingleTrainingList,
  weekday,
}) {
  const [singleDay, setSingleDay] = useState();

  // Omvandla dayClicked till ett Date objekt om det inte redan är det, med fallback för undefined eller null
  let validDate;
  if (dayClicked) {
    if (dayClicked instanceof Date) {
      validDate = dayClicked;
    } else {
      validDate = new Date(dayClicked);
      if (isNaN(validDate.getTime())) {
        // Hantera fallet där dayClicked inte kan omvandlas till ett giltigt datum
        validDate = new Date(); // fallback till dagens datum eller annan logik
      }
    }
  } else {
    validDate = new Date(); // fallback till dagens datum eller annan logik
  }

  const onClickAlternative = (button) => {
    setOpenOtherModal(true);
    if (button === 'single') {
      setSingleDay(true);
    } else {
      setSingleDay(false);
    }
  };

  if (openOtherModal) {
    return (
      <EditModal
        editedDaysInRange={editedDaysInRange}
        setOpenOtherModal={setOpenOtherModal}
        setOpenModal={setOpenModal}
        dayClicked={validDate}
        singleDay={singleDay}
        weekday={weekday}
        modalData={modalData}
        handleOnSave={handleOnSave}
        handleOnSaveManyDays={handleOnSaveManyDays}
        editedDates={editedDates}
        setSingleTrainingList={setSingleTrainingList}
      />
    );
  }

  return (
    <>
      <div className="modalBackground">
        <div className="modalContainer small">
          <div className="modal-header">
            <button className="close-button" onClick={() => setOpenModal(false)}></button>
            <h1 className="header-text">Välj ett alternativ</h1>
            <div className="modal-line"></div>
          </div>
          <div className="alternative-div">
            <button className="edit-button onlyborder button" onClick={() => onClickAlternative('single')}>
              Ändra {weekday} {validDate.getDate()} {'/'} {validDate.getMonth() + 1}
            </button>

            {modalData.startDate && (
              <button className="edit-button onlyborder button" onClick={() => onClickAlternative('multi')}>
                Ändra alla {weekday + 'ar'} <br></br>
                {modalData.startDate} {' - '} {modalData.endDate}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
