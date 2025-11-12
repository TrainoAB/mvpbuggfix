import React, { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { formatDateSwedish, formatTimeRange } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import CancelModal from '@/app/components/CancelModal';
import Link from 'next/link';
import Image from 'next/image';

export default function Bookings({ bookedData, setBookedData }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('schedule', language);
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null, reason: '' });
  const [expandedItem, setExpandedItem] = useState(null);
  const [toggleCanceled, setToggleCanceled] = useState(false);

  const toggleAccordion = (event, index) => {
    event.preventDefault();
    event.stopPropagation();

    if (expandedItem === index) {
      setExpandedItem(null);
    } else {
      setExpandedItem(index);
    }
  };

  const handleCheckboxChange = (index) => {
    setBookedData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index].userShowedUp = !updatedData[index].userShowedUp;
      return updatedData;
    });
  };

  const toggleCancelMenu = (index) => {
    console.log('[DEBUG] toggleCancelMenu called with index:', index);

    setBookedData((prevData) => {
      const updatedData = prevData.map((booking, i) => ({
        ...booking,
        showCancelMenu: i === index ? !booking.showCancelMenu : false,
      }));

      console.log('[DEBUG] setBookedData called. New state:', updatedData);

      return updatedData;
    });
  };

  const handleCancelClick = (booking) => {
    setCancelModal({ show: true, booking, reason: '' });
  };

  const handleToggleCanceled = () => {
    playSound('check', '0.5');
    setToggleCanceled((prevToggle) => !prevToggle);
  };

  const isShowedUpVisible = (bookingDate, startTime) => {
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const now = new Date();
    const tenMinutesBefore = new Date(bookingDateTime.getTime() - 10 * 60 * 1000);
    return now >= tenMinutesBefore && now <= bookingDateTime;
  };

  const canShowCancelMenu = (bookingDate, startTime) => {
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const now = new Date();
    return now < bookingDateTime; // Allow cancel up to start time for trainer
  };

  // MARK: Markup
  return (
    <div className="bookedcontent">
      {(!bookedData || bookedData.length === 0) && (
        <h3 className="nobooking">{translate('schedule_nobookings', language)}</h3>
      )}

      {bookedData && bookedData.length > 0 && (
        <>
          <h3>{translate('schedule_bookings', language)}</h3>
          <div className="checkboxes">
            <div className="input-group">
              <label htmlFor="togglecanceled" className="rememberme" onMouseOver={() => playSound('tickclick', '0.5')}>
                <input
                  className="hiddencheckbox"
                  type="checkbox"
                  id="togglecanceled"
                  checked={toggleCanceled}
                  onChange={handleToggleCanceled}
                />
                <span className="customcheckbox"></span>
                {translate('schedule_toggle', language)}
              </label>
            </div>
          </div>

          {bookedData.map((booking, index) => {
            if (booking.ispause === 1) return null;
            const formattedDate = formatDateSwedish(booking.booked_date);

            // Debug logging to see the actual data format
            DEBUG &&
              console.log('Booking data:', {
                starttime: booking.starttime,
                endtime: booking.endtime,
                starttime_type: typeof booking.starttime,
                endtime_type: typeof booking.endtime,
                booking_data: booking,
              });

            const formattedTime = formatTimeRange(booking.starttime, booking.endtime);

            return (
              <React.Fragment key={`booking-${booking.id || index}-${booking.booked_date}-${booking.starttime}`}>
                {booking.canceled ? (
                  <>
                    {toggleCanceled ? null : (
                      <div className="bookingitem canceld">
                        <div className="header" onClick={(event) => toggleAccordion(event, index)}>
                          <b>{translate('schedule_canceledpass', language)}: </b>
                          {`${formattedDate}, ${formattedTime}`}
                          <div className="icon-canceld"></div>
                        </div>
                        <div className="categoryimage" onClick={(event) => toggleAccordion(event, index)}>
                          <div className="info">
                            <h2>{booking.category_name}</h2>
                            <div>
                              {booking.product_type === 'trainingpass'
                                ? `${translate('trainingpass', language)}, `
                                : booking.product_type === 'onlinetraining'
                                ? `${translate('onlinetraining', language)}, `
                                : ''}
                              <span>{`${booking.duration} min`}</span>
                            </div>
                          </div>
                          <Image
                            src={booking.category_image}
                            alt=""
                            fill="all"
                            style={{ objectFit: 'cover' }}
                            priority
                          />
                        </div>
                        <div className="userinfo">
                          <div className="column2">
                            <div className="column2details">
                              <b>
                                {translate('schedule_bookedby', language)}{' '}
                                <Link className="name" href={`/trainee/${booking.user_id}`}>
                                  {`${booking.user_firstname} ${booking.user_lastname}`}
                                </Link>
                              </b>
                              {booking.reason && (
                                <div>
                                  <b>{translate('schedule_cancelreason', language)}: </b>"{booking.reason}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`bookingitem ${expandedItem === index ? 'expanded' : ''}`}>
                    <div className="header" onClick={(event) => toggleAccordion(event, index)}>
                      {`${formattedDate}, ${formattedTime}`}
                      <div className="accordionicon"></div>
                    </div>
                    <div className="categoryimage" onClick={(event) => toggleAccordion(event, index)}>
                      <div className="info">
                        <h2>{booking.category_name}</h2>
                        <div>
                          {booking.product_type === 'trainingpass'
                            ? `${translate('trainingpass', language)}, `
                            : booking.product_type === 'onlinetraining'
                            ? `${translate('onlinetraining', language)}, `
                            : ''}
                          <span>{`${booking.duration} min`}</span>
                        </div>
                      </div>
                      <Image src={booking.category_image} alt="" fill="all" style={{ objectFit: 'cover' }} priority />
                    </div>
                    <div className="userinfo">
                      <div className="column2">
                        <div className="column2details">
                          <b>
                            {translate('schedule_bookedby', language)} <br />
                          </b>
                          <b>
                            <Link className="name" href={`/trainee/${booking.user_id}`}>
                              {`${booking.user_firstname} ${booking.user_lastname}`}
                            </Link>
                          </b>
                          <div className="address">{booking.address}</div>
                        </div>

                        <a href={`mailto:${booking.user_email}`} className="button emailbutton">
                          {translate('email', language)}
                        </a>
                      </div>
                    </div>
                    {expandedItem === index && (
                      <div className="expandinfo">
                        <p className="description">{booking.description}</p>
                        <div className="column2">
                          <div className="checkboxes">
                            {isShowedUpVisible(booking.booked_date, booking.starttime) && (
                              <div className="input-group">
                                <input
                                  type="checkbox"
                                  id={`usershowedup${index}`}
                                  checked={booking.userShowedUp}
                                  onChange={() => handleCheckboxChange(index)}
                                />
                                <label htmlFor={`usershowedup${index}`}>
                                  {translate('schedule_traineeshowedup', language)}
                                </label>
                              </div>
                            )}
                          </div>
                          <div className="moremenu-container">
                            {canShowCancelMenu(booking.booked_date, booking.starttime) && (
                              <>
                                <button className="moremenu" onClick={() => toggleCancelMenu(index)}></button>
                                {booking.showCancelMenu && (
                                  <ul className="moremenuopen">
                                    <li>
                                      <button className="noborder" onClick={() => handleCancelClick(booking)}>
                                        {translate('schedule_cancelpass', language)}
                                      </button>
                                    </li>
                                  </ul>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}
      {cancelModal.show && (
        <CancelModal cancelModal={cancelModal} setCancelModal={setCancelModal} setBookedData={setBookedData} />
      )}
    </div>
  );
}
