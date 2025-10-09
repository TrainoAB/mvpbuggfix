import { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { generatePasses, formatPassAmount } from './calendarfunctions';
import { generateUUID } from '@/app/functions/functions';
import './CalendarDetails.css';

export default function EventEdit({
  selectedEvent,
  data,
  setData,
  fetchedPasses,
  setFetchedSchedule,
  onClose,
  onUpdate,
  isPause,
}) {
  const { DEBUG, useTranslations, language, userData } = useAppState();
  const { translate } = useTranslations('schedule', language);
  const [addPause, setAddPause] = useState(isPause === 1 ? true : false);

  const [editPause, setEditPause] = useState('');
  const [pausStart, setPausStart] = useState('');
  const [pausEnd, setPausEnd] = useState('');

  DEBUG && console.log('Edit Event:', selectedEvent);

  // Create a Date object
  const eventDate = new Date(selectedEvent.start);
  function dateAsString(date) {
    return date.toISOString().split('T')[0];
  }
  const dateString = dateAsString(eventDate);

  // Format the date to get "Sunday, November 03, 2024"
  const fullDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(eventDate);

  // Extract the day name and month name separately
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(eventDate);
  const dayNameShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(eventDate).toLowerCase();
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(eventDate);
  const dayOfMonth = new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(eventDate);
  const year = eventDate.getFullYear();

  const [editIntervals, setEditIntervals] = useState(() => {
    return createIntervals(data, fetchedPasses, dayNameShort);
  });

  // EDIT INTERVALS
  const [intervalData, setIntervalData] = useState([]);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);

  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [editingIntervalIndex, setEditingIntervalIndex] = useState(null);
  const [editedInterval, setEditedInterval] = useState({ start: '', end: '' });
  const [editableEvent, setEditableEvent] = useState(null);

  // MARK: Create Interval
  function createIntervals(array, fetchedPasses, day) {
    const currentDay = day.toLowerCase();
    // Step 1: Extract unique (pass_repeat_id, category_link) pairs excluding isbooked: true
    const uniquePairs = [];
    array.forEach((item) => {
      if (!item.isbooked) {
        // Check if isbooked is not true
        const pair = { pass_repeat_id: item.pass_repeat_id, category_link: item.category_link };
        if (
          !uniquePairs.some(
            (existing) =>
              existing.pass_repeat_id === pair.pass_repeat_id && existing.category_link === pair.category_link,
          )
        ) {
          uniquePairs.push(pair);
        }
      }
    });

    // Step 2: Fetch objects from fetchedPasses where pass_repeat_id and category_link match unique pairs
    const result = uniquePairs.map((pair) => {
      return fetchedPasses.pass_set.find(
        (pass) => pass.pass_repeat_id === pair.pass_repeat_id && pass.category_link === pair.category_link,
      );
    });

    DEBUG && console.log('Result', result);

    const filteredResult = result
      .map((item) => {
        if (!item.isrepeat) {
          DEBUG && console.log('isrepeat is false', item.singeldayrepeat, currentDay);
          // If isrepeat is false, only include items where singledayrepeat matches currentDay
          if (item.singeldayrepeat === currentDay) {
            return item;
          }
        } else {
          DEBUG && console.log('isrepeat is true');
          // If isrepeat is true, filter intervals to match currentDay
          const filteredIntervals = item.intervals
            .map((interval) => (interval.day === currentDay ? interval : null))
            .filter(Boolean); // Remove nulls from filteredIntervals

          // Return the item only if there are matching intervals for the current day
          if (filteredIntervals.length > 0) {
            return { ...item, intervals: filteredIntervals };
          }
        }
        return null; // Return null if the item should not be included
      })
      .filter(Boolean); // Filter out null values from the result

    return filteredResult;
  }

  const handleSubmenuToggle = (index) => {
    setOpenSubmenuIndex(openSubmenuIndex === index ? null : index);
  };

  const handleEditClick = (eventIndex, intervalIndex, interval) => {
    setEditingEventIndex(eventIndex);
    setEditingIntervalIndex(intervalIndex);
    setEditedInterval(interval);
  };

  // MARK: Delete Interval
  const handleDeleteClick = (eventIndex, intervalIndex, interval) => {
    const promptMessage = `${translate('schedule_ deleteintervalrepeateddayswarning')} ${interval.start} - ${interval.end}`;
    if (!window.confirm(promptMessage)) return;

    const isRepeat = editIntervals[eventIndex].singeldayrepeat;
    interval.isrepeat = isRepeat === null ? false : true;

    DEBUG && console.log('Payload:', JSON.stringify(interval));
    // TODO: Fix API Route - Temporary fetch
    fetch('https://traino.nu/php/editcalendar.php?type=deleteinterval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interval),
    })
      .then((response) => response.json())
      .then((data) => {
        DEBUG && console.log('Response:', data);
      })
      .catch((error) => {
        DEBUG && console.error('Error:', error);
      });

    setEditIntervals((prevIntervals) => {
      // Make a copy of the previous intervals array
      const newIntervals = [...prevIntervals];

      DEBUG && console.log('Delete:', newIntervals, eventIndex, intervalIndex, interval);
      if (newIntervals[eventIndex].singeldayrepeat === null) {
        // Find the interval object to delete (for debugging purposes)
        const intervalToDelete = newIntervals[eventIndex].intervals[0].intervals[intervalIndex];
        DEBUG && console.log('Interval to delete:', intervalToDelete);

        // Remove the interval object at the specified index
        newIntervals[eventIndex].intervals[0].intervals.splice(intervalIndex, 1);
      } else {
        // Find the interval object to delete
        const intervalToDelete = newIntervals[eventIndex].intervals[intervalIndex];

        // Delete the interval object from the array
        newIntervals[eventIndex].intervals = newIntervals[eventIndex].intervals.filter(
          (item) => item !== intervalToDelete,
        );
      }

      return newIntervals;
    });

    const intervalId = interval.id;
    const updatedData = data.filter((event) => event.id !== intervalId);

    DEBUG && console.log(updatedData);

    // Update the data state with the new intervals
    setData(updatedData);
  };

  // MARK: Delete Pass
  const handleDeletePass = (event, editIndex) => {
    // TODO: Fix API Route - Temporary fetch
    DEBUG && console.log('Delete Pass:', event, editIndex);
    fetch('https://traino.nu/php/delete_pass_set.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: event.pass_set_id,
        user_id: event.pa_userid,
      })
    })
      .then((response) => response.json())
      .then((data) => {
        DEBUG && console.log('Response:', data);
      })
      .catch((error) => {
        DEBUG && console.error('Error:', error);
      });

    const promptMessage = translate('schedule_deleterepeateddayswarning');
    if (!window.confirm(promptMessage)) return;

    DEBUG && console.log(event);

    setEditIntervals((prevIntervals) => {
      // Make a copy of the previous intervals array
      const newIntervals = [...prevIntervals];

      // Remove the event at the specified editIndex
      newIntervals.splice(editIndex, 1);

      return newIntervals;
    });

    const { pass_repeat_id, product_id } = event;

    const updatedData = data.filter(
      (item) => !(item.pass_repeat_id === pass_repeat_id && item.product_id === product_id),
    );

    setData(updatedData);

    handleSubmenuToggle(null);
  };

  // MARK: Add Interval
  const handleAddInterval = (event, editIndex) => {
    DEBUG && console.log(event, editIndex);

    let newId = generateUUID();
    const newInterval = {
      id: newId,
      start: '00:00',
      end: '00:00',
      pass_amount: 0,
    };

    const productId = event.product_id;
    const setId = event.pass_set_id;
    const day = event.intervals[0].day;

    DEBUG && console.log('Add pass:', 'productId', productId, 'setId', setId, 'day', day, 'newInterval', newInterval);

    const addIntervalObject = {
      pass_set_id: setId,
      day: day,
      isrepeat: event.singeldayrepeat === null ? false : true,
      ...newInterval,
    };

    DEBUG && console.log('Payload:', JSON.stringify(addIntervalObject));

    // TODO: Fix API Route - Temporary fetch
    fetch('https://traino.nu/php/editcalendar.php?type=addinterval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addIntervalObject),
    })
      .then((response) => response.json())
      .then((data) => {
        DEBUG && console.log('Response:', data);
      })
      .catch((error) => {
        DEBUG && console.error('Error:', error);
      });

    try {
      if (event.singeldayrepeat === null) {
        const passIndex = fetchedPasses.pass_set.findIndex(
          (pass) => pass.product_id === productId && pass.pass_set_id === setId,
        );

        if (passIndex !== -1) {
          const updatedFetchedPasses = { ...fetchedPasses };
          updatedFetchedPasses.pass_set = [...fetchedPasses.pass_set];

          const intervalId = updatedFetchedPasses.pass_set[passIndex].intervals.findIndex(
            (interval) => interval.day === day,
          );

          DEBUG && console.log('Interval Index:', intervalId);

          if (intervalId !== -1) {
            const dayIntervals = updatedFetchedPasses.pass_set[passIndex].intervals[intervalId].intervals;

            // Check if an identical interval already exists
            if (!dayIntervals.some((interval) => interval.start === '00:00' && interval.end === '00:00')) {
              dayIntervals.push(newInterval);
            }

            setFetchedSchedule(updatedFetchedPasses);
            let newPasses = generatePasses(updatedFetchedPasses);
            setData(newPasses);
          }
        }
      }

      if (event.singeldayrepeat === null) {
        setEditIntervals((prevIntervals) => {
          const newIntervals = [...prevIntervals];
          const editDayIntervals = newIntervals[editIndex].intervals[0].intervals;

          // Check for duplicate before adding
          if (!editDayIntervals.some((interval) => interval.start === '00:00' && interval.end === '00:00')) {
            editDayIntervals.push(newInterval);
          }
          return newIntervals;
        });
      } else {
        setEditIntervals((prevIntervals) => {
          const newIntervals = [...prevIntervals];
          const editDayIntervals = newIntervals[editIndex].intervals;

          if (!editDayIntervals.some((interval) => interval.start === '00:00' && interval.end === '00:00')) {
            editDayIntervals.push(newInterval);
          }
          return newIntervals;
        });
      }
    } catch (error) {
      DEBUG && console.error('Error adding pass:', error);
    } finally {
      handleSubmenuToggle(null);
    }
  };

  const timeStringToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // MARK: Input Change
  const handleInputChange = (interval, eventIndex, index, e) => {
    const { name, value } = e.target;

    // Helper function to check for overlapping intervals
    // TODO: Move hasOverlap into handleSumbit function somehow?
    // MARK: HasOverlap
    const hasOverlap = (newStart, newEnd, interval, editIntervals, eventIndex, dayNameShort) => {
      const newStartMinutes = timeStringToMinutes(newStart);
      const newEndMinutes = timeStringToMinutes(newEnd);

      DEBUG && console.log('Checking for overlap:');
      DEBUG && console.log('New Interval:', { newStart, newEnd, newStartMinutes, newEndMinutes });
      DEBUG && console.log('Intervals:', editIntervals);
      DEBUG && console.log('Event Index:', eventIndex);
      DEBUG && console.log('Day Name Short:', dayNameShort);

      const product_id = editIntervals[eventIndex].product_id;
      DEBUG && console.log('Product ID:', product_id);

      return editIntervals.some((event) => {
        DEBUG && console.log('Checking event:', event);
        if (event.product_id === product_id) {
          DEBUG && console.log('Product ID matches:', event.product_id);
          if (event.isrepeat) {
            DEBUG && console.log('Event is a repeat');
            return event.intervals.some((innerInterval) => {
              DEBUG && console.log('Checking inner interval:', innerInterval);
              if (innerInterval.day === dayNameShort) {
                return innerInterval.intervals.some((i) => {
                  DEBUG && console.log('Checking interval:', i);

                  DEBUG && console.log('Day matches:', i.day);
                  if (i.id === interval.id) {
                    DEBUG && console.log('Skipping current interval:', i.id);
                    return false;
                  }
                  const startMinutes = timeStringToMinutes(i.start);
                  const endMinutes = timeStringToMinutes(i.end);
                  const isOverlap =
                    newStartMinutes < endMinutes && newEndMinutes > startMinutes && newEndMinutes !== startMinutes;

                  DEBUG &&
                    console.log('Interval:', {
                      start: i.start,
                      end: i.end,
                      startMinutes,
                      endMinutes,
                    });
                  DEBUG && console.log('Is Overlap:', isOverlap);
                  return isOverlap;
                });
              } else {
                return false;
              }
            });
          } else {
            DEBUG && console.log('Event is not a repeat');
            if (event.singeldayrepeat === dayNameShort) {
              return event.intervals.some((i) => {
                DEBUG && console.log('Checking interval:', i);

                DEBUG && console.log('Single day repeat matches:', i.singleDayRepeat);
                if (i.id === interval.id) {
                  DEBUG && console.log('Skipping current interval:', i.id);
                  return false;
                }
                const startMinutes = timeStringToMinutes(i.start);
                const endMinutes = timeStringToMinutes(i.end);
                const isOverlap =
                  newStartMinutes < endMinutes && newEndMinutes > startMinutes && newEndMinutes !== startMinutes;

                DEBUG &&
                  console.log('Interval:', {
                    start: i.start,
                    end: i.end,
                    startMinutes,
                    endMinutes,
                  });
                DEBUG && console.log('Is Overlap:', isOverlap);
                return isOverlap;
              });
            } else {
              return false;
            }
          }
        }
        return false;
      });
    };

    // Function to update intervals if no overlap is detected
    const updateIntervals = (newIntervals) => {
      setEditIntervals(newIntervals);
    };

    // Use latest `editIntervals` state
    setEditIntervals((prevIntervals) => {
      const newIntervals = [...prevIntervals];

      // Determine if we're dealing with a repeat or a single interval
      if (newIntervals[eventIndex].isrepeat) {
        const currentInterval = newIntervals[eventIndex].intervals[0];
        DEBUG && console.log(currentInterval.intervals);
        const intervalIndex = currentInterval.intervals.findIndex((i) => i.id === interval.id);

        if (intervalIndex !== -1) {
          const newInterval = { ...currentInterval.intervals[intervalIndex], [name]: value };

          // Check for overlap
          if (!hasOverlap(newInterval.start, newInterval.end, interval, newIntervals, eventIndex, dayNameShort)) {
            newIntervals[eventIndex].intervals[0].intervals[intervalIndex] = newInterval;

            const passAmount = formatPassAmount(newIntervals[eventIndex].duration, newInterval.start, newInterval.end);

            newIntervals[eventIndex].intervals[0].intervals[intervalIndex] = {
              ...newInterval,
              pass_amount: passAmount,
            };

            DEBUG && console.log(newIntervals);
            updateIntervals(newIntervals);
          } else {
            alert('Overlap detected! Please adjust the start and end times.');
          }
        }
      } else {
        // Handle non-repeating case
        const currentInterval = newIntervals[eventIndex].intervals[index];
        const newInterval = { ...currentInterval, [name]: value };

        // Check for overlap
        if (!hasOverlap(newInterval.start, newInterval.end, interval, newIntervals, eventIndex, dayNameShort)) {
          newIntervals[eventIndex].intervals[index] = newInterval;

          const passAmount = formatPassAmount(newIntervals[eventIndex].duration, newInterval.start, newInterval.end);

          newIntervals[eventIndex].intervals[index] = {
            ...newInterval,
            pass_amount: passAmount,
          };

          updateIntervals(newIntervals);
        } else {
          alert('Overlap detected! Please adjust the start and end times.');
        }
      }

      return newIntervals; // Return the updated intervals
    });
  };

  // MARK: Edit intervals
  const handleOkClick = (interval, e) => {
    e.preventDefault();
    setEditingEventIndex(null);
    setEditingIntervalIndex(null);

    const intervalId = interval.id;
    const newIntervalStart = interval.start;
    const newIntervalEnd = interval.end;

    DEBUG && console.log('Interval: ', interval);

    // Send Interval to PHP

    DEBUG && console.log('Data in editbox:', data);

    /*
    const updateTimeForDate = (oldDateString, newTimeString) => {
      const oldDate = new Date(oldDateString);
      const [newHour, newMinute] = newTimeString.split(':');

      oldDate.setHours(newHour);
      oldDate.setMinutes(newMinute);
      oldDate.setSeconds(0);

      const timezoneOffset = oldDate.getTimezoneOffset() / 60;
      oldDate.setHours(oldDate.getHours() + timezoneOffset + 1);

      return oldDate;
    };

    const updatedData = data.map((event) => {
      if (event.id === intervalId) {
        const updatedStart = updateTimeForDate(event.start, newIntervalStart);
        const updatedEnd = updateTimeForDate(event.end, newIntervalEnd);

        return {
          ...event,
          start: updatedStart,
          end: updatedEnd,
        };
      }
      return event;
    });

    // Sort updatedData by start time
    updatedData.sort((a, b) => a.start - b.start);

    DEBUG && console.log(updatedData);
    */

    // Clone fetched passes
    const updatedFetchedPasses = { ...fetchedPasses };

    // Update the start and end time in updatedFetchedPasses
    function findIntervalById(intervals, targetId) {
      for (const interval of intervals) {
        if (interval.id === targetId) {
          return interval;
        }
        if (interval.intervals) {
          // Recursive call to search in nested intervals
          const found = findIntervalById(interval.intervals, targetId);
          if (found) {
            return found;
          }
        }
      }
      return null; // Return null if not found
    }

    let passRepeat;
    let pass_set_id;

    // Example usage
    updatedFetchedPasses.pass_set = updatedFetchedPasses.pass_set.map((pass) => {
      const foundInterval = findIntervalById(pass.intervals, intervalId);
      if (foundInterval) {
        passRepeat = pass.isrepeat;
        pass_set_id = pass.pass_set_id;
        DEBUG && console.log(passRepeat, pass_set_id);

        return {
          ...pass,
          start: newIntervalStart,
          end: newIntervalEnd,
        };
      }

      return pass;
    });

    interval.isrepeat = passRepeat || false;
    interval.day = dayNameShort;
    interval.pass_set_id = pass_set_id;
    DEBUG && console.log('Payload:', JSON.stringify(interval));
    // TODO: Fix API Route - Temporary fetch
    fetch('https://traino.nu/php/editcalendar.php?type=editinterval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interval),
    })
      .then((response) => response.json())
      .then((data) => {
        DEBUG && console.log('Response:', data);
      })
      .catch((error) => {
        DEBUG && console.error('Error:', error);
      });

    setFetchedSchedule(updatedFetchedPasses);
    let newPasses = generatePasses(updatedFetchedPasses);
    setData(newPasses);
  };

  const handleEdit = (event) => {
    setEditableEvent(event);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [hour, minute] = value.split(':').map(Number);
    const newDate = editableEvent[name] ? new Date(editableEvent[name]) : new Date();
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setEditableEvent((prev) => ({
      ...prev,
      [name]: newDate,
    }));
  };

  // MARK: Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    DEBUG && console.log('Submitting:', editableEvent.start, editableEvent.end);
    // Check if end time is before start time
    if (editableEvent.start >= editableEvent.end) {
      alert('Start time cannot be after end time. Please adjust the times.');
      return;
    }

    // Check if interval.start and interval.end are the same
    if (editableEvent.start === editableEvent.end) {
      alert('Start time and end time cannot be the same. Please adjust the times.');
      return;
    }

    if (editableEvent.end <= editableEvent.start) {
      alert('End time cannot be before start time. Please adjust the times.');
      return;
    }

    // Proceed with updating the event
    onUpdate({
      ...editableEvent,
      duration: parseInt(editableEvent.duration, 10),
    });
    setEditableEvent(null);
  };

  function formatTime(dateString) {
    if (!dateString) return ''; // Handle cases where dateString is undefined/null

    const date = new Date(dateString);
    let hours = date.getHours();
    let minutes = date.getMinutes();

    // Pad single digit hours and minutes with a leading zero
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return `${hours}:${minutes}`;
  }

  const findIntervalIndex = (intervals, dayNameShort) => {
    return intervals.findIndex((interval) => interval.day === dayNameShort);
  };

  // MARK: Paus logic
  function editPauseIntervalls(passId, startTime, endtime) {
    setEditPause(passId);
    setPausStart(startTime);
    setPausEnd(endtime);
  }

  async function handlePauseSubmit(e, passId) {
    e.preventDefault();

    // Check if pause overlapse other pauses
    const pausesThisDate = fetchedPasses.pass_booked
      .filter((pass) => pass.booked_date === dateString)
      .filter((pass) => pass.ispause === 1)
      .filter((pass) => pass.pass_id !== passId);
    DEBUG && console.log('Pauses This Date', pausesThisDate);

    const foundPause = pausesThisDate.find((pause) => pausStart < pause.endtime && pausEnd > pause.starttime);
    if (foundPause) {
      alert('Time overlap existing paus');
      return;
    }

    const updatedFetchedPasses = { ...fetchedPasses };

    // if id=0, create new Pause
    if (passId === 0) {
      const randomNumber = Math.random();
      const enlargeNumber = randomNumber * 10000000000000000;
      const floorNumber = Math.floor(enlargeNumber);

      const newPaus = {
        pass_id: floorNumber,
        user_id: parseInt(userData.current.id),
        product_type: null,
        product_id: null,
        trainer_id: parseInt(userData.current.id),
        pass_set_id: null,
        pass_set_repeat_id: null,
        rrule: null,
        booked_date: dateString,
        starttime: pausStart,
        endtime: pausEnd,
        paid: 0,
        cancelled: 0,
        ispause: 1,
        reason: null,
        registered: new Date().toISOString(),
        stripe_order_id: null,
      };
      updatedFetchedPasses.pass_booked.push(newPaus);
      alert(translate('schedule_breakadded'));
    }
    // If id != 0, edit existing pause
    else {
      updatedFetchedPasses.pass_booked.map((pass) => {
        DEBUG && console.log('passID', passId);

        if (pass.pass_id === passId) {
          return { ...pass, starttime: pausStart, endtime: pausEnd };
        }
        return pass;
      });
    }
    // Save changes and reset form
    setFetchedSchedule(updatedFetchedPasses);
    let newPasses = generatePasses(updatedFetchedPasses);
    setData(newPasses);
    setPausStart('');
    setPausEnd('');
    setEditPause('');
  }

  async function deletePause(passId) {
    const updatedFetchedPasses = { ...fetchedPasses };
    updatedFetchedPasses.pass_booked = updatedFetchedPasses.pass_booked.filter((pass) => pass.pass_id !== passId);
    setFetchedSchedule(updatedFetchedPasses);
    let newPasses = generatePasses(updatedFetchedPasses);
    setData(newPasses);
    setPausStart('');
    setPausEnd('');
    alert(translate('schedule_breakdeleted'));
  }

  // MARK: Render Intervals
  const renderIntervals = (eventIndex, intervals, dayNameShort, event) =>
    intervals.map((interval, index) => (
      <li key={index} className={editingEventIndex === eventIndex && editingIntervalIndex === index ? `liedit` : ``}>
        {editingEventIndex === eventIndex && editingIntervalIndex === index ? (
          <>
            <input
              type="time"
              name="start"
              value={interval.start}
              onChange={(e) => handleInputChange(interval, eventIndex, index, e)}
            />
            -
            <input
              type="time"
              name="end"
              value={interval.end}
              onChange={(e) => handleInputChange(interval, eventIndex, index, e)}
            />
            <button className="button" onClick={(e) => handleOkClick(interval, e)}>
              OK
            </button>
          </>
        ) : (
          <>
            <button className="btn-edit" onClick={() => handleEditClick(eventIndex, index, interval)}>
              Edit
            </button>
            {/*
            <div
              className={`submenu ${eventIndex !== 0 && editIntervals.length === eventIndex + 1 ? 'lastsubmenu' : ''} ${
                openSubmenuIndex === eventIndex ? 'open' : ''
              }`}
            >
              <button>Editera denna {swedishDay}</button>
              <button>Editera alla {swedishDay}ar</button>
              </div>
              */}
            {interval.start} - {interval.end} <span>{interval.pass_amount} pass</span>
            <button className="btn-delete" onClick={() => handleDeleteClick(eventIndex, index, interval)}>
              Delete
            </button>
          </>
        )}
      </li>
    ));

  DEBUG && console.log('Todays Module Merged Data', editIntervals);

  // MARK: Markup
  return (
    <>
      <div className="categorytop">
        <div className="btn-back" onClick={() => onClose(false)}></div>
        <h1>{`${dayName}, ${monthName}, ${dayOfMonth}, ${year}`}</h1>
        <div></div>
      </div>
      <div className="calendardetailsscroll">
        <div className="contain">
          <div style={{ padding: '1rem' }}>
            <button className="button" onClick={() => setAddPause((prev) => !prev)}>
              {addPause ? translate('schedule_editintervals') : translate('schedule_editbreaks')}
            </button>
          </div>
          {addPause ? (
            <>
              <div style={{ padding: '1rem' }}>
                {/* MARK: Edit pauses */}
                <ul className="editintervals">
                  <li className="liedit">
                    <input type="time" name="pausestart" onChange={(e) => setPausStart(e.target.value)} />
                    -
                    <input type="time" name="pauseend" onChange={(e) => setPausEnd(e.target.value)} />
                    <button className="button" onClick={(e) => handlePauseSubmit(e, 0)}>
                      +
                    </button>
                  </li>
                </ul>
                {fetchedPasses.pass_booked &&
                  fetchedPasses.pass_booked
                    .filter((pass) => pass.booked_date === dateString)
                    .filter((pass) => pass.ispause === 1)
                    .map((pass, index) => (
                      <>
                        {pass.pass_id !== editPause ? (
                          <div key={index} className="editintervals">
                            <li className="listedpause">
                              <button
                                class="btn-edit"
                                onClick={() => editPauseIntervalls(pass.pass_id, pass.starttime, pass.endtime)}
                              >
                                Edit
                              </button>
                              <p className="pausetext">
                                {pass.starttime} - {pass.endtime}
                              </p>
                              <div></div>
                              <button class="btn-delete" onClick={() => deletePause(pass.pass_id)}>
                                Delete
                              </button>
                            </li>
                          </div>
                        ) : (
                          <ul className="editintervals">
                            <li className="liedit">
                              <input
                                type="time"
                                name="pausestart"
                                value={pausStart}
                                onChange={(e) => setPausStart(e.target.value)}
                              />
                              -
                              <input
                                type="time"
                                name="pauseend"
                                value={pausEnd}
                                onChange={(e) => setPausEnd(e.target.value)}
                              />
                              <button className="button" onClick={(e) => handlePauseSubmit(e, pass.pass_id)}>
                                OK
                              </button>
                            </li>
                          </ul>
                        )}
                      </>
                    ))}
              </div>
            </>
          ) : (
            <>
              {/* MARK: Edit intervals */}
              {editIntervals &&
                editIntervals.map((event, editIndex) => (
                  <div key={editIndex} className="calendardetails-content">
                    {editableEvent && editableEvent.pass_id === event.pass_id ? (
                      <form onSubmit={handleSubmit}>
                        <h2>{event.category_name + ', ' + event.duration + 'min'}</h2>
                        <label>
                          Ändra starttid:{' '}
                          <input
                            type="time"
                            name="start"
                            value={formatTime(editableEvent.start)}
                            onChange={handleChange}
                          />
                        </label>{' '}
                        <label>
                          Ändra sluttid:{' '}
                          <input type="time" name="end" value={formatTime(editableEvent.end)} onChange={handleChange} />
                        </label>{' '}
                        <button type="submit">Save</button>
                      </form>
                    ) : (
                      <>
                        <h2 className="intervalsheader">
                          <div>
                            {event.category_name + ', '} <span>{event.duration + 'min'}</span>
                          </div>
                          <div
                            className={`submenu ${
                              editIndex !== 0 && editIntervals.length === editIndex + 1 ? 'lastsubmenu' : ''
                            } ${openSubmenuIndex === editIndex ? 'open' : ''}`}
                          >
                            <button className="btn-add" onClick={() => handleAddInterval(event, editIndex)}>
                              {translate('schedule_add')}
                            </button>
                            {/* <button className="btn-setting">Editera</button> */}
                            <button className="btn-delete" onClick={() => handleDeletePass(event, editIndex)}>
                              {translate('schedule_delete')}
                            </button>
                          </div>
                          <button className="btn-submenu" onClick={() => handleSubmenuToggle(editIndex)}></button>
                        </h2>
                        <ul className="editintervals">
                          {event.singeldayrepeat === null
                            ? (() => {
                                const intervalIndex = findIntervalIndex(event.intervals, dayNameShort);
                                if (intervalIndex !== -1) {
                                  return renderIntervals(
                                    editIndex,
                                    event.intervals[intervalIndex].intervals,
                                    dayNameShort,
                                    event,
                                  );
                                }
                                return (
                                  <li>
                                    <span></span>Inga intervaller
                                  </li>
                                );
                              })()
                            : renderIntervals(editIndex, event.intervals, dayNameShort, event)}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
