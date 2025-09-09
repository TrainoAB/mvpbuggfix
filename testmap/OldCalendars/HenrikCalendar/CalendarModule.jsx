"use client";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useAppState } from "@/app/hooks/useAppState";
import CalendarDetails from "../Oldcopy/CalendarDetails";
import moment from "moment";
import "moment/locale/sv";
import "react-big-calendar/lib/css/react-big-calendar.css";

import "./CalendarModule.css";

/*
// Function to get the user's preferred language
const getUserLanguage = () => {
  const language = navigator.language || navigator.userLanguage;
  // Return 'sv' for Swedish, otherwise 'en' for English (default)
  return language.startsWith('sv') ? 'sv' : 'en';
};

 Get language from users browser 
// Set the locale based on the user's language
const userLanguage = getUserLanguage();
moment.locale(userLanguage);
*/

moment.locale("sv");

const localizer = momentLocalizer(moment);

export default function CalendarModule({ data, fetchedPasses }) {
    const { DEBUG } = useAppState();

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState([]);
    const [events, setEvents] = useState([]);

    /* If u want to get the language from users browsers 
  useEffect(() => {
    // Change the locale dynamically if needed
    moment.locale(userLanguage);
  }, [userLanguage]);
*/

    useEffect(() => {
        setEvents(data);
        DEBUG && console.log("Calendar data:", data);
    }, [data]);

    useEffect(() => {
        // Ensure the locale is set to Swedish
        moment.locale("sv");
    }, []);

    const handleSelectEvent = (event) => {
        DEBUG && console.log("Open Modal", event);
        setSelectedEvent(event);
        const selectedDate = moment(event.start).startOf("day");
        const eventsForSelectedDay = events.filter((e) => moment(e.start).isSame(selectedDate, "day"));
        setSelectedDateEvents(eventsForSelectedDay);

        DEBUG && console.log("Events for the day", eventsForSelectedDay);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        DEBUG && console.log("Close Modal");
        setModalIsOpen(false);
        setSelectedDateEvents([]);
        setSelectedEvent([]);
    };

    const updateEvent = (updatedEvent) => {
        const updatedEvents = events.map((event) => (event.pass_id === updatedEvent.pass_id ? updatedEvent : event));
        setEvents(updatedEvents);
        const selectedDate = moment(updatedEvent.start).startOf("day");
        const eventsForSelectedDay = updatedEvents.filter((e) => moment(e.start).isSame(selectedDate, "day"));
        setSelectedDateEvents(eventsForSelectedDay);
    };

    const Event = ({ event }) => {
        return (
            <div>
                {event.isbooked ? (
                    <div className="booked-event">
                        <i className="icon-booked"></i>
                    </div>
                ) : (
                    <div>
                        <strong>{event.category_name}</strong>
                        <p>{event.duration} min</p>
                    </div>
                )}
            </div>
        );
    };

    const eventPropGetter = (event) => {
        let backgroundColor = "#f2f2f2"; // default background color
        let color = "black"; // default text color

        // Customize the colors based on the event properties
        if (event.isbooked) {
            color = "white"; // Set text color to white for booked events
            backgroundColor = "var(--maincolor)"; // Set background to custom main color
        } else {
            switch (event.category_link) {
                case "cs2":
                    backgroundColor = "lightblue";
                    break;
                case "weight-lifting":
                    backgroundColor = "lightgreen";
                    break;
                case "golf":
                    backgroundColor = "lightcoral";
                    break;
                // Add more cases as needed
                default:
                    backgroundColor = "#f2f2f2"; // default background color
                    color = "black"; // default text color
            }
        }

        return {
            style: {
                backgroundColor,
                borderRadius: "5px",
                opacity: 0.8,
                color,
                border: "0px",
                display: "block",
            },
        };
    };

    return (
        <div id="calendar-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                components={{ event: Event }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
            />
            {modalIsOpen && (
                <CalendarDetails
                    selectedEvent={selectedEvent}
                    data={selectedDateEvents}
                    fetchedPasses={fetchedPasses}
                    onClose={closeModal}
                    onUpdate={updateEvent}
                />
            )}
        </div>
    );
}
