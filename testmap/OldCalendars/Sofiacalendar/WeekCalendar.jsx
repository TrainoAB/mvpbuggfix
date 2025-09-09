import React, { useEffect, useState, useRef } from 'react';
import './WeekCalendar.css';
import {
  formatDate,
  getMonday,
  getNextDay,
  getPreviousDay,
  getDaysInRange,
  getDayInRange,
  formatWeekRange,
  getEditedDaysInRange,
  getWeek,
  getEditedDay,
} from '../old-schedule/utilities';
import TimeBox from './TimeBox';

const WeekCalendar = ({
  setOpenModal,
  startDateRange,
  endDate,
  onClick,
  timeAvailable,
  setTimeAvailable,
  setEditedDates,
  setEditedDaysInRange,
  chosenDays,
  removeTimes,
  trainingList,
  daysTrainingList,
  selectedTrainings,
}) => {
  const [startDate, setStartDate] = useState(getMonday());
  const savedTimesRef = useRef({}); // Ref to save the Times
  const savedTrainingsRef = useRef({}); // Ref to save selectedTrainings
  const saveDateRef = useRef({});

  const week = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const stylingLines = ['Line', '', '', '', '', '', 'noLine'];

  const handleNextWeek = () => {
    setStartDate((prevStartDate) => getNextDay(prevStartDate, 7));
  };

  const handlePrevWeek = () => {
    setStartDate((prevStartDate) => getPreviousDay(prevStartDate, 7));
  };

  const onClickOnDay = (date, dayInRange, weekday) => {
    setOpenModal(true);
    let inRange = dayInRange !== null;
    onClick(date, inRange, weekday);
  };

  const setIconBasedOnTraining = (arr) => {
    return arr.map((selectedTraining, index) =>
      selectedTraining.typeOfTraining === 'Onlineträning'
        ? setIconBasedOnTypeOfTraining('online', index)
        : selectedTraining.typeOfTraining === 'Träningsprogram'
        ? setIconBasedOnTypeOfTraining('trainingProgram', index)
        : selectedTraining.typeOfTraining === 'Kostprogram'
        ? setIconBasedOnTypeOfTraining('foodProgram', index)
        : null,
    );
  };

  const setIconBasedOnTypeOfTraining = (classN, index) => {
    const iconStyles = {
      display: 'flex',
      width: '0.75rem',
      height: '0.75rem',
    };

    return <span style={iconStyles} key={index} className={classN}></span>;
  };
  let displayTimes;

  const timesForAllDaysOrForSingleDay = (editData, editedDataManyDays, currentDate) => {
    if (editData.length !== 0) {
      displayTimes = setEditedAndNonEditedTimes(editData);
    } else {
      displayTimes = setEditedAndNonEditedTimesAllDays(editedDataManyDays, currentDate);
    }
    return displayTimes;
  };

  const removeAllTimes = (singleData, dataManyDays) => {
    singleData.forEach((data) => data.timeAvailable.pop());
    dataManyDays.forEach((data) => data.timeAvailable.pop());
    savedTimesRef.current = {};
    setTimeAvailable([]);
  };

  const setEditedAndNonEditedTimesAllDays = (arr, currentDate) => {
    const formattedDate = formatDate(currentDate);

    // Collect the data for the current date from the array 'arr'
    const currentDayData = arr.filter((data) => formatDate(new Date(data.date)) === formattedDate);
    // Get saved times from ref
    const savedTimes = savedTimesRef.current[formattedDate] ? Array.from(savedTimesRef.current[formattedDate]) : [];
    // If currentDayData has times, use those times only
    if (currentDayData.length > 0 && currentDayData[0].timeAvailable.length > 0) {
      // Save all times to sageDateRef,  render TimeBoxes components
      const currentDayTimes = currentDayData.flatMap((data) => data.timeAvailable.map((time) => time.startTime));
      if (currentDayTimes.length === 0) {
        return [];
      }

      if (!savedTimesRef.current[formattedDate]) {
        savedTimesRef.current[formattedDate] = new Set();
      }
      if (!saveDateRef.current[formattedDate]) {
        saveDateRef.current[formattedDate] = new Set();
      }

      currentDayData.forEach((data) => saveDateRef.current[formattedDate].add(data.date));

      currentDayTimes.forEach((time) => savedTimesRef.current[formattedDate].add(time));
      return currentDayTimes.map((time, index) => <TimeBox key={index} time={time} />);
    } else if (savedTimes.length > 0) {
      return savedTimes.map((time, index) => <TimeBox key={index} time={time} />);
    } else {
      // Get saved times from ref
      const savedTimes = savedTimesRef.current[formattedDate] ? Array.from(savedTimesRef.current[formattedDate]) : [];

      // Combine the saved tomes with timeAvailable-times and see so they are unique. Render Timeboxes components
      const combinedTimes = [...new Set([...savedTimes, ...timeAvailable.map((time) => time.startTime)])];

      return combinedTimes.map((time, index) => <TimeBox key={index} time={time} />);
    }
  };

  const setEditedAndNonEditedTimes = (arr) => {
    let times;
    times = arr;

    return times.map((data) =>
      data.timeAvailable.map((time, index) =>
        !timeAvailable.includes(time.startTime) ? <TimeBox key={index} time={time.startTime} /> : null,
      ),
    );
  };

  const renderWeekDays = () => {
    const days = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    for (let i = 0; i < 7; i++) {
      const weekday = week[i];
      const className = getDaysInRange(currentDate, startDateRange, endDate);
      const dayInRange = getDayInRange(currentDate, startDateRange, endDate);
      const editData = getEditedDay(currentDate, startDateRange, endDate, trainingList);

      const editedDataManyDays = getEditedDaysInRange(currentDate, startDateRange, endDate, daysTrainingList);

      useEffect(() => {
        if (removeTimes) {
          removeAllTimes(editData, editedDataManyDays);
        }
      }, [removeTimes]);

      useEffect(() => {
        if (editData && editData.length > 0) {
          setEditedDates(trainingList);
        }
      }, [trainingList]);

      useEffect(() => {
        if (editedDataManyDays && editedDataManyDays.length > 0) {
          setEditedDaysInRange(editedDataManyDays);
        }
      }, [daysTrainingList]);

      console.log('edited Data alldays in range', editedDataManyDays);
      console.log('edited Data single day in range', trainingList);
      timesForAllDaysOrForSingleDay(editData, editedDataManyDays, currentDate);
      let icons;

      if (editData && editData.length > 0) {
        icons = setIconBasedOnTraining(editData[editData.length - 1].selectedTrainings);
      } else {
        // Collect the data for the current date from the array 'arr'
        const formattedDate = formatDate(currentDate);
        const currentDayData = editedDataManyDays.filter((data) => formatDate(new Date(data.date)) === formattedDate);

        // Get saved trainings from ref
        const savedTrainings = savedTrainingsRef.current[formattedDate]
          ? Array.from(savedTrainingsRef.current[formattedDate])
          : [];

        if (currentDayData.length > 0 && currentDayData[0].selectedTrainings.length > 0) {
          // Save all times to sageDateRef,  render TimeBoxes components
          const currentDayTrainings = currentDayData.flatMap((data) =>
            data.selectedTrainings.map((training) => training),
          );

          if (!savedTrainingsRef.current[formattedDate]) {
            savedTrainingsRef.current[formattedDate] = new Set();
          }
          if (!saveDateRef.current[formattedDate]) {
            saveDateRef.current[formattedDate] = new Set();
          }

          currentDayData.forEach((data) => saveDateRef.current[formattedDate].add(data.date));

          currentDayTrainings.forEach((training) => savedTrainingsRef.current[formattedDate].add(training));
          icons = setIconBasedOnTraining(currentDayTrainings);
        } else if (currentDayData.length === 0 && savedTrainings.length > 0) {
          icons = setIconBasedOnTraining(savedTrainings);
        } else {
          // Get saved trainings from ref
          const savedTrainings = savedTrainingsRef.current[formattedDate]
            ? Array.from(savedTrainingsRef.current[formattedDate])
            : [];

          // Combine the saved trainings with selected Trainings and see so they are unique.
          const combinedTrainings = [...new Set([...savedTrainings, ...selectedTrainings.map((training) => training)])];

          icons = setIconBasedOnTraining(combinedTrainings);
        }
      }

      const isInRange = chosenDays.includes(weekday.toLowerCase()) && dayInRange;
      const dayStyles = {
        borderRight: stylingLines[i] === 'noLine' ? 'transparent' : '2px solid var(--secondary-light-grey)',
        borderLeft: stylingLines[i] === 'Line' ? '2px solid #eed6ff' : 'transparent',
        height: '22rem',
      };
      const dateToPass = new Date(currentDate.getTime());

      days.push(
        <div key={i} className="day" onClick={() => onClickOnDay(dateToPass, dayInRange, week[i])}>
          <div className="day-header">
            <div className="day-header-val">{week[i]}</div>
            <p className="dayNumber">{formatDate(currentDate)}</p>
          </div>

          <div style={dayStyles} className={isInRange ? className : ''}>
            <p className="add">+</p>

            {editData.length === 0 && editedDataManyDays.length === 0
              ? isInRange && timeAvailable.map((time, index) => <TimeBox key={index} time={time.startTime} />)
              : isInRange && displayTimes}
            <div className="training-icons-container">
              {editData.length === 0 && editedDataManyDays.length === 0
                ? isInRange && setIconBasedOnTraining(selectedTrainings)
                : isInRange && icons}
            </div>
          </div>
        </div>,
      );

      currentDate = getNextDay(currentDate);
    }

    return <div className="header-wrapper">{days}</div>;
  };

  return (
    <div className="week-calendar-wrapper">
      <header>
        <div className="date-display">
          <button onClick={handlePrevWeek} className="nav-button">
            {'<'} Tidigare
          </button>
          <div className="date-heading">
            <span className="current-date">{formatWeekRange(startDate)}</span>
            <span className="current-week">{getWeek(startDate)}</span>
          </div>
          <button onClick={handleNextWeek} className="nav-button">
            Senare {'>'}
          </button>
        </div>
      </header>
      <div className="timesAndDates">
        <div className="times">
          <span className="clock-image"></span>
          {timeAvailable.map((time, index) => (
            <div key={index} className="time-slot">
              {`${time.startTime}`}
            </div>
          ))}
        </div>

        {renderWeekDays()}
      </div>
    </div>
  );
};

export default WeekCalendar;
