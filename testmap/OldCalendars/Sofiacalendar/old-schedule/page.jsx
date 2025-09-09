"use client";
import React, { useState } from "react";
import WeekCalendar from "../components/WeekCalendar";
import Modal from "../components/Modal";
import MonthCalendar from "../components/MonthCalendar";
import ChooseTraining from "../components/ChooseTraining";
import RangeSlider from "../components/RangeSlider";
import TrainingPeriodInputs from "../components/TrainingPeriodInputs";
import { schedualTrainingsInRange } from "./data";
import SavedPopUp from "../components/SavedPopUp";
import IconHeading from "../components/IconHeading";
import FormSectionHeader from "../components/FormSectionHeader";
import Days from "../../testmap/Sofiacalendar/Days";
import { isTimeOverlapping } from "./utilities";
import { PickerComponent } from "./PickerComponent/PickerComponent";
import RemoveTimesButton from "../components/RemoveTimesButton";
import { useAppState } from "@/app/hooks/useAppState";
import "./page.css";

export default function Schedule() {
    const { booked, setBooked } = useAppState();

    const [switchCalendar, setSwitchCalendar] = useState("");
    const [classNameBefore, setClassName] = useState("");
    const [otherClassNameBefore, setOtherClassName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [weekday, setWeekday] = useState("");

    const [startTime, setStartTime] = useState("00:00");
    const [stopTime, setStopTime] = useState("00:00");
    const [value, setRangeValue] = useState(0);

    const [dayClicked, setDayClicked] = useState(null);
    const [modalData, setModalData] = useState(null);

    const [openModal, setOpenModal] = useState(false);
    const [removeTimes, setRemoveTimes] = useState(false);
    const [openOtherModal, setOpenOtherModal] = useState(false);
    const [popUp, setPopUp] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const openTimeModal = () => setIsTimeModalOpen(true);
    const closeTimeModal = () => setIsTimeModalOpen(false);
    //all data in range, times, days and trainings
    const [selectedTrainings, setSelectedTrainings] = useState([]);
    const [timeAvailable, setTimeAvailable] = useState([]);
    const [chosenDays, setChosenDays] = useState([]);
    const [schedualTrainingData, setSchedualTrainingData] = useState([]);
    //edited data in range
    const [daysTrainingList, setDaysTrainingList] = useState([]);
    const [editedDaysInRange, setEditedDaysInRange] = useState([]);
    const [editedDates, setEditedDates] = useState([]);
    const [trainingList, setSingleTrainingList] = useState([]);

    const calculateDuration = (startTime, stopTime) => {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${stopTime}:00`);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minuter
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        if (hours <= 0) {
            return `${minutes} minuter`;
        } else {
            return `${hours} timmar ${minutes} minuter`;
        }
    };

    //Calendar view toggle onClick
    const toggleCalendar = () => {
        if (switchCalendar === "month") {
            setSwitchCalendar("week");
            if (classNameBefore === "") {
                setClassName("activeButton");
                setOtherClassName("");
            } else {
                setClassName("");
            }
        } else {
            setSwitchCalendar("month");
            if (otherClassNameBefore === "") {
                setOtherClassName("active");
                setClassName("");
            } else {
                setOtherClassName("");
            }
        }
    };

    const saveTraining = () => {
        schedualTrainingsInRange.pop();

        const filteredTrainings = schedualTrainingsInRange.filter(
            (schedualedTraining) => schedualedTraining !== null && schedualedTraining !== undefined
        );

        const newTrainingObj = {
            id: filteredTrainings.length, // Use length as new id
            startDate: startDate,
            days: chosenDays,
            endDate: endDate,
            pause: value,
            selectedTrainings: selectedTrainings,
            timeAvailable: timeAvailable,
            isBooked: booked,
        };
        schedualTrainingsInRange.push(newTrainingObj);
        console.log("data for all trainings in given range: ", schedualTrainingsInRange);
        setSchedualTrainingData(newTrainingObj);

        toggleCalendar();
    };

    const addMoreTime = (newStartTime, newStopTime) => {
        const start = new Date(`1970-01-01T${newStartTime}:00`);
        const end = new Date(`1970-01-01T${newStopTime}:00`);

        if (start >= end) {
            alert("Starttiden måste vara tidigare än sluttiden");
            return;
        }

        if (isTimeOverlapping(start, end, timeAvailable)) {
            alert("Tiden överlappar med en befintlig tid");
            return;
        }

        const timeObject = { startTime: newStartTime, stopTime: newStopTime };
        setTimeAvailable((prevTimeAvailable) => [...prevTimeAvailable, timeObject]);
    };

    const handleRemoveTime = (index) => {
        setTimeAvailable((prevTimeAvailable) => prevTimeAvailable.filter((_, i) => i !== index));
    };

    //optional, pop up
    const savedPopUp = () => {
        setPopUp(true);
        setTimeout(() => {
            setPopUp(false);
        }, 2000);
    };

    const handleOnSave = (times, date, selectedTraining) => {
        const training = {
            timeAvailable: times,
            date: date,
            selectedTrainings: selectedTraining,
        };
        savedPopUp();
        setSingleTrainingList((preVal) => [...preVal, training]);
    };

    const handleOnSaveManyDays = (times, date, selectedTraining) => {
        const training = {
            timeAvailable: times,
            date: date,
            selectedTrainings: selectedTraining,
        };
        savedPopUp();
        setDaysTrainingList((preVal) => [...preVal, training]);
    };

    const setDay = (day, inRange, weekday) => {
        setDayClicked(day);
        if (inRange) {
            setModalData(schedualTrainingData);
        } else {
            setModalData([]);
        }
        const setWeekdayString = (weekday) => {
            switch (weekday) {
                case 1:
                    setWeekday("Måndag");
                    break;
                case 2:
                    setWeekday("Tisdag");
                    break;
                case 3:
                    setWeekday("Onsdag");
                    break;
                case 4:
                    setWeekday("Torsdag");
                    break;
                case 5:
                    setWeekday("Fredag");
                    break;
                case 6:
                    setWeekday("Lördag");
                    break;
                case 0:
                    setWeekday("Söndag");
                    break;
                case "tor":
                    setWeekday("Torsdag");
                    break;
                default:
                    setWeekday(weekday + "dag");
                    break;
            }
        };
        setWeekdayString(weekday);
    };

    return (
        <div className="schedule">
            <div className="schedule-heading-container">
                <img src="../assets/icon-back.svg" alt="left-arrow" className="left-arrow" />
                <IconHeading
                    color="var(--maincolor)"
                    text="Schema produkt"
                    size="var(--big-size)"
                    padding="22px"
                    justify="center"
                />
            </div>
            <IconHeading
                color="var(--maincolor)"
                text="Träningspass"
                padding="22px"
                size="var(--heading-size)"
                smallPadding="5px"
                justify="center"
                border="3px solid  var(--maincolor)"
            />
            <FormSectionHeader
                info="info"
                heading="Datum och tid"
                subHeading="Möjlighet att välja flera olika datum och tider samtidigt"
            />
            <ChooseTraining selectedTrainings={selectedTrainings} setSelectedTrainings={setSelectedTrainings} />
            <Days
                heading="Vilka dagar vill du ha din träning på?"
                subHeading="Klicka i de dagar du är tillgänglig."
                setChosenDays={setChosenDays}
            />

            <span className="modal-time-text form-heading">Vilka tider är du tillgänglig?</span>
            <button onClick={openTimeModal} className="open-modal-button">
                00:00
            </button>
            {isTimeModalOpen && (
                <div className="modal overlay">
                    <div className="modal-content">
                        <span className="close-button" onClick={closeTimeModal}>
                            &times;
                        </span>
                        <PickerComponent
                            closeTimeModal={closeTimeModal}
                            startTime={startTime}
                            setStartTime={setStartTime}
                            stopTime={stopTime}
                            setStopTime={setStopTime}
                            addMoreTime={addMoreTime}
                        />
                    </div>
                </div>
            )}

            <div className="added-time-text">Tillagda tider:</div>
            {timeAvailable.length > 0 && (
                <div className="time-list">
                    {timeAvailable.map((time, index) => (
                        <React.Fragment key={index}>
                            <div className="time-item">
                                <p>
                                    {time.startTime} - {time.stopTime}
                                </p>

                                <button className="remove-button" onClick={() => handleRemoveTime(index)}></button>
                            </div>
                            <div className="duration component">
                                <p>Tidsintervall: {calculateDuration(time.startTime, time.stopTime)}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div className="modal-line-time"></div>
            <RangeSlider min={0} setRangeValue={setRangeValue} max={60} value={value} sliderHeading="Paus" />
            <TrainingPeriodInputs
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
            />
            <SavedPopUp popUp={popUp} />

            <button onClick={saveTraining} className="save-button">
                Spara
            </button>

            <div className="buttons-and-title-container">
                <IconHeading iconUrl="./assets/icon-calender.svg" text="Kalender" />
                <div className="buttons">
                    <button className={`icon-button ${classNameBefore}`} onClick={toggleCalendar}>
                        <span className="weekCalendar"> </span>
                    </button>
                    <button className={`icon-button ${otherClassNameBefore}`} onClick={toggleCalendar}>
                        <span className="monthCalendar"> </span>
                    </button>
                </div>
            </div>

            {switchCalendar === "week" ? (
                <>
                    <WeekCalendar
                        setOpenModal={setOpenModal}
                        startDateRange={startDate}
                        editedDates={editedDates}
                        removeTimes={removeTimes}
                        endDate={endDate}
                        onClick={setDay}
                        setTimeAvailable={setTimeAvailable}
                        daysTrainingList={daysTrainingList}
                        timeAvailable={timeAvailable}
                        selectedTrainings={selectedTrainings}
                        setEditedDates={setEditedDates}
                        setEditedDaysInRange={setEditedDaysInRange}
                        chosenDays={chosenDays}
                        trainingList={trainingList}
                    />
                    <RemoveTimesButton setRemoveTimes={setRemoveTimes} title="Rensa alla tider" />
                </>
            ) : switchCalendar === "month" ? (
                <MonthCalendar
                    setOpenModal={setOpenModal}
                    startDate={startDate}
                    endDate={endDate}
                    onClick={setDay}
                    chosenDays={chosenDays}
                    trainingList={trainingList}
                />
            ) : null}
            {openModal && (
                <Modal
                    setOpenModal={setOpenModal}
                    setOpenOtherModal={setOpenOtherModal}
                    openOtherModal={openOtherModal}
                    dayClicked={dayClicked}
                    modalData={modalData}
                    editedDaysInRange={editedDaysInRange}
                    editedDates={editedDates}
                    handleOnSave={handleOnSave}
                    handleOnSaveManyDays={handleOnSaveManyDays}
                    setEditedDaysInRange={setEditedDaysInRange}
                    setSingleTrainingList={setSingleTrainingList}
                    weekday={weekday}
                />
            )}
        </div>
    );
}
