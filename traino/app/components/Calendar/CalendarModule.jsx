'use client';
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { useAppState } from '@/app/hooks/useAppState';
import CalendarDetails from './CalendarDetails';
import moment from 'moment-timezone';
import 'moment/locale/sv';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import './CalendarModule.css';

export default function CalendarModule({ data, setData, fetchedPasses, setFetchedSchedule }) {
  const { DEBUG, language, useTranslations } = useAppState();

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState([]);
  const [events, setEvents] = useState([]);

  const { translate } = useTranslations('schedule', language);

  const formats = {
    dayFormat: 'DD MMMM YYYY', // Customize as needed
    agendaDateFormat: 'DD MMMM YYYY', // Customize as needed
    eventTimeRangeFormat: ({ start, end }) =>
      `${moment(start).tz('Europe/Berlin').format('HH:mm')} - ${moment(end).tz('Europe/Berlin').format('HH:mm')}`, // 24-hour format
    eventTimeFormat: {
      // Use 24-hour format for individual events
      start: 'HH:mm',
      end: 'HH:mm',
    },
  };

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
moment.locale(language);
*/

  moment.locale(language);

  const localizer = momentLocalizer(moment);

  /* If u want to get the language from users browsers 
  useEffect(() => {
    // Change the locale dynamically if needed
    moment.locale(userLanguage);
  }, [userLanguage]);
*/

  useEffect(() => {
    setEvents(data);
    DEBUG && console.log('Calendar data:', data);
  }, [data]);

  useEffect(() => {
    // Ensure the locale is set to language
    moment.locale(language);
  }, []);

  const handleSelectEvent = (event) => {
    DEBUG && console.log('Open Modal', event);
    setSelectedEvent(event);
    const selectedDate = moment(event.start).startOf('day');
    const eventsForSelectedDay = events.filter((e) => moment(e.start).isSame(selectedDate, 'day'));
    setSelectedDateEvents(eventsForSelectedDay);

    DEBUG && console.log('Events for the day', eventsForSelectedDay);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    DEBUG && console.log('Close Modal');
    setModalIsOpen(false);
    setSelectedDateEvents([]);
    setSelectedEvent([]);
  };

  const updateEvent = (updatedEvent) => {
    const updatedEvents = events.map((event) => (event.pass_id === updatedEvent.pass_id ? updatedEvent : event));
    setEvents(updatedEvents);
    const selectedDate = moment(updatedEvent.start).startOf('day');
    const eventsForSelectedDay = updatedEvents.filter((e) => moment(e.start).isSame(selectedDate, 'day'));
    setSelectedDateEvents(eventsForSelectedDay);
  };

  const Event = ({ event }) => {
    return (
      <div>
        {event.isbooked ? (
          <div className="booked-event">
            {event.ispause !== 1 ? <i className="icon-booked"></i> : <span>Pause</span>}
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
    let backgroundColor = '#f2f2f2'; // default background color
    let color = 'black'; // default text color
    let display = 'block';
    let opacity = 0.8;

    // Customize the colors based on the event properties
    if (event.isbooked) {
      color = 'white'; // Set text color to white for booked events
      backgroundColor = 'var(--maincolor)'; // Set background to custom main color
    } else {
      switch (event.category_link) {
        case 'cs2':
          backgroundColor = 'lightblue';
          break;
        case 'weight-lifting':
          backgroundColor = 'lightgreen';
          break;
        case 'golf':
          backgroundColor = 'lightcoral';
          break;
        // Add more cases as needed
        default:
          backgroundColor = '#f2f2f2'; // default background color
          color = 'black'; // default text color
      }
    }

    if (event.ispause === 1) {
      backgroundColor = '#f2f2f2'; // default background color
      color = '#777'; // default text color
      opacity = 0.5;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity,
        color,
        border: '0px',
        display,
      },
    };
  };

  const messages = {
    today: translate('schedule_today'),
    previous: translate('schedule_previous'),
    next: translate('schedule_next'),
    month: translate('schedule_month'),
    week: translate('schedule_week'),
    day: translate('schedule_day'),
    agenda: translate('schedule_agenda'),
  };


  // MARK: Markup
  return (
    <div id="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        formats={formats}
        messages={messages}
        components={{ event: Event }}
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
      />
      {modalIsOpen && (
        <CalendarDetails
          selectedEvent={selectedEvent}
          data={events}
          setData={setEvents}
          fetchedPasses={fetchedPasses}
          setFetchedSchedule={setFetchedSchedule}
          onClose={closeModal}
          onUpdate={updateEvent}
        />
      )}
    </div>
  );
}
