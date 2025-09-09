'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getSwedishDay } from './calendarfunctions';

import EventBooked from './EventBooked';
import EventEdit from './EventEdit';
import './CalendarDetails.css';

export default function CalendarDetails({
  selectedEvent,
  data,
  setData,
  fetchedPasses,
  setFetchedSchedule,
  onClose,
  onUpdate,
}) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('calendar', language);

  DEBUG && console.log('Data:', data);
  DEBUG && console.log('Fetched Passes', fetchedPasses);

  /*   const formatDate = (date) => {
    // Translate months
    const months = [
      translate('january', language).slice(0, 3),
      translate('february', language).slice(0, 3),
      translate('march', language).slice(0, 3),
      translate('april', language).slice(0, 3),
      translate('may', language).slice(0, 3),
      translate('june', language).slice(0, 3),
      translate('july', language).slice(0, 3),
      translate('august', language).slice(0, 3),
      translate('september', language).slice(0, 3),
      translate('october', language).slice(0, 3),
      translate('november', language).slice(0, 3),
      translate('december', language).slice(0, 3),
    ];
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedDate = `${months[monthIndex]} ${day}, ${year} ${hours}:${minutes
      .toString()
      .padStart(2, '0')}`;

    return formattedDate;
  };

  // Build the header
  let formattedDate = formatDate(data[0].start);
  // Split the formatted date string at the first space
  let dateParts = formattedDate.split(' ');
  // Take the first part, which is the date part
  let dateOnly = dateParts[0] + ' ' + dateParts[1] + ' ' + dateParts[2];

  // Get the day of the week in Swedish
  let swedishDay = getSwedishDay(data[0].start);

  // Combine the Swedish day and the formatted date
  let formatedHeader = `${swedishDay}, ${dateOnly}`; */

  // MARK: Markup
  return (
    <>
      <div className="modal calendardetails">
        {selectedEvent.isbooked === true && selectedEvent.ispause !== 1 ? (
          <EventBooked selectedEvent={selectedEvent} onClose={onClose} />
        ) : (
          <EventEdit
            selectedEvent={selectedEvent}
            data={data}
            setData={setData}
            fetchedPasses={fetchedPasses}
            setFetchedSchedule={setFetchedSchedule}
            onClose={onClose}
            onUpdate={onUpdate}
            isPause={selectedEvent.ispause}
          />
        )}
      </div>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
}
