import { useAppState } from '@/app/hooks/useAppState';
import { formatDateSwedish, formatTimeRange } from '@/app/functions/functions';
import './CancelModal.css';

export default function CancelModal({ cancelModal, setCancelModal, setBookedData }) {
  const { DEBUG, language, useTranslations, baseUrl, sessionObject } = useAppState();
  const { translate } = useTranslations('schedule', language);

  const handleCancelReasonChange = (event) => {
    setCancelModal((prev) => ({ ...prev, reason: event.target.value }));
  };

  const handleConfirmCancel = () => {
    DEBUG && console.log('Confirm cancel:', cancelModal.booking);
    DEBUG && console.log('Cancel reason:', cancelModal.reason);
    if (cancelModal.reason === '') {
      alert(translate('schedule_mustprovidereason', language));
      return;
    }

    const confirmCancel = confirm(translate('schedule_sureyouwanttocancel', language));

    if (confirmCancel) {
      const data = {
        booking_id: cancelModal.booking.id,
        reason: cancelModal.reason,
        booking: cancelModal.booking,
      };

      setBookedData((prevData) => {
        const updatedData = prevData.map((b) => {
          if (b.id === cancelModal.booking.id) {
            return {
              ...b,
              canceled: true,
              reason: cancelModal.reason,
            };
          }
          return b;
        });
        return updatedData;
      });

      const cancelBooking = async () => {
        try {
          const response = await fetch(`${baseUrl}/api/proxy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${baseUrl}/api/booking/cancel`,
              method: 'POST',
              body: JSON.stringify(data),
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          playSound('canceled', '0.5');
          const responseData = await response.json();
          DEBUG && console.log('Data:', responseData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      cancelBooking();

      // Stripe cancel pay back money
      setCancelModal({ show: false, booking: null, reason: '' });
    }
  };

  const handleCloseCancel = () => {
    setCancelModal({ show: false, booking: null, reason: '' });
  };

  // MARK: Markup
  return (
    <div className="cancelmodal-container">
      <div className="cancelmodal">
        <div className="categorytop">
          <div className="btn-back" onClick={handleCloseCancel}></div>
          <h2>{translate('schedule_canceledpass', language)}</h2>
        </div>
        <div className="cancelmodal-content">
          <h3>
            {cancelModal.booking && cancelModal.booking.category_name}
            {cancelModal.booking && cancelModal.booking.duration && `, ${cancelModal.booking.duration}min`}
          </h3>
          <h4>{cancelModal.booking && `${cancelModal.booking.user_firstname} ${cancelModal.booking.user_lastname}`}</h4>
          <p>{cancelModal.booking && formatDateSwedish(cancelModal.booking.booked_date)}</p>
          <p>{cancelModal.booking && formatTimeRange(cancelModal.booking.starttime, cancelModal.booking.endtime)}</p>

          <textarea
            value={cancelModal.reason}
            onChange={handleCancelReasonChange}
            placeholder={translate('schedule_cancelreason', language)}
          />
          <div className="cancelmodal-buttons">
            <button className="button onlyborder" onClick={handleCloseCancel}>
              {translate('cancel', language)}
            </button>
            <button className="button" onClick={handleConfirmCancel}>
              {translate('cancelbooking', language)}
            </button>
          </div>
        </div>
      </div>
      <div className="darkoverlay" onClick={handleCloseCancel}></div>
    </div>
  );
}
