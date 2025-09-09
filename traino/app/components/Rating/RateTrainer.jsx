'use client';
import { useEffect, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getCookie } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import Loader from '@/app/components/Loader';

import './RateTrainer.css';

export default function RateTrainer({ userinput, onClose }) {
  const { DEBUG, baseUrl, sessionObject, useTranslations, language } = useAppState();
  const [selectedRating, setSelectedRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const { translate } = useTranslations('rate', language);

  const userid = getCookie('user_id');
  const rateuserid = userinput.id;

  const data = {
    id: userinput.id,
    firstname: userinput.firstname,
    lastname: userinput.lastname,
  };

  const handleRatingChange = (rating, event) => {
    if (loading) return;
    event.stopPropagation(); // Prevent event bubbling
    playSound('select', '0.5');
    setSelectedRating(rating);
  };

  const handleFeedbackChange = (event) => {
    setFeedback(event.target.value);
  };

  const handleFirstClick = (event) => {
    event.preventDefault();

    if (selectedRating < 1 || selectedRating > 5) {
      alert(translate('rate_mustchoosebetween1and5', language));
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    saveRating(selectedRating, userid, rateuserid);
  };

  const handleSecondClick = (event) => {
    event.preventDefault();

    if (feedback.length < 10) {
      alert(translate('rate_youmustwritemorethan10letters', language));
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    saveRatingDescription(feedback, userid, rateuserid);
  };

  const saveRating = async (rating, userid, rateuserid) => {
    setLoading(true);

    try {
      const action = 'saveRating';
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `${baseUrl}/api/proxy`,
          'Content-Type': 'application/json', // Adjust content type if necessary
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/rate/trainer`,
          method: 'POST',
          body: JSON.stringify({
            action: action,
            rating: rating,
            userid: userid,
            rateuserid: rateuserid,
          }),
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error('Failed to save rating');
      }

      const data = await response.json();
      DEBUG && console.log('Rating saved successfully:', data);
      playSound('done', '0.5');
      setRated(true);
      setLoading(false);
    } catch (error) {
      console.error('Error saving rating:', error);
      setLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveRatingDescription = async (feedback, userid, rateuserid) => {
    setLoading(true);
    try {
      const action = 'saveRatingDescription';

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/rate/trainer`,
          method: 'POST',
          body: JSON.stringify({
            action: action,
            feedback: feedback,
            userid: userid,
            rateuserid: rateuserid,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save rating');
      }

      const data = await response.json();
      DEBUG && console.log('Rating saved successfully:', data);
      playSound('done2', '0.5');
      onClose(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // MARK: Markup
  return (
    <>
      <div id="ratemodal-container">
        <div className="ratemodal">
          <div className="categorytop">
            <div className="btn-back" onClick={() => onClose(false)}></div>
            <h1>{translate('rate_ratetrainer', language)}</h1>
            <div></div>
          </div>
          <div className="content">
            <h3>{data.firstname + ' ' + data.lastname}</h3>
            <hr />
            {!rated ? (
              <>
                <form action="">
                  <div className="rating">
                    {[5, 4, 3, 2, 1].map((rate) => (
                      <div
                        key={rate}
                        className={`rate ${selectedRating >= rate ? 'active' : ''}`}
                        onClick={(e) => handleRatingChange(rate, e)}
                        onMouseEnter={() => playSound('popclick', 0.5)}
                      >
                        <span>{rate}</span>
                        <input
                          type="radio"
                          name="rating"
                          value={rate}
                          checked={selectedRating === rate}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                        <div className="icon-train"></div>
                      </div>
                    ))}
                  </div>

                  {!loading ? (
                    <button className="button" onClick={handleFirstClick}>
                      {translate('rate', language)}
                    </button>
                  ) : (
                    <div className="buttonloader">
                      <Loader />
                    </div>
                  )}
                </form>
              </>
            ) : (
              <>
                <form action="">
                  <textarea
                    name="descrition"
                    id=""
                    placeholder={translate('rate_explainrating', language)}
                    value={feedback}
                    onChange={handleFeedbackChange}
                  ></textarea>
                  <br />

                  {!loading ? (
                    <button className="button" onClick={handleSecondClick}>
                      {translate('save', language)}
                    </button>
                  ) : (
                    <div className="buttonloader">
                      <Loader />
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
}
