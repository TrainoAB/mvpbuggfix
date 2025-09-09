'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getTrainerReviews } from '@/app/functions/fetchDataFunctions.js';
import Link from 'next/link';
import Loader from '@/app/components/Loader';

import './ReadReview.css';

export default function ReadReview({ userId, onClose }) {
  const { DEBUG, baseUrl, sessionObject, useTranslations, language } = useAppState();
  const [reviews, setReviews] = useState(null);
  const [isFetched, setIsFetched] = useState(false);

  const { translate } = useTranslations('global', language);

  useEffect(() => {
    DEBUG && console.log('useEffect called with userId:', userId);
    if (userId) {
      getReviews(userId);
    }
  }, [userId]);

  const getReviews = async (userid) => {
    DEBUG && console.log('getReviews called with userid:', userid);
    try {
      const data = await getTrainerReviews(userId);
      DEBUG && console.log('Successfully fetched the data:', data);
      setReviews(data);
      setIsFetched(true);
    } catch (error) {
      DEBUG && console.error('Error fetching reviews:', error);
    }
  };

  const showRatedIcon = (rating) => {
    // Round the rating down to the nearest integer
    const ratingValue = Math.floor(rating);

    switch (ratingValue) {
      case 1:
        return 'icon-smiley-angry';
      case 2:
        return 'icon-smiley-noob';
      case 3:
        return 'icon-smiley-ok';
      case 4:
        return 'icon-smiley-happy';
      case 5:
        return 'icon-smiley-love';
      default:
        return 'icon-train'; // fallback if needed
    }
  };

  // MARK: Markup
  return (
    <>
      <div id="reviewmodal-container">
        <div className="reviewmodal">
          <div className="categorytop">
            <div className="btn-back" onClick={() => onClose(false)}></div>
            <h1>
              {reviews && reviews.trainer && reviews.trainer.name}{' '}
              <span>
                <strong>{reviews && reviews.trainer && reviews.trainer.rating}</strong>
              </span>
            </h1>
          </div>
          <div className="scrollreviews">
            <div className="content">
              {!isFetched ? (
                <Loader />
              ) : (
                <>
                  {reviews &&
                    reviews.reviews &&
                    reviews.reviews.map((item, index) => (
                      <div className="item" key={index}>
                        <div className="user">
                          <div className="thumbnail">
                            <Link href={'/trainee/' + item.user_id}>
                              <img
                                src={
                                  item.thumbnail === 1
                                    ? `https://traino.s3.eu-north-1.amazonaws.com/${item.user_id}/profile/profile-image.webp`
                                    : '/assets/icon-profile.svg'
                                }
                                alt=""
                              />
                            </Link>
                          </div>
                          <div>
                            <Link href={'/trainee/' + item.id}>{item.name}</Link>
                            <div className="rated">
                              {translate('rated', language)}:{' '}
                              <span className={showRatedIcon(item.rating)}> {item.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="description">"{item.description}"</div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
}
