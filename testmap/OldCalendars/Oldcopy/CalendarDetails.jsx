"use client";
import { useState, useEffect } from "react";
import { formatPassAmount } from "../../../traino/app/components/calendarfunctions";
import { useAppState } from "@/app/hooks/useAppState";
import "./CalendarDetails.css";

export default function CalendarDetails({ selectedEvent, data, fetchedPasses, onClose, onUpdate }) {
    const { DEBUG } = useAppState();
    const [intervalData, setIntervalData] = useState([]);
    const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);

    DEBUG && console.log("Data:", data);

    const handleSubmenuToggle = (index) => {
        setOpenSubmenuIndex(openSubmenuIndex === index ? null : index);
    };

    function createIntervals(array, fetchedPasses) {
        // Step 1: Extract unique (pass_repeat_id, category_link) pairs excluding isbooked: true
        const uniquePairs = [];
        array.forEach((item) => {
            if (!item.isbooked) {
                // Check if isbooked is not true
                const pair = { pass_repeat_id: item.pass_repeat_id, category_link: item.category_link };
                if (
                    !uniquePairs.some(
                        (existing) =>
                            existing.pass_repeat_id === pair.pass_repeat_id &&
                            existing.category_link === pair.category_link
                    )
                ) {
                    uniquePairs.push(pair);
                }
            }
        });

        // Step 2: Fetch objects from fetchedPasses where pass_repeat_id and category_link match unique pairs
        const result = uniquePairs.map((pair) => {
            return fetchedPasses.pass_set.find(
                (pass) => pass.pass_repeat_id === pair.pass_repeat_id && pass.category_link === pair.category_link
            );
        });

        return result;
    }

    const [editIntervals, setEditIntervals] = useState(() => {
        return createIntervals(data, fetchedPasses);
    });

    DEBUG && console.log("Todays Module Merged Data", editIntervals);
    DEBUG && console.log("Fetched Passes", fetchedPasses);

    const formatDate = (date) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const formattedDate = `${months[monthIndex]} ${day}, ${year} ${hours}:${minutes.toString().padStart(2, "0")}`;

        return formattedDate;
    };

    function formatTime(dateString) {
        if (!dateString) return ""; // Handle cases where dateString is undefined/null

        const date = new Date(dateString);
        let hours = date.getHours();
        let minutes = date.getMinutes();

        // Pad single digit hours and minutes with a leading zero
        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        return `${hours}:${minutes}`;
    }

    const handleEdit = (event) => {
        setEditableEvent(event);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [hour, minute] = value.split(":").map(Number);
        const newDate = editableEvent[name] ? new Date(editableEvent[name]) : new Date();
        newDate.setHours(hour);
        newDate.setMinutes(minute);
        setEditableEvent((prev) => ({
            ...prev,
            [name]: newDate,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate start and end times
        if (editableEvent.start >= editableEvent.end) {
            alert("Slut tiden måste vara efter start tiden. Var god justera och prova igen.");
            return;
        }

        // Proceed with updating the event
        onUpdate({
            ...editableEvent,
            duration: parseInt(editableEvent.duration, 10),
        });
        setEditableEvent(null);
    };

    // Function to get the day of the week in Swedish
    function getSwedishDay(dateString) {
        // Create a new Date object
        let date = new Date(dateString);

        // Array of days in Swedish
        let days = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

        // Get the day of the week (0-6)
        let dayIndex = date.getDay();

        // Return the corresponding day in Swedish
        return days[dayIndex];
    }

    // Build the header
    let formattedDate = formatDate(data[0].start);
    // Split the formatted date string at the first space
    let dateParts = formattedDate.split(" ");
    // Take the first part, which is the date part
    let dateOnly = dateParts[0] + " " + dateParts[1] + " " + dateParts[2];

    // Get the day of the week in Swedish
    let swedishDay = getSwedishDay(data[0].start);

    // Combine the Swedish day and the formatted date
    let formattedHeader = `${swedishDay}, ${dateOnly}`;

    const swedishToEnglishDayMap = {
        Måndag: "mon",
        Tisdag: "tue",
        Onsdag: "wed",
        Torsdag: "thu",
        Fredag: "fri",
        Lördag: "sat",
        Söndag: "sun",
    };

    const getEnglishDay = (swedishDay) => {
        return swedishToEnglishDayMap[swedishDay];
    };

    const findIntervalIndex = (intervals, swedishDay) => {
        const englishDay = getEnglishDay(swedishDay);
        return intervals.findIndex((interval) => interval.day === englishDay);
    };

    // EDIT INTERVALS
    const [editingEventIndex, setEditingEventIndex] = useState(null);
    const [editingIntervalIndex, setEditingIntervalIndex] = useState(null);
    const [editedInterval, setEditedInterval] = useState({ start: "", end: "" });
    const [editableEvent, setEditableEvent] = useState(null);

    const handleEditClick = (eventIndex, intervalIndex, interval) => {
        setEditingEventIndex(eventIndex);
        setEditingIntervalIndex(intervalIndex);
        setEditedInterval(interval);
    };

    const handleInputChange = (eventIndex, index, e) => {
        const { name, value } = e.target;

        setEditIntervals((prevIntervals) => {
            // Make a copy of the previous intervals array
            const newIntervals = [...prevIntervals];

            // Update the specific interval object at eventIndex and index
            newIntervals[eventIndex].intervals[index] = {
                ...newIntervals[eventIndex].intervals[index],
                [name]: value,
            };

            const passAmount = formatPassAmount(
                newIntervals[eventIndex].duration,
                newIntervals[eventIndex].intervals[index].start,
                newIntervals[eventIndex].intervals[index].end
            );

            // Update the specific interval object at eventIndex and index
            newIntervals[eventIndex].intervals[index] = {
                ...newIntervals[eventIndex].intervals[index],
                pass_amount: passAmount,
            };

            return newIntervals;
        });
    };

    const handleOkClick = (e) => {
        e.preventDefault();
        // Update the interval in your state here
        setEditingEventIndex(null);
        setEditingIntervalIndex(null);
    };

    const renderIntervals = (eventIndex, intervals, swedishDay) =>
        intervals.map((interval, index) => (
            <li
                key={index}
                className={editingEventIndex === eventIndex && editingIntervalIndex === index ? `liedit` : ``}
            >
                {editingEventIndex === eventIndex && editingIntervalIndex === index ? (
                    <>
                        <input
                            type="time"
                            name="start"
                            value={interval.start}
                            onChange={(e) => handleInputChange(eventIndex, index, e)}
                        />
                        -
                        <input
                            type="time"
                            name="end"
                            value={interval.end}
                            onChange={(e) => handleInputChange(eventIndex, index, e)}
                        />
                        <button className="button" onClick={handleOkClick}>
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
                        <button className="btn-remove">Remove</button>
                        <button className="btn-delete">Delete</button>
                    </>
                )}
            </li>
        ));

    return (
        <>
            <div className="modal calendardetails">
                {selectedEvent.isbooked === true ? (
                    <>
                        <div className="categorytop">
                            <div className="btn-back" onClick={() => onClose(false)}></div>
                            <h1>{data.length > 0 && formattedHeader}</h1>
                            <div></div>
                        </div>
                        <div className="calendardetailsscroll">
                            <div className="contain">
                                <div className="categoryimage">
                                    <div className="info">
                                        <h2>{selectedEvent.category_name}</h2>
                                        <div>
                                            {selectedEvent.product_type === "trainingpass"
                                                ? "Träningspass, "
                                                : selectedEvent.product_type === "onlinetraining"
                                                ? "Onlineträning, "
                                                : ""}
                                            <span>{`${selectedEvent.duration} min`}</span>
                                        </div>
                                    </div>
                                    <img src={selectedEvent.category_image} alt="" />
                                </div>
                                <div className="userinfo">
                                    <div className="column2">
                                        <div>
                                            <div className="time">{`${selectedEvent.starttime.slice(
                                                0,
                                                -3
                                            )} - ${selectedEvent.endtime.slice(0, -3)}`}</div>
                                            <div className="name">{`${selectedEvent.user_firstname} ${selectedEvent.user_lastname}`}</div>
                                            <div className="address">Plats: {selectedEvent.address}</div>
                                        </div>

                                        <a href={`mailto:${selectedEvent.user_email}`} className="button emailbutton">
                                            Email
                                        </a>
                                    </div>
                                    <p className="description">{selectedEvent.description}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="categorytop">
                            <div className="btn-back" onClick={() => onClose(false)}></div>
                            <h1>{editIntervals.length > 0 && formattedHeader}</h1>
                            <div></div>
                        </div>
                        <div className="calendardetailsscroll">
                            <div className="contain">
                                {editIntervals &&
                                    editIntervals.map((event, editIndex) => (
                                        <div key={editIndex} className="calendardetails-content">
                                            {editableEvent && editableEvent.pass_id === event.pass_id ? (
                                                <form onSubmit={handleSubmit}>
                                                    <h2>{event.category_name + ", " + event.duration + "min"}</h2>
                                                    <label>
                                                        Ändra starttid:{" "}
                                                        <input
                                                            type="time"
                                                            name="start"
                                                            value={formatTime(editableEvent.start)}
                                                            onChange={handleChange}
                                                        />
                                                    </label>{" "}
                                                    <label>
                                                        Ändra sluttid:{" "}
                                                        <input
                                                            type="time"
                                                            name="end"
                                                            value={formatTime(editableEvent.end)}
                                                            onChange={handleChange}
                                                        />
                                                    </label>{" "}
                                                    <button type="submit">Save</button>
                                                </form>
                                            ) : (
                                                <>
                                                    <h2 className="intervalsheader">
                                                        <div>
                                                            {event.category_name + ", "}{" "}
                                                            <span>{event.duration + "min"}</span>
                                                        </div>
                                                        <div
                                                            className={`submenu ${
                                                                editIndex !== 0 &&
                                                                editIntervals.length === editIndex + 1
                                                                    ? "lastsubmenu"
                                                                    : ""
                                                            } ${openSubmenuIndex === editIndex ? "open" : ""}`}
                                                        >
                                                            <button className="btn-add">Lägg till</button>
                                                            <button className="btn-setting">Editera</button>
                                                            <button className="btn-delete">Ta bort</button>
                                                        </div>
                                                        <button
                                                            className="btn-submenu"
                                                            onClick={() => handleSubmenuToggle(editIndex)}
                                                        ></button>
                                                    </h2>
                                                    <ul className="editintervals">
                                                        {event.singeldayrepeat === null
                                                            ? (() => {
                                                                  const intervalIndex = findIntervalIndex(
                                                                      event.intervals,
                                                                      swedishDay
                                                                  );
                                                                  if (intervalIndex !== -1) {
                                                                      return renderIntervals(
                                                                          editIndex,
                                                                          event.intervals[intervalIndex].intervals,
                                                                          swedishDay
                                                                      );
                                                                  }
                                                                  return (
                                                                      <li>Inga intervaller funna för {swedishDay}</li>
                                                                  );
                                                              })()
                                                            : renderIntervals(editIndex, event.intervals, swedishDay)}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="darkoverlay" onClick={() => onClose(false)}></div>
        </>
    );
}
