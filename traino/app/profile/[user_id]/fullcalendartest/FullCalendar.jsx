import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import svLocale from '@fullcalendar/core/locales/sv';
import { RRule } from 'rrule';

const FullCalendarComponent = () => {
  const [events, setEvents] = useState([
    {
      title: 'Recurring Event',
      rrule: {
        freq: 'weekly',
        interval: 1,
        byweekday: ['mo', 'we', 'fr'],
        dtstart: '2024-06-01T10:00:00',
        until: '2024-08-01',
      },
    },
    {
      title: 'Single Day Event',
      start: '2024-06-07',
      allDay: true,
    },
  ]);

  const [exceptions, setExceptions] = useState([]);

  const handleDateSelect = (selectInfo) => {
    const title = prompt('Enter Event Title:');
    if (title) {
      let calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); // clear date selection
      setEvents([
        ...events,
        {
          id: String(events.length + 1),
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          allDay: selectInfo.allDay,
        },
      ]);
    }
  };

  const handleEventClick = (clickInfo) => {
    const title = prompt('Edit Event Title:', clickInfo.event.title);
    if (title) {
      const updatedEvents = events.map((event) => {
        if (event.id === clickInfo.event.id) {
          if (event.rrule) {
            // This is a recurring event, create an exception
            const newException = {
              id: String(events.length + exceptions.length + 1),
              title,
              start: clickInfo.event.startStr,
              allDay: clickInfo.event.allDay,
            };
            setExceptions([...exceptions, newException]);

            // Update the rrule to exclude this date
            const rule = new RRule({
              ...event.rrule,
              exdate: [new Date(clickInfo.event.start)],
            });
            return {
              ...event,
              rrule: rule.toString(),
            };
          } else {
            // This is a single event
            return {
              ...event,
              title,
            };
          }
        }
        return event;
      });
      setEvents(updatedEvents);
    }
  };

  useEffect(() => {
    console.log(events);
    console.log(exceptions);
  }, [events, exceptions]);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
      }}
      locale={svLocale}
      editable={true}
      selectable={true}
      select={handleDateSelect}
      eventClick={handleEventClick}
      events={[...events, ...exceptions]}
      initialView="dayGridMonth"
    />
  );
};

export default FullCalendarComponent;
