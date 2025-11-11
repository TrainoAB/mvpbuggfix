'use client';
import { useEffect, useState } from 'react';
import { formatDateToWord, formatDateToNumber, getTimeRange, formatTimeRange } from '@/app/functions/functions';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/app/components/Loader';
import Navigation from '@/app/components/Menus/Navigation';
import BookingDetails from './BookingDetails';
import CancellationModal from '@/app/components/CancellationModal';
import CancelModal from '@/app/components/CancelModal';

import './page.css';

export default function Bookings({ params }) {
  const { DEBUG, useTranslations, language, baseUrl, sessionObject } = useAppState();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [sortedBookings, setSortedBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);

  const [cancelModal, setCancelModal] = useState({ show: false, booking: null, reason: '' });
  const [bookedData, setBookedData] = useState([]);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();

  const { translate } = useTranslations('global', language);

  // Function to update all booking states
  const updateBookingStates = (bookingsData) => {
    // Ensure bookingsData is an array
    const safeBookingsData = Array.isArray(bookingsData) ? bookingsData : [];

    const newFiltered = safeBookingsData.filter((booking) => booking && booking.ispause !== 1);
    const newSorted = newFiltered.sort((a, b) => {
      // Safe date parsing
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });

    const todayBook = newSorted.filter((booking) => {
      if (!booking.date) return false;
      const bookingDate = booking.date.split(' ')[0];
      return bookingDate === today;
    });

    const upcomingBook = newSorted.filter((booking) => {
      if (!booking.date) return false;
      const bookingDate = booking.date.split(' ')[0];
      return bookingDate !== today;
    });

    setFilteredBookings(newFiltered);
    setSortedBookings(newSorted);
    setTodayBookings(todayBook);
    setUpcomingBookings(upcomingBook);
  };

  useEffect(() => {
    // Early return if required data is missing
    if (!params?.user_id) {
      DEBUG && console.log('Bookings: Missing user_id parameter');
      setLoading(false);
      return;
    }

    if (!sessionObject?.token) {
      DEBUG && console.log('Bookings: Missing session token, waiting...');
      return;
    }

    const getBookings = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/getbooking?id=${params.user_id}`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        });

        const rawResponse = await response.text();
        DEBUG && console.log('Raw Response:', rawResponse);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}, Body: ${rawResponse}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response but received: ' + contentType);
        }

        let bookingResponse;
        try {
          bookingResponse = JSON.parse(rawResponse);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          throw new Error('Invalid JSON response from server');
        }

        // Handle different response structures
        let bookedData = [];

        if (bookingResponse) {
          // If response has a data property, use it
          if (bookingResponse.data !== undefined) {
            bookedData = Array.isArray(bookingResponse.data) ? bookingResponse.data : [];
          }
          // If response is directly an array
          else if (Array.isArray(bookingResponse)) {
            bookedData = bookingResponse;
          }
          // If response has bookings property
          else if (bookingResponse.bookings !== undefined) {
            bookedData = Array.isArray(bookingResponse.bookings) ? bookingResponse.bookings : [];
          }
          // Handle error responses
          else if (bookingResponse.error) {
            console.warn('API returned error:', bookingResponse.error);
            bookedData = [];
          }
        }

        DEBUG && console.log('Processed booking data:', bookedData);

        // Ensure bookedData is always an array
        const finalBookingsData = Array.isArray(bookedData) ? bookedData : [];

        setBookings(finalBookingsData);
        updateBookingStates(finalBookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Set empty array on error to show "no bookings" message
        setBookings([]);
        updateBookingStates([]);
      } finally {
        setLoading(false);
      }
    };

    getBookings();
  }, [params, sessionObject?.token]);

  /* // Sort bookings by date
  const filteredBookings = bookings.filter((booking) => booking.ispause !== 1);
  const sortedBookings = filteredBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Separate bookings into 'today' and 'upcoming'
  const todayBookings = sortedBookings.filter((booking) => booking.date.split(' ')[0] === today);
  const upcomingBookings = sortedBookings.filter((booking) => booking.date.split(' ')[0] !== today); */

  const handleCloseCancel = () => {
    setCancelModal({ show: false, booking: null, reason: '' });
    setCancelError('');
    setCancelLoading(false);
  };

  const handleConfirmCancel = async () => {
    if (cancelModal.booking) {
      setCancelLoading(true);
      setCancelError('');

      try {
        // Call the cancel booking function with the specific booking
        await handleCancelBooking(cancelModal.booking, cancelModal.reason, cancelModal);

        // Update all booking states after successful cancellation
        const updatedBookings = bookings.map((booking) => {
          if (booking.id === cancelModal.booking.id) {
            return { ...booking, canceled: true, reason: cancelModal.reason };
          }
          return booking;
        });

        setBookings(updatedBookings);
        updateBookingStates(updatedBookings);

        handleCloseCancel();

        // Show success message (you can implement a toast notification here)
        DEBUG && console.log('Booking cancelled successfully');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        setCancelError('Failed to cancel booking. Please try again.');
        setCancelLoading(false);
      }
    }
  };

  const handleCancelReasonChange = (event) => {
    setCancelModal((prev) => ({ ...prev, reason: event.target.value }));
  };

  const handleCancelClick = (booking) => {
    setCancelModal({ show: true, booking, reason: '' });
  };

  const handleBack = () => {
    router.back();
  };

  async function handleCancelBooking(booking, reason = '', modalData = null) {
    try {
      DEBUG && console.log('Cancelling booking:', booking.id, 'with reason:', reason, 'Modal Data:', modalData);

      // Cancel booking in database
      const cancelResponse = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/booking/cancel`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: booking.id,
            reason: reason,
            booking: booking,
            canceled_by: 'trainee',
          }),
        }),
      });

      const cancelResponseData = await cancelResponse.json();
      DEBUG && console.log('Cancel response:', cancelResponseData);

      if (!cancelResponse.ok) {
        throw new Error(`Failed to cancel booking in database: ${cancelResponseData.message || 'Unknown error'}`);
      }

      DEBUG && console.log('Booking cancelled in database successfully (refund initiated by server)');

      setModal(false); // Close the modal if it's open
    } catch (error) {
      console.error('Error in handleCancelBooking:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  const handleBookingClick = (booking) => {
    playSound('popclick', '0.5');
    setBookingDetails(booking);
    setModal(true);
  };

  // MARK: Markup
  return (
    <main id="bookings">
      <Navigation />

      {modal && bookingDetails && (
        <BookingDetails data={bookingDetails} onClose={() => setModal(false)} onCancel={handleCancelClick} />
      )}

      <CancellationModal
        show={cancelModal.show}
        booking={cancelModal.booking}
        reason={cancelModal.reason}
        onClose={handleCloseCancel}
        onConfirm={handleConfirmCancel}
        onReasonChange={handleCancelReasonChange}
        loading={cancelLoading}
        error={cancelError}
      />

      <div className="categorytop">
        <div className="btn-back" onClick={handleBack}></div>
        <h1>{translate('bookings', language)}</h1>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="scrollcontent">
            {Array.isArray(bookings) && bookings.length > 0 ? (
              <div className="content">
                {Array.isArray(todayBookings) && todayBookings.length > 0 && (
                  <div className="booking-container">
                    <h2>Idag</h2>
                    {todayBookings.map((booking, index) => {
                      // Safety check for booking object
                      if (!booking || !booking.sport) {
                        DEBUG && console.warn('Invalid booking object:', booking);
                        return null;
                      }

                      return (
                        <div
                          key={index}
                          className={`booking-item ${booking.canceled ? 'canceled' : ''}`}
                          onMouseOver={!booking.canceled ? () => playSound('tickclick', '0.5') : undefined}
                          onClick={!booking.canceled ? () => handleBookingClick(booking) : undefined}
                        >
                          <div className="sport">
                            <h3>{booking.sport?.category_name || 'Unknown Sport'}</h3>
                            {booking.sport?.category_image && (
                              <Image
                                src={booking.sport.category_image}
                                alt=""
                                fill="all"
                                style={{ objectFit: 'cover' }}
                                priority
                              />
                            )}
                          </div>
                          {booking.canceled && <div className="icon-canceld"></div>}
                          <div className="details">
                            <div className="date">
                              {booking.date && formatDateToNumber(booking.date)}
                              {booking.date && translate(formatDateToWord(booking.date), language)}
                            </div>
                            <div className="time">{booking.time || 0} min</div>
                            <div className="duration">
                              {booking.starttime && booking.endtime
                                ? formatTimeRange(booking.starttime, booking.endtime)
                                : booking.date && booking.time
                                ? getTimeRange(booking.date, booking.time)
                                : ''}
                            </div>
                            <div className="address">{booking.address || ''}</div>
                          </div>
                          {booking.canceled && booking.reason && <div className="reason">"{booking.reason}"</div>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {Array.isArray(upcomingBookings) && upcomingBookings.length > 0 && (
                  <div className="booking-container">
                    <h2>{translate('upcoming', language)}</h2>
                    {upcomingBookings.map((booking, index) => {
                      // Safety check for booking object
                      if (!booking || !booking.sport) {
                        DEBUG && console.warn('Invalid upcoming booking object:', booking);
                        return null;
                      }

                      return (
                        <div
                          key={index}
                          className={`booking-item ${booking.canceled ? 'canceled' : ''}`}
                          onMouseOver={!booking.canceled ? () => playSound('tickclick', '0.5') : undefined}
                          onClick={!booking.canceled ? () => handleBookingClick(booking) : undefined}
                        >
                          <div className="sport">
                            <h3>
                              {booking.sport?.category_link
                                ? translate(`cat_${booking.sport.category_link}`)
                                : 'Unknown Sport'}
                            </h3>
                            {booking.sport?.category_image && (
                              <Image
                                src={booking.sport.category_image}
                                alt=""
                                fill="all"
                                style={{ objectFit: 'cover' }}
                                priority
                              />
                            )}
                          </div>
                          {booking.canceled && <div className="icon-canceld"></div>}
                          <div className="details">
                            <div className="date">
                              {booking.date && formatDateToNumber(booking.date)}{' '}
                              {booking.date && translate(formatDateToWord(booking.date), language)}
                            </div>
                            <div className="time">{booking.time || 0} min</div>
                            <div className="duration">
                              {booking.starttime && booking.endtime
                                ? formatTimeRange(booking.starttime, booking.endtime)
                                : ''}
                            </div>
                            <div className="address">{booking.address || ''}</div>
                          </div>
                          {booking.canceled && booking.reason && <div className="reason">"{booking.reason}"</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
                <br />
                <br />
              </div>
            ) : (
              <div className="content">
                <div className="no-bookings-container">
                  <h2 className="nobooking">{translate('youhavenobookings', language)}</h2>
                  <p>{translate('book_your_first_session', language)}</p>
                  <Link href="/train" className="button">
                    {translate('find_trainers', language)}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
