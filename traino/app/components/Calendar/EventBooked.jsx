import { useAppState } from '@/app/hooks/useAppState';
import { formatTimeRange } from '@/app/functions/functions';

export default function EventBooked({ selectedEvent, onClose }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('schedule', language);

  DEBUG && console.log('Booked Event:', selectedEvent);

  // Create a Date object
  const eventDate = new Date(selectedEvent.start);

  // Format the date to get "Sunday, November 03, 2024"
  const fullDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(eventDate);

  // Extract the day name and month name separately
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(eventDate);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(eventDate);
  const dayOfMonth = new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(eventDate);
  const year = eventDate.getFullYear();

  return (
    <>
      <div className="categorytop">
        <div className="btn-back" onClick={() => onClose(false)}></div>
        <h1>{`${dayName}, ${monthName}, ${dayOfMonth}, ${year}`}</h1>
        <div></div>
      </div>
      <div className="calendardetailsscroll">
        <div className= {`contain ${selectedEvent.canceled ? 'canceled-event' : ''}`}>
          <div className="categoryimage">
            <div className="info">
              <h2>{selectedEvent.category_name}</h2>
              <div>
                {selectedEvent.product_type === 'trainingpass'
                  ? `${translate('trainingpass', language)}, `
                  : selectedEvent.product_type === 'onlinetraining'
                  ? `${translate('onlinetraining', language)}, `
                  : ''}
                <span>{`${selectedEvent.duration} min`}</span>
              </div>
            </div>
            <img src={selectedEvent.category_image} alt="" />
          </div>
          <div className="userinfo">
            <div className="column2">
              <div>
                <div className="time">{formatTimeRange(selectedEvent.starttime, selectedEvent.endtime)}</div>
                <div className="name">{`${selectedEvent.user_firstname} ${selectedEvent.user_lastname}`}</div>
                <div className="address">
                  {translate('place', language)}: {selectedEvent.address}
                </div>
              </div>

              <a href={`mailto:${selectedEvent.user_email}`} className="button emailbutton">
                {translate('email', language)}
              </a>
            </div>
            <p className="description">{selectedEvent.description}</p>
            {selectedEvent.canceled === 1 && <p className="canceled-pass">{translate('schedule_canceledpass', language)}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
