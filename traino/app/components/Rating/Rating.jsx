'use client';
import React from 'react';
import { playSound } from '@/app/components/PlaySound';

import './Rating.css';

export default function Rating({ userDetails, handleViewRatings }) {
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
  return (
    <>
      {userDetails && userDetails.rating && userDetails.rating !== null && userDetails.rating !== 'null' && (
        <div
          className="rating"
          onClick={() => {
            playSound('popclick', '0.5');
            handleViewRatings();
          }}
          onMouseOver={() => playSound('tickclick', '0.5')}
        >
          <span className={showRatedIcon(userDetails.rating)}></span>
          {userDetails.rating}
        </div>
      )}
    </>
  );
}
